// Утилиты для работы с API

// Перехватываем все fetch запросы для отладки
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options = {}] = args;
  const method = options.method || 'GET';
  
  console.log(`🔍 [FETCH INTERCEPTOR] ${method} запрос к:`, url);
  console.log('🔍 [FETCH INTERCEPTOR] Опции:', options);
  
  if (method === 'OPTIONS') {
    console.warn('🚨 [FETCH INTERCEPTOR] Обнаружен OPTIONS запрос!');
    console.warn('🚨 [FETCH INTERCEPTOR] URL:', url);
    console.warn('🚨 [FETCH INTERCEPTOR] Это CORS preflight запрос, отправленный браузером автоматически');
  }
  
  return originalFetch.apply(this, args);
};

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

  const method = options.method || 'POST';
  console.log(`🌐 [API] ${method} запрос:`, endpoint);
  console.log('📍 URL:', url);
  console.log('📋 Headers:', headers);
  if (config.body) {
    console.log('📦 Body:', config.body);
  }
  
  // Специальная проверка для OPTIONS запросов
  if (method === 'OPTIONS') {
    console.warn('⚠️ [API] Обнаружен OPTIONS запрос! Это может быть CORS preflight запрос.');
    console.warn('⚠️ [API] Убедитесь, что сервер правильно обрабатывает CORS preflight запросы.');
  }
  
  try {
    // Добавляем timeout для предотвращения зависания запросов
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏰ [API] Таймаут запроса:', url);
      controller.abort();
    }, 30000); // 30 секунд timeout

    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 [API] Ответ сервера:');
    console.log('🔢 Status:', response.status, response.statusText);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Дополнительная проверка для CORS
    if (response.status === 0 || (response.status === 200 || response.status === 204) && method === 'OPTIONS') {
      console.log('ℹ️ [API] Получен ответ на OPTIONS запрос (CORS preflight)');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] Ошибка HTTP:');
      console.error('❌ [API] Status:', response.status);
      console.error('❌ [API] Status Text:', response.statusText);
      console.error('❌ [API] Response Body:', errorText);
      console.error('❌ [API] Request URL:', url);
      console.error('❌ [API] Request Method:', options.method || 'POST');
      console.error('❌ [API] Request Headers:', headers);
      
      // Создаем детальную ошибку
      const detailedError = new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      detailedError.status = response.status;
      detailedError.statusText = response.statusText;
      detailedError.responseBody = errorText;
      detailedError.url = url;
      detailedError.method = options.method || 'POST';
      throw detailedError;
    }
    
    // Обработка пустых ответов (204 No Content)
    if (response.status === 204) {
      console.log('✅ [API] Успешный ответ (204 No Content)');
      return {}; // Возвращаем пустой объект для 204 ответов
    }
    
    const responseData = await response.json();
    console.log('✅ [API] Успешный ответ:', responseData);
    return responseData;
  } catch (error) {
    console.error('💥 [API] Ошибка запроса:');
    console.error('💥 [API] URL:', url);
    console.error('💥 [API] Method:', options.method || 'POST');
    console.error('💥 [API] Headers:', headers);
    console.error('💥 [API] Error Type:', error.constructor.name);
    console.error('💥 [API] Error Message:', error.message);
    console.error('💥 [API] Error Stack:', error.stack);
    
    // Обработка timeout ошибок
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request Timeout: Запрос превысил время ожидания (30 секунд). Сервер может быть недоступен или медленно отвечает.');
      timeoutError.isTimeoutError = true;
      timeoutError.originalError = error;
      throw timeoutError;
    }
    
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
 * Создает новый заказ из корзины
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {Object} orderData - Данные заказа
 * @param {Object} orderData.position - Координаты доставки {lat: number, lon: number}
 * @param {string} orderData.cart_id - ID корзины
 * @param {number} orderData.cart_version - Версия корзины
 * @returns {Promise<Object>} - Promise с результатом создания заказа {order_id: string}
 */
export const createOrder = async (baseUrl, authToken, orderData) => {
  console.log('📦 [createOrder] Создаём заказ:', orderData);
  
  // Генерируем idempotency token для безопасности запроса
  const idempotencyToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return apiRequest('/b2b/v1/front/orders/create', baseUrl, authToken, {
    method: 'POST',
    headers: {
      'X-Idempotency-Token': idempotencyToken
    },
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
  return apiRequest('/orders/status', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId })
  });
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
  return apiRequest('/orders/update-status', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, status })
  });
};

/**
 * Получает список складов
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @returns {Promise<Object>} - Promise с объектом содержащим массив stores
 */
export const fetchStores = async (baseUrl, authToken) => {
  console.log('🏪 [fetchStores] Начинаем запрос списка складов');
  console.log('🏪 [fetchStores] Параметры:', { baseUrl, authToken: authToken ? '***' : 'не указан' });
  console.log('⏰ [fetchStores] Установлен timeout: 30 секунд');
  
  try {
    const result = await apiRequest('/b2b/v1/front/stores/get', baseUrl, authToken, {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    console.log('✅ [fetchStores] Запрос успешно завершен');
    return result;
  } catch (error) {
    console.error('❌ [fetchStores] Ошибка запроса складов:', error);
    
    // Специальная обработка для timeout ошибок
    if (error.isTimeoutError) {
      console.error('⏰ [fetchStores] Запрос превысил время ожидания');
      throw new Error('Запрос списка складов превысил время ожидания. Сервер может быть недоступен или медленно отвечает.');
    }
    
    throw error;
  }
};


/**
 * Получает главную страницу с виджетами через OpenAPI схему
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {string} locale - Локаль для запроса (например, 'en', 'ru')
 * @returns {Promise<Object>} - Promise с объектом содержащим id и widgets
 */
export const fetchMains = async (baseUrl, authToken, locale = 'en') => {
  return apiRequest('/b2b/v1/front/mains/get', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({ locale }) // Локаль согласно OpenAPI спецификации
  });
};

/**
 * Получает список продуктов с пагинацией через OpenAPI схему
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {string} locale - Локаль для запроса (например, 'en', 'ru')
 * @param {string} categoryId - ID категории для фильтрации продуктов (обязательный параметр)
 * @param {string|null} pageToken - Токен страницы (null для первой страницы, может быть опущен)
 * @param {number} limit - Количество продуктов на странице (максимум 100)
 * @returns {Promise<Object>} - Promise с объектом содержащим массив products и next_page_token
 */
export const fetchProductsList = async (baseUrl, authToken, locale = 'en', categoryId, pageToken = null, limit = 10, storeId = null) => {
  console.log('📦 [fetchProductsList] Загружаем продукты для категории:', categoryId);
  console.log('📦 [fetchProductsList] Page token:', pageToken || 'null (first page)', 'Limit:', limit, 'Store ID:', storeId);
  
  const requestBody = { 
    locale,
    category_id: categoryId,
    limit: limit
  };
  
  // Добавляем store_id если он указан
  if (storeId) {
    requestBody.store_id = storeId;
  }
  
  // Добавляем page_token только если он не null и не пустая строка (не первая страница)
  // Согласно схеме API, page_token должен быть string и может быть опущен для первой страницы
  if (pageToken !== null && pageToken !== undefined && pageToken !== '') {
    // Явно приводим к строке для соответствия OpenAPI схеме
    const pageTokenString = String(pageToken);
    console.log('🔄 [fetchProductsList] page_token before sending:', {
      value: pageTokenString,
      type: typeof pageTokenString
    });
    requestBody.page_token = pageTokenString;
  }

  console.log('📦 [fetchProductsList] Request body:', requestBody);

  return apiRequest('/b2b/v1/front/products/list', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
};

/**
 * Получает корзину пользователя
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {string|null} cartId - ID корзины (опционально, если не указан - вернётся текущая корзина пользователя)
 * @returns {Promise<Object>} - Promise с данными корзины
 */
export const fetchCart = async (baseUrl, authToken, cartId = null) => {
  console.log('🛒 [fetchCart] Загружаем корзину, ID:', cartId || 'current user cart');
  
  const requestBody = {};
  if (cartId) {
    requestBody.id = cartId;
  }

  return apiRequest('/b2b/v1/front/carts/get', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
};

/**
 * Получает информацию о заказах для отслеживания
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {string|null} orderId - ID конкретного заказа (опционально)
 * @returns {Promise<Array>} - Promise с массивом OrdersTrackingOrderInfo
 */
export const fetchOrdersTracking = async (baseUrl, authToken, orderId = null) => {
  console.log('📋 [fetchOrdersTracking] Загружаем информацию о заказах, orderId:', orderId || 'all active');
  
  const requestBody = {};
  if (orderId) {
    requestBody.order_id = orderId;
  }

  return apiRequest('/b2b/v1/front/orders-tracking/get', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
};

/**
 * Создаёт или обновляет корзину
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @param {Object} cartData - Данные корзины
 * @param {Array} cartData.items - Массив товаров в корзине [{id: string, quantity: number}]
 * @param {string} cartData.fulfillment_method - Способ получения ('pickup' или 'courier')
 * @param {string|null} cartData.store_id - ID склада (обязателен для pickup)
 * @param {Object|null} cartData.position - Координаты доставки (обязательны для courier)
 * @param {string|null} cartData.id - ID корзины (для обновления существующей)
 * @param {number|null} cartData.version - Версия корзины (для обновления существующей)
 * @returns {Promise<Object>} - Promise с обновлённой корзиной
 */
export const setCart = async (baseUrl, authToken, cartData) => {
  console.log('🛒 [setCart] Обновляем корзину:', cartData);
  
  // Генерируем idempotency token для безопасности запроса
  const idempotencyToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const requestBody = {
    items: cartData.items || [],
    fulfillment_method: cartData.fulfillment_method || 'pickup'
  };

  // Добавляем store_id для pickup
  if (cartData.store_id) {
    requestBody.store_id = cartData.store_id;
  }

  // Добавляем position для courier
  if (cartData.position) {
    requestBody.position = cartData.position;
  }

  // Добавляем id и version для обновления существующей корзины
  if (cartData.id) {
    requestBody.id = cartData.id;
  }
  if (cartData.version !== undefined && cartData.version !== null) {
    requestBody.version = cartData.version;
  }

  console.log('📦 [setCart] Request body:', requestBody);

  return apiRequest('/b2b/v1/front/carts/set', baseUrl, authToken, {
    method: 'POST',
    headers: {
      'X-Idempotency-Token': idempotencyToken
    },
    body: JSON.stringify(requestBody)
  });
};
