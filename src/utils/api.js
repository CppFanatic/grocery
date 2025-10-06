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
      console.error('❌ [API] Ошибка HTTP:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('✅ [API] Успешный ответ:', responseData);
    return responseData;
  } catch (error) {
    console.error('💥 [API] Ошибка запроса:', {
      url,
      method: options.method || 'GET',
      headers,
      error: error.message,
      stack: error.stack
    });
    
    // Обработка CORS ошибок
    if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
      const corsError = new Error('CORS Error: Сервер не разрешает запросы с этого домена. Возможно, нужно настроить CORS на сервере или использовать прокси.');
      corsError.isCorsError = true;
      throw corsError;
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
