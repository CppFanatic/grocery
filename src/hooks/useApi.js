import { useState, useCallback } from 'react';
import { 
  fetchCategories, 
  fetchProducts, 
  createOrder, 
  fetchOrderStatus, 
  updateOrderStatus,
  fetchStores
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

  const getCategories = useCallback(() => {
    return handleApiCall(fetchCategories);
  }, [handleApiCall]);

  const getProducts = useCallback((categoryId = null) => {
    return handleApiCall(fetchProducts, categoryId);
  }, [handleApiCall]);

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

  return {
    loading,
    error,
    getCategories,
    getProducts,
    submitOrder,
    getOrderStatus,
    updateOrder,
    getStores
  };
};
