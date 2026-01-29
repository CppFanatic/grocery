import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import MainView from './components/MainView';
import StoreSelector from './components/StoreSelector';
import { useApi } from './hooks/useApi';
import './App.css';

// Lazy load components that aren't immediately needed
const CategoryView = lazy(() => import('./components/CategoryView'));
const BottomPanel = lazy(() => import('./components/BottomPanel'));

// Helper functions for localStorage
const getStoredValue = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : defaultValue;
  } catch (e) {
    console.warn(`⚠️ [App] Error reading from localStorage (${key}):`, e);
    return defaultValue;
  }
};

const setStoredValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`⚠️ [App] Error writing to localStorage (${key}):`, e);
  }
};

function App() {
  const [cart, setCart] = useState([]); // Local cache of server cart
  const [cartId, setCartId] = useState(null); // Server cart ID
  const [cartVersion, setCartVersion] = useState(null); // Server cart version for optimistic concurrency
  const [checkoutSuccess, setCheckoutSuccess] = useState(null); // Timestamp of last successful checkout
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Load settings from localStorage on init
  const [apiUrl, setApiUrl] = useState(() => getStoredValue('apiUrl', 'http://localhost:3005'));
  const [authToken, setAuthToken] = useState(() => getStoredValue('authToken', ''));
  const [selectedStore, setSelectedStore] = useState(null);
  const [mainsData, setMainsData] = useState(null);
  const [mainsLoading, setMainsLoading] = useState(false); // Separate loading state for main view
  const [mainsError, setMainsError] = useState(null); // Separate error state for main view
  const [locale, setLocale] = useState(() => getStoredValue('locale', 'en'));
  const [retryCount, setRetryCount] = useState(0);
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'category'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Use refs to avoid recreating syncCart when cartId/cartVersion change
  const cartIdRef = React.useRef(cartId);
  const cartVersionRef = React.useRef(cartVersion);

  // Keep refs in sync with state
  React.useEffect(() => {
    cartIdRef.current = cartId;
    cartVersionRef.current = cartVersion;
  }, [cartId, cartVersion]);

  // Persist settings to localStorage when they change
  useEffect(() => {
    setStoredValue('apiUrl', apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    setStoredValue('authToken', authToken);
  }, [authToken]);

  useEffect(() => {
    setStoredValue('locale', locale);
  }, [locale]);

  // Initialize API hook
  const api = useApi(apiUrl, authToken);

  // Load cart from server
  const loadCart = useCallback(async () => {
    if (!selectedStore) {
      console.log('🛒 [App] No store selected, skipping cart loading');
      return;
    }

    try {
      console.log('🛒 [App] Loading cart from server...');
      const response = await api.getCart();
      
      if (response && response.id) {
        console.log('✅ [App] Cart loaded:', response);
        setCartId(response.id);
        setCartVersion(response.version);
        
        // Transform items from ResponseCartItem to local state format
        const cartItems = (response.items || []).map(item => ({
          id: item.id,
          title: item.title,
          name: item.title, // Alias for compatibility
          price: parseFloat(item.price),
          quantity: parseFloat(item.quantity),
          image_url: item.image_url
        }));
        
        setCart(cartItems);
      }
    } catch (error) {
      console.error('❌ [App] Error loading cart:', error);
      // If cart not found (404), this is normal - will create new one on first add
      if (error.message && error.message.includes('404')) {
        console.log('ℹ️ [App] Cart not found, will be created when adding item');
        setCart([]);
        setCartId(null);
        setCartVersion(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  // Synchronize cart with server
  const syncCart = useCallback(async (updatedCart) => {
    if (!selectedStore) {
      console.warn('⚠️ [App] No store selected, cannot synchronize cart');
      return;
    }

    try {
      console.log('🔄 [App] Synchronizing cart with server...');
      
      // Build request according to OpenAPI schema
      const cartData = {
        items: updatedCart.map(item => ({
          id: item.id,
          quantity: item.quantity
        })),
        fulfillment_method: 'pickup', // Using pickup since we have a store selected
        store_id: selectedStore.id
      };

      // Add id and version if cart already exists (using refs)
      if (cartIdRef.current) {
        cartData.id = cartIdRef.current;
        cartData.version = cartVersionRef.current;
      }

      const response = await api.updateCart(cartData);
      
      if (response && response.id) {
        console.log('✅ [App] Cart synchronized:', response);
        setCartId(response.id);
        setCartVersion(response.version);
        
        // Update local state from server response
        const cartItems = (response.items || []).map(item => ({
          id: item.id,
          title: item.title,
          name: item.title,
          price: parseFloat(item.price),
          quantity: parseFloat(item.quantity),
          image_url: item.image_url
        }));
        
        setCart(cartItems);
      }
    } catch (error) {
      console.error('❌ [App] Error synchronizing cart:', error);
      // On error, rollback to previous state
      await loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore, loadCart]);

  const addToCart = useCallback(async (product) => {
    console.log('➕ [App] Adding item to cart:', product.id);
    
    // Optimistic UI update with functional update
    let updatedCart;
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        updatedCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...prevCart, { 
          id: product.id,
          title: product.title,
          name: product.title,
          price: product.price,
          quantity: 1,
          image_url: product.image_url
        }];
      }
      return updatedCart;
    });
    
    // Synchronize with server asynchronously
    // Use setTimeout so updatedCart is available
    setTimeout(() => syncCart(updatedCart), 0);
  }, [syncCart]);

  const removeFromCart = useCallback(async (productId) => {
    console.log('➖ [App] Removing item from cart:', productId);
    
    // Optimistic UI update with functional update
    let updatedCart;
    setCart(prevCart => {
      updatedCart = prevCart.map(item =>
        item.id === productId ? { ...item, quantity: 0 } : item
      );
      return updatedCart;
    });
    
    // Synchronize with server asynchronously
    setTimeout(() => syncCart(updatedCart), 0);
  }, [syncCart]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    console.log('🔢 [App] Updating item quantity:', productId, 'new quantity:', quantity);
    
    const safeQuantity = Math.max(0, quantity);
    
    // Optimistic UI update with functional update
    let updatedCart;
    setCart(prevCart => {
      updatedCart = prevCart.map(item =>
        item.id === productId ? { ...item, quantity: safeQuantity } : item
      );
      return updatedCart;
    });
    
    // Synchronize with server asynchronously
    setTimeout(() => syncCart(updatedCart), 0);
  }, [syncCart]);

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Function to load main page from API
  const loadMains = useCallback(async () => {
    if (mainsData) return;

    setMainsLoading(true);
    setMainsError(null);
    
    try {
      console.log('🏠 [App] Loading main page...');
      console.log('🔍 [App] Request parameters:', { locale, apiUrl, retryCount });
      
      const response = await api.getMains(locale);
      
      // According to OpenAPI schema, response contains object with id and widgets fields
      if (response && response.widgets && Array.isArray(response.widgets)) {
        console.log('📊 [App] Main page received:', response.id);
        console.log('📊 [App] Widgets on page:', response.widgets.length);
        console.log('📊 [App] Full API response:', JSON.stringify(response, null, 2));
        
        setMainsData(response);
        setRetryCount(0); // Reset counter on successful load
        console.log('✅ [App] Main page set successfully');
      } else {
        console.warn('⚠️ [App] Unexpected API response format:', response);
        console.warn('⚠️ [App] Expected object with widgets field (array)');
        setMainsData(null);
      }
    } catch (error) {
      console.error('❌ [App] Error loading main page:');
      console.error('❌ [App] Error type:', error.constructor.name);
      console.error('❌ [App] Error message:', error.message);
      console.error('❌ [App] Error stack:', error.stack);
      console.error('❌ [App] Request parameters:', { locale, apiUrl, retryCount });
      
      // Detailed handling of different error types
      if (error.message.includes('404')) {
        console.log('ℹ️ [App] Main page not found (404)');
      } else if (error.message.includes('CORS')) {
        console.error('🚫 [App] CORS error - check server settings');
      } else if (error.message.includes('Network')) {
        console.error('🌐 [App] Network error - check server connection');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('🔐 [App] Authorization error - check token');
      } else if (error.message.includes('500')) {
        console.error('🔥 [App] Internal server error');
      }
      
      setMainsData(null);
      setMainsError(error.message);
    } finally {
      setMainsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, apiUrl, mainsData, retryCount]);


  // Function to load products from API with pagination
  const loadProducts = useCallback(async (categoryId, pageToken = null, limit = 10) => {
    try {
      console.log('📦 [App] Loading products for category:', categoryId, 'page token:', pageToken || 'null (first page)', 'limit:', limit, 'store:', selectedStore?.id);
      const response = await api.getProductsList(locale, categoryId, pageToken, limit, selectedStore?.id);
      
      // According to OpenAPI schema, response contains object with products and next_page_token fields
      if (response && response.products && Array.isArray(response.products)) {
        const productsData = response.products;
        // next_page_token — string or null (for last page)
        const nextPageToken = response.next_page_token ?? null;
        console.log('✅ [App] Products loaded:', productsData.length, 'next_page_token:', nextPageToken);
        return { products: productsData, nextPageToken };
      } else {
        console.warn('⚠️ [App] Unexpected API products response format:', response);
        return { products: [], nextPageToken: null };
      }
    } catch (error) {
      console.error('❌ [App] Error loading products:', error);
      return { products: [], nextPageToken: null };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, selectedStore]);

  // Function for checkout
  const handleCheckout = async () => {
    if (getTotalItems() === 0 || !cartId) {
      console.warn('⚠️ [App] Cart is empty or not created');
      return;
    }
    
    // TODO: In a real app, need to get user coordinates
    // For example, using dummy coordinates
    const orderData = {
      position: {
        lat: 55.751244,
        lon: 37.618423
      },
      cart_id: cartId,
      cart_version: cartVersion
    };

    try {
      console.log('📦 [App] Creating order:', orderData);
      const result = await api.submitOrder(orderData);
      
      // After creating order, clear the cart
      setCart([]);
      setCartId(null);
      setCartVersion(null);
      
      // Trigger orders tracking fetch by updating checkoutSuccess timestamp
      setCheckoutSuccess(Date.now());
      
      console.log('✅ [App] Order created:', result);
    } catch (error) {
      console.error('❌ [App] Error creating order:', error);
    }
  };

  // Load cart and main page when store is selected
  useEffect(() => {
    if (apiUrl && selectedStore) {
      // Load cart when store is selected
      console.log('🔄 [App] useEffect: Store selected, loading cart');
      loadCart();
      
      // Load main page when store is selected (only if not already loaded)
      if (!mainsData) {
        console.log('🔄 [App] useEffect: Starting main page load');
        loadMains();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, selectedStore, mainsData]);

  // Function for retry loading
  const handleRetry = useCallback(() => {
    console.log('🔄 [App] User requested retry loading');
    setMainsData(null);
    setMainsError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  // Function for store selection
  const handleStoreSelect = useCallback((store) => {
    console.log('🏪 [App] Store selected:', store);
    setSelectedStore(store);
    // Reset data when store changes
    setMainsData(null);
    setMainsError(null);
    setRetryCount(0);
    setCart([]);
    setCartId(null);
    setCartVersion(null);
    // Return to main page
    setCurrentView('main');
    setSelectedCategory(null);
  }, []);

  // Category click handler
  const handleCategoryClick = useCallback((category) => {
    console.log('📂 [App] Category clicked:', category);
    setSelectedCategory(category);
    setCurrentView('category');
  }, []);

  // Back to main page handler
  const handleBackToMain = useCallback(() => {
    console.log('🏠 [App] Returning to main page');
    setCurrentView('main');
    setSelectedCategory(null);
  }, []);

  // Function to load products for category
  const loadCategoryProducts = useCallback(async (categoryId, pageToken = null, limit = 10) => {
    console.log('📦 [App] Loading products for category:', categoryId, 'Page token:', pageToken || 'null', 'Store:', selectedStore?.id);
    try {
      const response = await api.getProductsList(locale, categoryId, pageToken, limit, selectedStore?.id);
      console.log('✅ [App] Products loaded:', response);
      return response;
    } catch (error) {
      console.error('❌ [App] Error loading products:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, selectedStore]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍽️ Delicious API</h1>
      </header>
      
      <main className="app-main">
        <StoreSelector 
          selectedStore={selectedStore}
          onStoreSelect={handleStoreSelect}
          apiUrl={apiUrl}
          authToken={authToken}
          useRealApi={true}
        />
        
        {/* Conditionally render MainView or CategoryView */}
        {currentView === 'main' ? (
          <MainView 
            mainsData={mainsData}
            onAddToCart={addToCart}
            onCategoryClick={handleCategoryClick}
            onLoadProducts={loadProducts}
            loading={mainsLoading}
            error={mainsError}
            selectedStore={selectedStore}
            useRealApi={true}
            onRetry={handleRetry}
            retryCount={retryCount}
          />
        ) : (
          <Suspense fallback={<div className="loading-fallback">Loading...</div>}>
            <CategoryView
              category={selectedCategory}
              onAddToCart={addToCart}
              onBack={handleBackToMain}
              onLoadProducts={loadCategoryProducts}
              loading={api.loading}
              error={api.error}
              locale={locale}
            />
          </Suspense>
        )}
      </main>
      
      <Suspense fallback={<div className="loading-fallback">Loading panel...</div>}>
        <BottomPanel 
          cart={cart}
          isLoggedIn={isLoggedIn}
          onLogin={() => setIsLoggedIn(!isLoggedIn)}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          totalItems={getTotalItems()}
          totalPrice={getTotalPrice()}
          apiUrl={apiUrl}
          onApiUrlChange={setApiUrl}
          authToken={authToken}
          onAuthTokenChange={setAuthToken}
          onCheckout={handleCheckout}
          locale={locale}
          onLocaleChange={setLocale}
          checkoutSuccess={checkoutSuccess}
        />
      </Suspense>
    </div>
  );
}

export default App;
