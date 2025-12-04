import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import './StoreSelector.css';

function StoreSelector({ selectedStore, onStoreSelect, apiUrl, authToken }) {
  console.log('🏪 [StoreSelector] Компонент рендерится с пропсами:', {
    selectedStore: selectedStore ? selectedStore.name : 'не выбран',
    apiUrl,
    authToken: authToken ? '***' : 'не указан'
  });
  
  // Дополнительное логирование для отладки
  console.warn('🔍 [DEBUG] StoreSelector рендерится!');

    const [showStoreList, setShowStoreList] = useState(false);
    const [stores, setStores] = useState([]);
    const [error, setError] = useState(null);
    const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const api = useApi(apiUrl, authToken);

  // Function to format store working hours
  const formatStoreSchedule = (schedule) => {
    if (!Array.isArray(schedule) || schedule.length === 0) {
      return 'Working hours not specified';
    }

    // Look for workday schedule
    const workdaySchedule = schedule.find(item => item.type === 'workday');
    const everydaySchedule = schedule.find(item => item.type === 'everyday');
    
    const scheduleToUse = workdaySchedule || everydaySchedule || schedule[0];
    
    if (scheduleToUse && scheduleToUse.open_time && scheduleToUse.close_time) {
      return `${scheduleToUse.open_time} - ${scheduleToUse.close_time}`;
    }
    
    return 'Working hours not specified';
  };

  // Загружаем список складов
  const loadStores = useCallback(async () => {
    // Проверяем, не идет ли уже загрузка
    if (api.loading || isRequestInProgress) {
      console.log('⏳ [StoreSelector] Загрузка уже идет, пропускаем...');
      return;
    }
    
    // Проверяем, не было ли ошибки (если была, загружаем только по кнопке повтора)
    if (error && stores.length === 0) {
      console.log('⚠️ [StoreSelector] Есть ошибка, загрузка только по кнопке повтора');
      return;
    }
    
    // Устанавливаем флаг загрузки
    setIsRequestInProgress(true);
    
    console.log('🏪 [StoreSelector] Начинаем загрузку складов...');
    console.log('🔧 [StoreSelector] Настройки:', { apiUrl, authToken: authToken ? '***' : 'не указан' });
    

    console.log('🌐 [StoreSelector] Загружаем данные из реального API...');
    setError(null);

    try {
      // Используем API хук для получения списка складов
      const data = await api.getStores();
      
      // Согласно OpenAPI спецификации, ответ должен содержать поле stores
      if (data && data.stores && Array.isArray(data.stores)) {
        console.log('📊 [StoreSelector] Получены данные складов:', data.stores.length, 'складов');
        console.log('📊 [StoreSelector] Пример данных склада:', data.stores[0]);
        
        // Преобразуем данные API в формат, понятный нашему компоненту
        const formattedStores = data.stores.map(store => {
          // Проверяем обязательные поля согласно схеме
          if (!store.id || !store.status || !store.location) {
            console.warn('⚠️ [StoreSelector] Склад с неполными данными:', store);
          }
          
          return {
            id: store.id,
            name: store.name || `Склад ${store.id}`,
            address: store.address || 'Адрес не указан',
            coordinates: store.location ? {
              lat: store.location.lat,
              lon: store.location.lon
            } : null,
            working_hours: store.store_schedule ? 
              formatStoreSchedule(store.store_schedule) : 'Working hours not specified',
            status: store.status || 'unknown',
            timezone: store.timezone || null,
            // Дополнительные поля из схемы
            store_schedule: store.store_schedule || null
          };
        });
        
        setStores(formattedStores);
        console.log('✅ [StoreSelector] Данные API успешно загружены:', formattedStores.length, 'складов');
        console.log('📊 [StoreSelector] Установлены склады:', formattedStores);
      } else {
        console.warn('⚠️ [StoreSelector] Неожиданный формат ответа API:', data);
        console.warn('⚠️ [StoreSelector] Ожидался объект с полем stores (массив)');
        setStores([]);
      }
    } catch (err) {
      console.error('❌ [StoreSelector] Ошибка загрузки складов:', err);
      console.error('❌ [StoreSelector] Тип ошибки:', err.constructor.name);
      console.error('❌ [StoreSelector] Сообщение ошибки:', err.message);
      
      // Detailed error handling
      let errorMessage = 'Error loading stores';
      
      if (err.isTimeoutError || err.message.includes('превысил время ожидания')) {
        errorMessage = 'Request timed out (30 seconds). Server may be unavailable or slow to respond. Please try again.';
      } else if (err.isCorsError || err.message.includes('CORS')) {
        errorMessage = 'CORS error: Server does not allow requests from local domain. Try using a proxy or configure CORS on the server.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Stores not found (404). Check the API endpoint.';
      } else if (err.message.includes('401') || err.message.includes('403')) {
        errorMessage = 'Authorization error: check your authorization token.';
      } else if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: unable to connect to server. Check the URL and server availability.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Internal server error (500).';
      } else {
        errorMessage = err.message || 'Unknown error loading stores';
      }
      
      setError(errorMessage);
      
      // В случае ошибки оставляем список складов пустым
      console.log('🔄 [StoreSelector] Список складов остается пустым из-за ошибки');
      setStores([]);
    } finally {
      console.log('🏁 [StoreSelector] Загрузка завершена');
      setIsRequestInProgress(false);
    }
  }, [apiUrl, authToken, api.loading, error, stores.length, isRequestInProgress]);

  // Очищаем список складов и выбранный склад при изменении настроек API
  useEffect(() => {
    console.log('🔄 [StoreSelector] Настройки API изменились, очищаем данные');
    setStores([]);
    setError(null);
    // Очищаем выбранный склад при изменении режима API
    if (selectedStore) {
      console.log('🗑️ [StoreSelector] Сбрасываем выбранный склад:', selectedStore.name);
      onStoreSelect(null);
    }
  }, [apiUrl, authToken]); // Убрали selectedStore и onStoreSelect из зависимостей

  // Загружаем склады только при первом открытии списка (если нет ошибки)
  useEffect(() => {
    console.log('🔍 [StoreSelector] useEffect triggered:', { 
      showStoreList, 
      storesLength: stores.length, 
      loading: api.loading, 
      hasError: !!error,
      isRequestInProgress 
    });
    if (showStoreList && stores.length === 0 && !api.loading && !error && !isRequestInProgress) {
      console.log('📂 [StoreSelector] Открыто модальное окно, загружаем склады');
      loadStores();
    }
  }, [showStoreList, stores.length, loadStores, api.loading, error, isRequestInProgress]);

  const handleStoreSelect = (store) => {
    onStoreSelect(store);
    setShowStoreList(false);
  };

  // Логируем состояние компонента при каждом рендере
  console.log('🎨 [StoreSelector] Рендер компонента:', {
    loading: api.loading,
    storesCount: stores.length,
    showStoreList,
    selectedStore: selectedStore ? selectedStore.name : 'не выбран',
    error
  });

  return (
    <>
      <div className="store-selector">
        <div className="store-info">
          <div className="store-name">
            {selectedStore ? selectedStore.name : 'No store selected'}
          </div>
          <div className="store-address">
            {selectedStore ? selectedStore.address : 'Select a store for delivery'}
          </div>
        </div>
        <button 
          className="select-store-btn"
          onClick={() => {
            console.log('🖱️ [StoreSelector] "Select store" button clicked');
            setShowStoreList(true);
          }}
        >
          Select Store
        </button>
      </div>

      {showStoreList && (
        <div className="store-list-modal">
          <div className="store-list-content">
            <div className="store-list-header">
              <h2>Select a Store</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowStoreList(false)}
              >
                ×
              </button>
            </div>
            
            <div className="store-list-body">
              {(api.loading || isRequestInProgress) && (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading stores...</p>
                  {isRequestInProgress && (
                    <p className="loading-timeout-info">Maximum wait time: 30 seconds</p>
                  )}
                </div>
              )}
              
              {error && (
                <div className="error-state">
                  <div className="error-icon">⚠️</div>
                  <p>Loading error: {error}</p>
                  <button 
                    className="retry-button"
                    onClick={() => {
                      console.log('🔄 [StoreSelector] Retrying store loading');
                      setError(null);
                      setIsRequestInProgress(false);
                      loadStores();
                    }}
                    disabled={api.loading || isRequestInProgress}
                  >
                    {(api.loading || isRequestInProgress) ? 'Loading...' : 'Retry'}
                  </button>
                </div>
              )}
              
              {!api.loading && !error && stores.length === 0 && (
                <div className="empty-state">
                  <p>No stores found</p>
                </div>
              )}
              
              {!api.loading && stores.length > 0 && (
                <div className="stores-list">
                  {stores.map(store => (
                    <div 
                      key={store.id} 
                      className={`store-item ${selectedStore?.id === store.id ? 'selected' : ''}`}
                      onClick={() => handleStoreSelect(store)}
                    >
                      <div className="store-item-header">
                        <h3 className="store-item-name">{store.name}</h3>
                        {selectedStore?.id === store.id && (
                          <span className="selected-indicator">✓</span>
                        )}
                      </div>
                      <div className="store-item-address">{store.address}</div>
                      {store.working_hours && (
                        <div className="store-item-hours">
                          Working hours: {store.working_hours}
                        </div>
                      )}
                      {store.phone && (
                        <div className="store-item-phone">
                          Phone: {store.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StoreSelector;
