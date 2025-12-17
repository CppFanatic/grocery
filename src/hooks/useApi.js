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
 * Hook for working with API
 * @param {string} baseUrl - Base API URL
 * @param {string} authToken - Authorization token
 * @returns {Object} - Object with API functions and loading state
 */
export const useApi = (baseUrl, authToken) => {
  console.log('🔧 [useApi] Hook initializing with parameters:', {
    baseUrl,
    authToken: authToken ? '***' : 'not specified'
  });
  
  // Additional logging for debugging
  console.warn('🔍 [DEBUG] useApi hook initializing!');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiCall = useCallback(async (apiFunction, ...args) => {
    console.log('🔄 [useApi] handleApiCall called with function:', apiFunction.name);
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(baseUrl, authToken, ...args);
      console.log('✅ [useApi] handleApiCall completed successfully');
      return result;
    } catch (err) {
      console.error('❌ [useApi] handleApiCall error:', err);
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
    console.log('🏪 [useApi] Calling getStores');
    return handleApiCall(fetchStores);
  }, [handleApiCall]);


  const getMains = useCallback((locale = 'en') => {
    console.log('🏠 [useApi] Calling getMains with locale:', locale);
    return handleApiCall(fetchMains, locale);
  }, [handleApiCall]);

  const getProductsList = useCallback((locale = 'en', categoryId, pageToken = null, limit = 10, storeId = null) => {
    console.log('📦 [useApi] Calling getProductsList with parameters:', { locale, categoryId, pageToken: pageToken || 'null (first page)', limit, storeId });
    return handleApiCall(fetchProductsList, locale, categoryId, pageToken, limit, storeId);
  }, [handleApiCall]);

  const getCart = useCallback((cartId = null) => {
    console.log('🛒 [useApi] Calling getCart with ID:', cartId || 'current user cart');
    return handleApiCall(fetchCart, cartId);
  }, [handleApiCall]);

  const updateCart = useCallback((cartData) => {
    console.log('🛒 [useApi] Calling updateCart with data:', cartData);
    return handleApiCall(setCart, cartData);
  }, [handleApiCall]);

  const getOrdersTracking = useCallback((orderId = null) => {
    console.log('📋 [useApi] Calling getOrdersTracking with orderId:', orderId || 'all active');
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
