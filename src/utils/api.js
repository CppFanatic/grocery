// Утилиты для работы с API

/**
 * Выполняет HTTP запрос к API с авторизацией
 * @param {string} endpoint - Endpoint API (например, '/categories' или '/products')
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {Object} options - Дополнительные опции для fetch
 * @returns {Promise} - Promise с результатом запроса
 */
export const apiRequest = async (endpoint, baseUrl, authToken, options = {}) => {
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Добавляем токен авторизации если он указан
  if (authToken && authToken.trim()) {
    headers['Authorization'] = `Bearer ${authToken.trim()}`;
  }

  const config = {
    ...options,
    headers
  };

  console.log(`🌐 [API] ${options.method || 'GET'} запрос:`, endpoint);
  console.log('📍 URL:', url);
  console.log('📋 Headers:', headers);
  if (config.body) {
    console.log('📦 Body:', config.body);
  }
  
  try {
    const response = await fetch(url, config);
    
    console.log('📡 [API] Ответ сервера:');
    console.log('🔢 Status:', response.status, response.statusText);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] Ошибка HTTP:');
      console.error('❌ [API] Status:', response.status);
      console.error('❌ [API] Status Text:', response.statusText);
      console.error('❌ [API] Response Body:', errorText);
      console.error('❌ [API] Request URL:', url);
      console.error('❌ [API] Request Method:', options.method || 'GET');
      console.error('❌ [API] Request Headers:', headers);
      
      // Создаем детальную ошибку
      const detailedError = new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      detailedError.status = response.status;
      detailedError.statusText = response.statusText;
      detailedError.responseBody = errorText;
      detailedError.url = url;
      detailedError.method = options.method || 'GET';
      throw detailedError;
    }
    
    const responseData = await response.json();
    console.log('✅ [API] Успешный ответ:', responseData);
    return responseData;
  } catch (error) {
    console.error('💥 [API] Ошибка запроса:');
    console.error('💥 [API] URL:', url);
    console.error('💥 [API] Method:', options.method || 'GET');
    console.error('💥 [API] Headers:', headers);
    console.error('💥 [API] Error Type:', error.constructor.name);
    console.error('💥 [API] Error Message:', error.message);
    console.error('💥 [API] Error Stack:', error.stack);
    
    // Обработка CORS ошибок
    if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
      const corsError = new Error('CORS Error: Сервер не разрешает запросы с этого домена. Возможно, нужно настроить CORS на сервере или использовать прокси.');
      corsError.isCorsError = true;
      corsError.originalError = error;
      throw corsError;
    }
    
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      const networkError = new Error('Network Error: Не удается подключиться к серверу. Проверьте URL и доступность сервера.');
      networkError.isNetworkError = true;
      networkError.originalError = error;
      throw networkError;
    }
    
    if (error.message.includes('TypeError')) {
      const typeError = new Error(`Type Error: ${error.message}. Возможно, проблема с форматом данных.`);
      typeError.isTypeError = true;
      typeError.originalError = error;
      throw typeError;
    }
    
    throw error;
  }
};

/**
 * Получает список категорий через OpenAPI схему
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @returns {Promise<Object>} - Promise с объектом содержащим массив categories
 */
export const fetchCategories = async (baseUrl, authToken) => {
  return apiRequest('/b2b/v1/front-categories/get', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({}) // Пустой объект согласно OpenAPI спецификации
  });
};

/**
 * Получает список продуктов
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {number} categoryId - ID категории (опционально)
 * @returns {Promise<Array>} - Promise с массивом продуктов
 */
export const fetchProducts = async (baseUrl, authToken, categoryId = null) => {
  const endpoint = categoryId ? `/products?categoryId=${categoryId}` : '/products';
  return apiRequest(endpoint, baseUrl, authToken);
};

/**
 * Создает новый заказ
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {Object} orderData - Данные заказа
 * @returns {Promise<Object>} - Promise с результатом создания заказа
 */
export const createOrder = async (baseUrl, authToken, orderData) => {
  return apiRequest('/orders', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};

/**
 * Получает статус заказа
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {string} orderId - ID заказа
 * @returns {Promise<Object>} - Promise с данными заказа
 */
export const fetchOrderStatus = async (baseUrl, authToken, orderId) => {
  return apiRequest(`/orders/${orderId}`, baseUrl, authToken);
};

/**
 * Обновляет статус заказа
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {string} orderId - ID заказа
 * @param {string} status - Новый статус
 * @returns {Promise<Object>} - Promise с результатом обновления
 */
export const updateOrderStatus = async (baseUrl, authToken, orderId, status) => {
  return apiRequest(`/orders/${orderId}/status`, baseUrl, authToken, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};

/**
 * Получает список складов
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @returns {Promise<Object>} - Promise с объектом содержащим массив stores
 */
export const fetchStores = async (baseUrl, authToken) => {
  return apiRequest('/b2b/v1/stores/get', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({}) // Пустой объект согласно OpenAPI спецификации
  });
};

/**
 * Получает грид (сетку групп и категорий) через OpenAPI схему
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {string} locale - Локаль для запроса (например, 'en', 'ru')
 * @returns {Promise<Object>} - Promise с объектом содержащим id и groups
 */
export const fetchGrids = async (baseUrl, authToken, locale = 'en') => {
  return apiRequest('/b2b/v1/front/grids/get', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({ locale }) // Локаль согласно OpenAPI спецификации
  });
};
