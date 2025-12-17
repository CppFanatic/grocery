// API utilities

// Intercept all fetch requests for debugging
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options = {}] = args;
  const method = options.method || 'GET';
  
  console.log(`🔍 [FETCH INTERCEPTOR] ${method} request to:`, url);
  console.log('🔍 [FETCH INTERCEPTOR] Options:', options);
  
  if (method === 'OPTIONS') {
    console.warn('🚨 [FETCH INTERCEPTOR] OPTIONS request detected!');
    console.warn('🚨 [FETCH INTERCEPTOR] URL:', url);
    console.warn('🚨 [FETCH INTERCEPTOR] This is a CORS preflight request sent automatically by the browser');
  }
  
  return originalFetch.apply(this, args);
};

/**
 * Performs HTTP request to API with authorization
 * @param {string} endpoint - API endpoint (e.g., '/categories' or '/products')
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {Object} options - Additional options for fetch
 * @returns {Promise} - Promise with request result
 */
export const apiRequest = async (endpoint, baseUrl, authToken, options = {}) => {
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add authorization token if specified
  if (authToken && authToken.trim()) {
    headers['Authorization'] = `Bearer ${authToken.trim()}`;
  }

  const config = {
    ...options,
    headers
  };

  const method = options.method || 'POST';
  console.log(`🌐 [API] ${method} request:`, endpoint);
  console.log('📍 URL:', url);
  console.log('📋 Headers:', headers);
  if (config.body) {
    console.log('📦 Body:', config.body);
  }
  
  // Special check for OPTIONS requests
  if (method === 'OPTIONS') {
    console.warn('⚠️ [API] OPTIONS request detected! This may be a CORS preflight request.');
    console.warn('⚠️ [API] Make sure the server properly handles CORS preflight requests.');
  }
  
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏰ [API] Request timeout:', url);
      controller.abort();
    }, 30000); // 30 seconds timeout

    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 [API] Server response:');
    console.log('🔢 Status:', response.status, response.statusText);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Additional check for CORS
    if (response.status === 0 || (response.status === 200 || response.status === 204) && method === 'OPTIONS') {
      console.log('ℹ️ [API] Received response for OPTIONS request (CORS preflight)');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] HTTP Error:');
      console.error('❌ [API] Status:', response.status);
      console.error('❌ [API] Status Text:', response.statusText);
      console.error('❌ [API] Response Body:', errorText);
      console.error('❌ [API] Request URL:', url);
      console.error('❌ [API] Request Method:', options.method || 'POST');
      console.error('❌ [API] Request Headers:', headers);
      
      // Create detailed error
      const detailedError = new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      detailedError.status = response.status;
      detailedError.statusText = response.statusText;
      detailedError.responseBody = errorText;
      detailedError.url = url;
      detailedError.method = options.method || 'POST';
      throw detailedError;
    }
    
    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      console.log('✅ [API] Successful response (204 No Content)');
      return {}; // Return empty object for 204 responses
    }
    
    const responseData = await response.json();
    console.log('✅ [API] Successful response:', responseData);
    return responseData;
  } catch (error) {
    console.error('💥 [API] Request error:');
    console.error('💥 [API] URL:', url);
    console.error('💥 [API] Method:', options.method || 'POST');
    console.error('💥 [API] Headers:', headers);
    console.error('💥 [API] Error Type:', error.constructor.name);
    console.error('💥 [API] Error Message:', error.message);
    console.error('💥 [API] Error Stack:', error.stack);
    
    // Handle timeout errors
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request Timeout: Request exceeded wait time (30 seconds). Server may be unavailable or slow to respond.');
      timeoutError.isTimeoutError = true;
      timeoutError.originalError = error;
      throw timeoutError;
    }
    
    // Handle CORS errors
    if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
      const corsError = new Error('CORS Error: Server does not allow requests from this domain. You may need to configure CORS on the server or use a proxy.');
      corsError.isCorsError = true;
      corsError.originalError = error;
      throw corsError;
    }
    
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      const networkError = new Error('Network Error: Unable to connect to server. Check the URL and server availability.');
      networkError.isNetworkError = true;
      networkError.originalError = error;
      throw networkError;
    }
    
    if (error.message.includes('TypeError')) {
      const typeError = new Error(`Type Error: ${error.message}. There may be an issue with the data format.`);
      typeError.isTypeError = true;
      typeError.originalError = error;
      throw typeError;
    }
    
    throw error;
  }
};



/**
 * Creates a new order from cart
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {Object} orderData - Order data
 * @param {Object} orderData.position - Delivery coordinates {lat: number, lon: number}
 * @param {string} orderData.cart_id - Cart ID
 * @param {number} orderData.cart_version - Cart version
 * @returns {Promise<Object>} - Promise with order creation result {order_id: string}
 */
export const createOrder = async (baseUrl, authToken, orderData) => {
  console.log('📦 [createOrder] Creating order:', orderData);
  
  // Generate idempotency token for request safety
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
 * Gets order status
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Promise with order data
 */
export const fetchOrderStatus = async (baseUrl, authToken, orderId) => {
  return apiRequest('/orders/status', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId })
  });
};

/**
 * Updates order status
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Promise with update result
 */
export const updateOrderStatus = async (baseUrl, authToken, orderId, status) => {
  return apiRequest('/orders/update-status', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, status })
  });
};

/**
 * Gets list of stores
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @returns {Promise<Object>} - Promise with object containing stores array
 */
export const fetchStores = async (baseUrl, authToken) => {
  console.log('🏪 [fetchStores] Starting stores list request');
  console.log('🏪 [fetchStores] Parameters:', { baseUrl, authToken: authToken ? '***' : 'not specified' });
  console.log('⏰ [fetchStores] Timeout set: 30 seconds');
  
  try {
    const result = await apiRequest('/b2b/v1/front/stores/get', baseUrl, authToken, {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    console.log('✅ [fetchStores] Request completed successfully');
    return result;
  } catch (error) {
    console.error('❌ [fetchStores] Error fetching stores:', error);
    
    // Special handling for timeout errors
    if (error.isTimeoutError) {
      console.error('⏰ [fetchStores] Request exceeded wait time');
      throw new Error('Stores list request timed out. Server may be unavailable or slow to respond.');
    }
    
    throw error;
  }
};


/**
 * Gets main page with widgets via OpenAPI schema
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {string} locale - Locale for request (e.g., 'en', 'ru')
 * @returns {Promise<Object>} - Promise with object containing id and widgets
 */
export const fetchMains = async (baseUrl, authToken, locale = 'en') => {
  return apiRequest('/b2b/v1/front/mains/get', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify({ locale }) // Locale according to OpenAPI specification
  });
};

/**
 * Gets products list with pagination via OpenAPI schema
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {string} locale - Locale for request (e.g., 'en', 'ru')
 * @param {string} categoryId - Category ID for filtering products (required parameter)
 * @param {string|null} pageToken - Page token (null for first page, can be omitted)
 * @param {number} limit - Number of products per page (maximum 100)
 * @returns {Promise<Object>} - Promise with object containing products array and next_page_token
 */
export const fetchProductsList = async (baseUrl, authToken, locale = 'en', categoryId, pageToken = null, limit = 10, storeId = null) => {
  console.log('📦 [fetchProductsList] Loading products for category:', categoryId);
  console.log('📦 [fetchProductsList] Page token:', pageToken || 'null (first page)', 'Limit:', limit, 'Store ID:', storeId);
  
  const requestBody = { 
    locale,
    category_id: categoryId,
    limit: limit
  };
  
  // Add store_id if specified
  if (storeId) {
    requestBody.store_id = storeId;
  }
  
  // page_token: null — first page request (field not included in request)
  // page_token: string — next page request (value from next_page_token of previous response)
  if (pageToken !== null) {
    console.log('🔄 [fetchProductsList] page_token:', pageToken);
    requestBody.page_token = pageToken;
  } else {
    console.log('🔄 [fetchProductsList] page_token is null - requesting first page');
  }

  console.log('📦 [fetchProductsList] Request body:', requestBody);

  return apiRequest('/b2b/v1/front/products/list', baseUrl, authToken, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
};

/**
 * Gets user's cart
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {string|null} cartId - Cart ID (optional, if not specified - returns current user's cart)
 * @returns {Promise<Object>} - Promise with cart data
 */
export const fetchCart = async (baseUrl, authToken, cartId = null) => {
  console.log('🛒 [fetchCart] Loading cart, ID:', cartId || 'current user cart');
  
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
 * Gets orders tracking information
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {string|null} orderId - Specific order ID (optional)
 * @returns {Promise<Array>} - Promise with OrdersTrackingOrderInfo array
 */
export const fetchOrdersTracking = async (baseUrl, authToken, orderId = null) => {
  console.log('📋 [fetchOrdersTracking] Loading orders info, orderId:', orderId || 'all active');
  
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
 * Creates or updates cart
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @param {Object} cartData - Cart data
 * @param {Array} cartData.items - Array of cart items [{id: string, quantity: number}]
 * @param {string} cartData.fulfillment_method - Fulfillment method ('pickup' or 'courier')
 * @param {string|null} cartData.store_id - Store ID (required for pickup)
 * @param {Object|null} cartData.position - Delivery coordinates (required for courier)
 * @param {string|null} cartData.id - Cart ID (for updating existing cart)
 * @param {number|null} cartData.version - Cart version (for updating existing cart)
 * @returns {Promise<Object>} - Promise with updated cart
 */
export const setCart = async (baseUrl, authToken, cartData) => {
  console.log('🛒 [setCart] Updating cart:', cartData);
  
  // Generate idempotency token for request safety
  const idempotencyToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const requestBody = {
    items: cartData.items || [],
    fulfillment_method: cartData.fulfillment_method || 'pickup'
  };

  // Add store_id for pickup
  if (cartData.store_id) {
    requestBody.store_id = cartData.store_id;
  }

  // Add position for courier
  if (cartData.position) {
    requestBody.position = cartData.position;
  }

  // Add id and version for updating existing cart
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
