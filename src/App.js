import React, { useState, useEffect, useCallback } from 'react';
import MainView from './components/MainView';
import BottomPanel from './components/BottomPanel';
import StoreSelector from './components/StoreSelector';
import { useApi } from './hooks/useApi';
import './App.css';

function App() {
  const [cart, setCart] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Нет заказов');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');
  const [authToken, setAuthToken] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [mainsData, setMainsData] = useState(null);
  const [locale, setLocale] = useState('en');
  const [retryCount, setRetryCount] = useState(0);

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

  // Функция для загрузки главной страницы из API
  const loadMains = useCallback(async () => {
    if (mainsData) return;

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
    }
  }, [api, locale, apiUrl, mainsData, retryCount]);


  // Функция для загрузки продуктов из API с пагинацией
  const loadProducts = useCallback(async (categoryId, pageToken = '', limit = 10) => {
    try {
      console.log('📦 [App] Загружаем продукты для категории:', categoryId, 'page token:', pageToken || 'empty (first page)', 'limit:', limit);
      const response = await api.getProductsList(locale, categoryId, pageToken, limit);
      
      // Согласно OpenAPI схеме, ответ содержит объект с полем products и next_page_token
      if (response && response.products && Array.isArray(response.products)) {
        const productsData = response.products;
        const nextPageToken = response.next_page_token || null;
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
  }, [api, locale]);

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
      const result = await api.submitOrder(orderData);
      setOrderStatus('Заказ создан');
      setCart([]);
      console.log('Order created:', result);
    } catch (error) {
      console.error('Failed to create order:', error);
      setOrderStatus('Ошибка создания заказа');
    }
  };

  // Загружаем главную страницу при изменении настроек API
  useEffect(() => {
    if (apiUrl && selectedStore) {
      // Загружаем главную страницу при выборе склада (только если еще не загружена)
      if (!mainsData) {
        console.log('🔄 [App] useEffect: Запускаем загрузку главной страницы');
        loadMains();
      }
    }
  }, [apiUrl, selectedStore, loadMains, mainsData]);

  // Функция для повторной попытки загрузки
  const handleRetry = useCallback(() => {
    console.log('🔄 [App] Пользователь запросил повторную попытку загрузки');
    setMainsData(null);
    setRetryCount(prev => prev + 1);
  }, []);

  // Функция для выбора склада
  const handleStoreSelect = useCallback((store) => {
    console.log('🏪 [App] Выбран склад:', store);
    setSelectedStore(store);
    // Сбрасываем данные при смене склада
    setMainsData(null);
    setRetryCount(0);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍕 Delicious API</h1>
      </header>
      
      <main className="app-main">
        <StoreSelector 
          selectedStore={selectedStore}
          onStoreSelect={handleStoreSelect}
          apiUrl={apiUrl}
          authToken={authToken}
          useRealApi={true}
        />
        
        {/* Используем MainView для отображения главной страницы с виджетами */}
        <MainView 
          mainsData={mainsData}
          onAddToCart={addToCart}
          onCategoryClick={(category) => {
            console.log('📂 [App] Клик по категории:', category);
            // Здесь можно добавить логику для перехода к категории
          }}
          onLoadProducts={loadProducts}
          loading={api.loading}
          error={api.error}
          selectedStore={selectedStore}
          useRealApi={true}
          onRetry={handleRetry}
          retryCount={retryCount}
        />
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
        locale={locale}
        onLocaleChange={setLocale}
      />
    </div>
  );
}

export default App;
