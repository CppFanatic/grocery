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
    console.warn(`⚠️ [App] Ошибка чтения из localStorage (${key}):`, e);
    return defaultValue;
  }
};

const setStoredValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`⚠️ [App] Ошибка записи в localStorage (${key}):`, e);
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

  // Инициализируем API хук
  const api = useApi(apiUrl, authToken);

  // Загружает корзину с сервера
  const loadCart = useCallback(async () => {
    if (!selectedStore) {
      console.log('🛒 [App] Склад не выбран, пропускаем загрузку корзины');
      return;
    }

    try {
      console.log('🛒 [App] Загружаем корзину с сервера...');
      const response = await api.getCart();
      
      if (response && response.id) {
        console.log('✅ [App] Корзина загружена:', response);
        setCartId(response.id);
        setCartVersion(response.version);
        
        // Преобразуем items из ResponseCartItem в формат для локального состояния
        const cartItems = (response.items || []).map(item => ({
          id: item.id,
          title: item.title,
          name: item.title, // Алиас для совместимости
          price: parseFloat(item.price),
          quantity: parseFloat(item.quantity),
          image_url: item.image_url
        }));
        
        setCart(cartItems);
      }
    } catch (error) {
      console.error('❌ [App] Ошибка загрузки корзины:', error);
      // Если корзина не найдена (404), это нормально - создадим новую при первом добавлении
      if (error.message && error.message.includes('404')) {
        console.log('ℹ️ [App] Корзина не найдена, будет создана при добавлении товара');
        setCart([]);
        setCartId(null);
        setCartVersion(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  // Синхронизирует корзину с сервером
  const syncCart = useCallback(async (updatedCart) => {
    if (!selectedStore) {
      console.warn('⚠️ [App] Склад не выбран, невозможно синхронизировать корзину');
      return;
    }

    try {
      console.log('🔄 [App] Синхронизируем корзину с сервером...');
      
      // Формируем запрос согласно OpenAPI схеме
      const cartData = {
        items: updatedCart.map(item => ({
          id: item.id,
          quantity: item.quantity
        })),
        fulfillment_method: 'pickup', // Используем pickup т.к. у нас выбран склад
        store_id: selectedStore.id
      };

      // Добавляем id и version если корзина уже существует (используем refs)
      if (cartIdRef.current) {
        cartData.id = cartIdRef.current;
        cartData.version = cartVersionRef.current;
      }

      const response = await api.updateCart(cartData);
      
      if (response && response.id) {
        console.log('✅ [App] Корзина синхронизирована:', response);
        setCartId(response.id);
        setCartVersion(response.version);
        
        // Обновляем локальное состояние из ответа сервера
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
      console.error('❌ [App] Ошибка синхронизации корзины:', error);
      // При ошибке откатываем к предыдущему состоянию
      await loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore, loadCart]);

  const addToCart = useCallback(async (product) => {
    console.log('➕ [App] Добавляем товар в корзину:', product.id);
    
    // Оптимистическое обновление UI с функциональным обновлением
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
    
    // Синхронизируем с сервером асинхронно
    // Используем setTimeout чтобы updatedCart был доступен
    setTimeout(() => syncCart(updatedCart), 0);
  }, [syncCart]);

  const removeFromCart = useCallback(async (productId) => {
    console.log('➖ [App] Удаляем товар из корзины:', productId);
    
    // Оптимистическое обновление UI с функциональным обновлением
    let updatedCart;
    setCart(prevCart => {
      updatedCart = prevCart.filter(item => item.id !== productId);
      return updatedCart;
    });
    
    // Синхронизируем с сервером асинхронно
    setTimeout(() => syncCart(updatedCart), 0);
  }, [syncCart]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    console.log('🔢 [App] Обновляем количество товара:', productId, 'новое количество:', quantity);
    
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    
    // Оптимистическое обновление UI с функциональным обновлением
    let updatedCart;
    setCart(prevCart => {
      updatedCart = prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      return updatedCart;
    });
    
    // Синхронизируем с сервером асинхронно
    setTimeout(() => syncCart(updatedCart), 0);
  }, [syncCart, removeFromCart]);

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Функция для загрузки главной страницы из API
  const loadMains = useCallback(async () => {
    if (mainsData) return;

    setMainsLoading(true);
    setMainsError(null);
    
    try {
      console.log('🏠 [App] Загружаем главную страницу...');
      console.log('🔍 [App] Параметры запроса:', { locale, apiUrl, retryCount });
      
      const response = await api.getMains(locale);
      
      // Согласно OpenAPI схеме, ответ содержит объект с полями id и widgets
      if (response && response.widgets && Array.isArray(response.widgets)) {
        console.log('📊 [App] Получена главная страница:', response.id);
        console.log('📊 [App] Виджетов на странице:', response.widgets.length);
        console.log('📊 [App] Полный ответ API:', JSON.stringify(response, null, 2));
        
        setMainsData(response);
        setRetryCount(0); // Сбрасываем счетчик при успешной загрузке
        console.log('✅ [App] Главная страница установлена успешно');
      } else {
        console.warn('⚠️ [App] Неожиданный формат ответа API:', response);
        console.warn('⚠️ [App] Ожидался объект с полем widgets (массив)');
        setMainsData(null);
      }
    } catch (error) {
      console.error('❌ [App] Ошибка загрузки главной страницы:');
      console.error('❌ [App] Тип ошибки:', error.constructor.name);
      console.error('❌ [App] Сообщение ошибки:', error.message);
      console.error('❌ [App] Стек ошибки:', error.stack);
      console.error('❌ [App] Параметры запроса:', { locale, apiUrl, retryCount });
      
      // Детальная обработка различных типов ошибок
      if (error.message.includes('404')) {
        console.log('ℹ️ [App] Главная страница не найдена (404)');
      } else if (error.message.includes('CORS')) {
        console.error('🚫 [App] CORS ошибка - проверьте настройки сервера');
      } else if (error.message.includes('Network')) {
        console.error('🌐 [App] Сетевая ошибка - проверьте подключение к серверу');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('🔐 [App] Ошибка авторизации - проверьте токен');
      } else if (error.message.includes('500')) {
        console.error('🔥 [App] Внутренняя ошибка сервера');
      }
      
      setMainsData(null);
      setMainsError(error.message);
    } finally {
      setMainsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, apiUrl, mainsData, retryCount]);


  // Функция для загрузки продуктов из API с пагинацией
  const loadProducts = useCallback(async (categoryId, pageToken = null, limit = 10) => {
    try {
      console.log('📦 [App] Загружаем продукты для категории:', categoryId, 'page token:', pageToken || 'null (first page)', 'limit:', limit, 'store:', selectedStore?.id);
      const response = await api.getProductsList(locale, categoryId, pageToken, limit, selectedStore?.id);
      
      // Согласно OpenAPI схеме, ответ содержит объект с полем products и next_page_token
      if (response && response.products && Array.isArray(response.products)) {
        const productsData = response.products;
        // Убеждаемся, что next_page_token является integer
        const nextPageToken = response.next_page_token ? parseInt(response.next_page_token, 10) : null;
        console.log('🔄 [App] next_page_token conversion:', {
          original: response.next_page_token,
          type: typeof response.next_page_token,
          converted: nextPageToken,
          convertedType: typeof nextPageToken
        });
        console.log('✅ [App] Продукты загружены:', productsData.length, 'next_page_token:', nextPageToken);
        return { products: productsData, nextPageToken };
      } else {
        console.warn('⚠️ [App] Неожиданный формат ответа API продуктов:', response);
        return { products: [], nextPageToken: null };
      }
    } catch (error) {
      console.error('❌ [App] Ошибка загрузки продуктов:', error);
      return { products: [], nextPageToken: null };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, selectedStore]);

  // Функция для оформления заказа
  const handleCheckout = async () => {
    if (cart.length === 0 || !cartId) {
      console.warn('⚠️ [App] Корзина пуста или не создана');
      return;
    }
    
    // TODO: В реальном приложении нужно получить координаты пользователя
    // Для примера используем фиктивные координаты
    const orderData = {
      position: {
        lat: 55.751244,
        lon: 37.618423
      },
      cart_id: cartId,
      cart_version: cartVersion
    };

    try {
      console.log('📦 [App] Создаём заказ:', orderData);
      const result = await api.submitOrder(orderData);
      
      // После создания заказа очищаем корзину
      setCart([]);
      setCartId(null);
      setCartVersion(null);
      
      // Trigger orders tracking fetch by updating checkoutSuccess timestamp
      setCheckoutSuccess(Date.now());
      
      console.log('✅ [App] Заказ создан:', result);
    } catch (error) {
      console.error('❌ [App] Ошибка создания заказа:', error);
    }
  };

  // Загружаем корзину и главную страницу при выборе склада
  useEffect(() => {
    if (apiUrl && selectedStore) {
      // Загружаем корзину при выборе склада
      console.log('🔄 [App] useEffect: Склад выбран, загружаем корзину');
      loadCart();
      
      // Загружаем главную страницу при выборе склада (только если еще не загружена)
      if (!mainsData) {
        console.log('🔄 [App] useEffect: Запускаем загрузку главной страницы');
        loadMains();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, selectedStore, mainsData]);

  // Функция для повторной попытки загрузки
  const handleRetry = useCallback(() => {
    console.log('🔄 [App] Пользователь запросил повторную попытку загрузки');
    setMainsData(null);
    setMainsError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  // Функция для выбора склада
  const handleStoreSelect = useCallback((store) => {
    console.log('🏪 [App] Выбран склад:', store);
    setSelectedStore(store);
    // Сбрасываем данные при смене склада
    setMainsData(null);
    setMainsError(null);
    setRetryCount(0);
    setCart([]);
    setCartId(null);
    setCartVersion(null);
    // Возвращаемся к главной странице
    setCurrentView('main');
    setSelectedCategory(null);
  }, []);

  // Обработчик клика по категории
  const handleCategoryClick = useCallback((category) => {
    console.log('📂 [App] Клик по категории:', category);
    setSelectedCategory(category);
    setCurrentView('category');
  }, []);

  // Обработчик возврата к главной странице
  const handleBackToMain = useCallback(() => {
    console.log('🏠 [App] Возврат к главной странице');
    setCurrentView('main');
    setSelectedCategory(null);
  }, []);

  // Функция загрузки продуктов для категории
  const loadCategoryProducts = useCallback(async (categoryId, pageToken = null, limit = 10) => {
    console.log('📦 [App] Загружаем продукты для категории:', categoryId, 'Page token:', pageToken || 'null', 'Store:', selectedStore?.id);
    try {
      const response = await api.getProductsList(locale, categoryId, pageToken, limit, selectedStore?.id);
      console.log('✅ [App] Продукты загружены:', response);
      return response;
    } catch (error) {
      console.error('❌ [App] Ошибка загрузки продуктов:', error);
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
        
        {/* Условно рендерим MainView или CategoryView */}
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
