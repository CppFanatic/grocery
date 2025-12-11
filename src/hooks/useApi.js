import { useState, useCallback, useMemo } from 'react';
import { 
  createOrder, 
  fetchOrderStatus, 
  updateOrderStatus,
  fetchStores,
  fetchMains,
  fetchProductsList,
  fetchCart,
  setCart,
  fetchOrdersTracking
} from '../utils/api';

/**
 * Хук для работы с API
 * @param {string} baseUrl - Базовый URL API
 * @param {string} authToken - Токен авторизации
 * @returns {Object} - Объект с функциями для работы с API и состоянием загрузки
 */
export const useApi = (baseUrl, authToken) => {
  console.log('🔧 [useApi] Хук инициализируется с параметрами:', {
    baseUrl,
    authToken: authToken ? '***' : 'не указан'
  });
  
  // Дополнительное логирование для отладки
  console.warn('🔍 [DEBUG] useApi хук инициализируется!');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiCall = useCallback(async (apiFunction, ...args) => {
    console.log('🔄 [useApi] handleApiCall вызван с функцией:', apiFunction.name);
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(baseUrl, authToken, ...args);
      console.log('✅ [useApi] handleApiCall успешно завершен');
      return result;
    } catch (err) {
      console.error('❌ [useApi] handleApiCall ошибка:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, authToken]);



  const submitOrder = useCallback((orderData) => {
    return handleApiCall(createOrder, orderData);
  }, [handleApiCall]);

  const getOrderStatus = useCallback((orderId) => {
    return handleApiCall(fetchOrderStatus, orderId);
  }, [handleApiCall]);

  const updateOrder = useCallback((orderId, status) => {
    return handleApiCall(updateOrderStatus, orderId, status);
  }, [handleApiCall]);

  const getStores = useCallback(() => {
    console.log('🏪 [useApi] Вызывается getStores');
    return handleApiCall(fetchStores);
  }, [handleApiCall]);


  const getMains = useCallback((locale = 'en') => {
    console.log('🏠 [useApi] Вызывается getMains с локалью:', locale);
    return handleApiCall(fetchMains, locale);
  }, [handleApiCall]);

  const getProductsList = useCallback((locale = 'en', categoryId, pageToken = null, limit = 10, storeId = null) => {
    console.log('📦 [useApi] Вызывается getProductsList с параметрами:', { locale, categoryId, pageToken: pageToken || 'null (first page)', limit, storeId });
    return handleApiCall(fetchProductsList, locale, categoryId, pageToken, limit, storeId);
  }, [handleApiCall]);

  const getCart = useCallback((cartId = null) => {
    console.log('🛒 [useApi] Вызывается getCart с ID:', cartId || 'current user cart');
    return handleApiCall(fetchCart, cartId);
  }, [handleApiCall]);

  const updateCart = useCallback((cartData) => {
    console.log('🛒 [useApi] Вызывается updateCart с данными:', cartData);
    return handleApiCall(setCart, cartData);
  }, [handleApiCall]);

  const getOrdersTracking = useCallback((orderId = null) => {
    console.log('📋 [useApi] Вызывается getOrdersTracking с orderId:', orderId || 'all active');
    return handleApiCall(fetchOrdersTracking, orderId);
  }, [handleApiCall]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    loading,
    error,
    submitOrder,
    getOrderStatus,
    updateOrder,
    getStores,
    getMains,
    getProductsList,
    getCart,
    updateCart,
    getOrdersTracking
  }), [
    loading,
    error,
    submitOrder,
    getOrderStatus,
    updateOrder,
    getStores,
    getMains,
    getProductsList,
    getCart,
    updateCart,
    getOrdersTracking
  ]);
};
