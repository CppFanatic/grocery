import React, { useState, useEffect, useCallback } from 'react';
import GridView from './components/GridView';
import ProductGrid from './components/ProductGrid';
import BottomPanel from './components/BottomPanel';
import StoreSelector from './components/StoreSelector';
import { categories, products } from './data/mockData';
import { useApi } from './hooks/useApi';
import './App.css';

function App() {
  const [cart, setCart] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Нет заказов');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');
  const [authToken, setAuthToken] = useState('');
  const [useRealApi, setUseRealApi] = useState(false);
  const [apiCategories, setApiCategories] = useState([]);
  const [apiProducts, setApiProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [locale, setLocale] = useState('en');
  const [useGridView, setUseGridView] = useState(true);

  // Инициализируем API хук
  const api = useApi(apiUrl, authToken);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Функция для загрузки грида из API
  const loadGrid = useCallback(async () => {
    if (!useRealApi || !useGridView || gridData) return;

    try {
      console.log('🎯 [App] Загружаем грид...');
      console.log('🔍 [App] Параметры запроса:', { locale, apiUrl });
      
      const response = await api.getGrids(locale);
      
      // Согласно OpenAPI схеме, ответ содержит объект с полями id и groups
      if (response && response.groups && Array.isArray(response.groups)) {
        console.log('📊 [App] Получен грид:', response.id);
        console.log('📊 [App] Групп в гриде:', response.groups.length);
        console.log('📊 [App] Полный ответ API:', JSON.stringify(response, null, 2));
        
        setGridData(response);
        console.log('✅ [App] Грид установлен успешно');
      } else {
        console.warn('⚠️ [App] Неожиданный формат ответа API:', response);
        console.warn('⚠️ [App] Ожидался объект с полем groups (массив)');
        setGridData(null);
      }
    } catch (error) {
      console.error('❌ [App] Ошибка загрузки грида:');
      console.error('❌ [App] Тип ошибки:', error.constructor.name);
      console.error('❌ [App] Сообщение ошибки:', error.message);
      console.error('❌ [App] Стек ошибки:', error.stack);
      console.error('❌ [App] Параметры запроса:', { locale, apiUrl });
      
      // Детальная обработка различных типов ошибок
      if (error.message.includes('404')) {
        console.log('ℹ️ [App] Грид не найден (404), используем стандартный вид категорий');
        setUseGridView(false);
      } else if (error.message.includes('CORS')) {
        console.error('🚫 [App] CORS ошибка - проверьте настройки сервера');
      } else if (error.message.includes('Network')) {
        console.error('🌐 [App] Сетевая ошибка - проверьте подключение к серверу');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('🔐 [App] Ошибка авторизации - проверьте токен');
      } else if (error.message.includes('500')) {
        console.error('🔥 [App] Внутренняя ошибка сервера');
      }
      
      setGridData(null);
    }
  }, [useRealApi, useGridView, api, locale, apiUrl]);

  // Функция для загрузки категорий из API (для не-grid режима)
  const loadCategories = useCallback(async () => {
    if (!useRealApi || useGridView || apiCategories.length > 0) return;

    try {
      console.log('📂 [App] Загружаем категории...');
      const response = await api.getCategories();
      
      // Согласно OpenAPI схеме, ответ содержит объект с полем categories
      if (response && response.categories && Array.isArray(response.categories)) {
        console.log('📊 [App] Получено категорий от API:', response.categories.length);
        
        // Преобразуем данные API в формат, понятный нашему компоненту
        const allCategories = response.categories.map(category => ({
          id: category.id,
          name: category.name?.ru || category.name?.en || `Категория ${category.id}`,
          description: category.description?.ru || category.description?.en || '',
          image: category.images && category.images.length > 0 ? category.images[0] : '/images/categories/default.svg',
          parentId: category.parent_id || null,
          order: category.order || 0,
          status: category.status || 'active'
        }));
        
        // Фильтруем только активные категории
        const activeCategories = allCategories.filter(category => category.status === 'active');
        
        console.log('📊 [App] Активных категорий:', activeCategories.length);
        console.log('📊 [App] Неактивных категорий:', allCategories.length - activeCategories.length);
        
        // Логируем неактивные категории для отладки
        const inactiveCategories = allCategories.filter(category => category.status !== 'active');
        if (inactiveCategories.length > 0) {
          console.log('🚫 [App] Неактивные категории:', inactiveCategories.map(c => `${c.name} (${c.status})`));
        }
        
        setApiCategories(activeCategories);
        console.log('✅ [App] Активные категории установлены:', activeCategories.length);
      } else {
        console.warn('⚠️ [App] Неожиданный формат ответа API:', response);
        setApiCategories([]);
      }
    } catch (error) {
      console.error('❌ [App] Ошибка загрузки категорий:', error);
    }
  }, [useRealApi, useGridView, api, apiCategories.length]);

  // Функция для загрузки продуктов из API
  const loadProducts = useCallback(async (categoryId = null) => {
    if (!useRealApi) return;

    try {
      console.log('📦 [App] Загружаем продукты для категории:', categoryId || 'все');
      const productsData = await api.getProducts(categoryId);
      
      if (categoryId) {
        // Загружаем продукты для конкретной категории
        setApiProducts(prevProducts => {
          // Удаляем старые продукты этой категории и добавляем новые
          const filteredProducts = prevProducts.filter(p => p.categoryId !== categoryId);
          return [...filteredProducts, ...productsData];
        });
      } else {
        // Загружаем все продукты
        setApiProducts(productsData);
      }
      console.log('✅ [App] Продукты загружены:', productsData.length);
    } catch (error) {
      console.error('❌ [App] Ошибка загрузки продуктов:', error);
    }
  }, [useRealApi, api]);

  // Функция для оформления заказа
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const orderData = {
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: getTotalPrice(),
      timestamp: new Date().toISOString(),
      store: selectedStore ? {
        id: selectedStore.id,
        name: selectedStore.name,
        address: selectedStore.address
      } : null
    };

    try {
      if (useRealApi) {
        const result = await api.submitOrder(orderData);
        setOrderStatus('Заказ создан');
        setCart([]);
        console.log('Order created:', result);
      } else {
        // Симуляция создания заказа
        setOrderStatus('Готовится');
        setCart([]);
        console.log('Mock order created:', orderData);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  // Загружаем грид или категории при изменении настроек API
  useEffect(() => {
    if (useRealApi && apiUrl && selectedStore) {
      if (useGridView) {
        // Загружаем грид при выборе склада (только если еще не загружен)
        if (!gridData) {
          console.log('🔄 [App] useEffect: Запускаем загрузку грида');
          loadGrid();
        }
      } else {
        // Загружаем только категории при выборе склада
        if (apiCategories.length === 0) {
          console.log('🔄 [App] useEffect: Запускаем загрузку категорий');
          loadCategories();
        }
      }
    }
  }, [useRealApi, apiUrl, selectedStore, useGridView, loadGrid, loadCategories, gridData, apiCategories.length]);

  // Получаем текущие данные (из API или моковые)
  const currentCategories = useRealApi ? apiCategories : categories;
  const currentProducts = useRealApi ? apiProducts : products;

  // Функция для выбора склада
  const handleStoreSelect = useCallback((store) => {
    console.log('🏪 [App] Выбран склад:', store);
    setSelectedStore(store);
    // Сбрасываем данные при смене склада
    setGridData(null);
    setApiCategories([]);
    setApiProducts([]);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍕 Delivery PWA</h1>
        <p>Заказ еды с доставкой</p>
      </header>
      
      <main className="app-main">
        <StoreSelector 
          selectedStore={selectedStore}
          onStoreSelect={handleStoreSelect}
          apiUrl={apiUrl}
          authToken={authToken}
          useRealApi={useRealApi}
        />
        
        {/* Используем GridView когда включен режим грида, иначе ProductGrid */}
        {useRealApi && useGridView ? (
          <GridView 
            gridData={gridData}
            products={currentProducts}
            onAddToCart={addToCart}
            loading={api.loading}
            error={api.error}
            selectedStore={selectedStore}
            useRealApi={useRealApi}
            onLoadProducts={loadProducts}
          />
        ) : (
          <ProductGrid 
            categories={currentCategories}
            products={currentProducts}
            onAddToCart={addToCart}
            loading={api.loading}
            error={api.error}
            selectedStore={selectedStore}
            useRealApi={useRealApi}
            onLoadProducts={loadProducts}
          />
        )}
      </main>
      
      <BottomPanel 
        cart={cart}
        orderStatus={orderStatus}
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
        useRealApi={useRealApi}
        onToggleApi={setUseRealApi}
        locale={locale}
        onLocaleChange={setLocale}
        useGridView={useGridView}
        onToggleGridView={setUseGridView}
      />
    </div>
  );
}

export default App;
