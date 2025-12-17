import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import './StoreSelector.css';

function StoreSelector({ selectedStore, onStoreSelect, apiUrl, authToken }) {
  console.log('🏪 [StoreSelector] Component rendering with props:', {
    selectedStore: selectedStore ? selectedStore.name : 'not selected',
    apiUrl,
    authToken: authToken ? '***' : 'not specified'
  });
  
  // Additional logging for debugging
  console.warn('🔍 [DEBUG] StoreSelector rendering!');

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

  // Load stores list
  const loadStores = useCallback(async () => {
    // Check if loading is already in progress
    if (api.loading || isRequestInProgress) {
      console.log('⏳ [StoreSelector] Loading already in progress, skipping...');
      return;
    }
    
    // Check if there was an error (if so, load only via retry button)
    if (error && stores.length === 0) {
      console.log('⚠️ [StoreSelector] There is an error, loading only via retry button');
      return;
    }
    
    // Set loading flag
    setIsRequestInProgress(true);
    
    console.log('🏪 [StoreSelector] Starting stores loading...');
    console.log('🔧 [StoreSelector] Settings:', { apiUrl, authToken: authToken ? '***' : 'not specified' });
    

    console.log('🌐 [StoreSelector] Loading data from real API...');
    setError(null);

    try {
      // Use API hook to get stores list
      const data = await api.getStores();
      
      // According to OpenAPI specification, response should contain stores field
      if (data && data.stores && Array.isArray(data.stores)) {
        console.log('📊 [StoreSelector] Store data received:', data.stores.length, 'stores');
        console.log('📊 [StoreSelector] Sample store data:', data.stores[0]);
        
        // Transform API data to format understood by our component
        const formattedStores = data.stores.map(store => {
          // Check required fields according to schema
          if (!store.id || !store.status || !store.location) {
            console.warn('⚠️ [StoreSelector] Store with incomplete data:', store);
          }
          
          return {
            id: store.id,
            name: store.name || `Store ${store.id}`,
            address: store.address || 'Address not specified',
            coordinates: store.location ? {
              lat: store.location.lat,
              lon: store.location.lon
            } : null,
            working_hours: store.store_schedule ? 
              formatStoreSchedule(store.store_schedule) : 'Working hours not specified',
            status: store.status || 'unknown',
            timezone: store.timezone || null,
            // Additional fields from schema
            store_schedule: store.store_schedule || null
          };
        });
        
        setStores(formattedStores);
        console.log('✅ [StoreSelector] API data loaded successfully:', formattedStores.length, 'stores');
        console.log('📊 [StoreSelector] Stores set:', formattedStores);
      } else {
        console.warn('⚠️ [StoreSelector] Unexpected API response format:', data);
        console.warn('⚠️ [StoreSelector] Expected object with stores field (array)');
        setStores([]);
      }
    } catch (err) {
      console.error('❌ [StoreSelector] Error loading stores:', err);
      console.error('❌ [StoreSelector] Error type:', err.constructor.name);
      console.error('❌ [StoreSelector] Error message:', err.message);
      
      // Detailed error handling
      let errorMessage = 'Error loading stores';
      
      if (err.isTimeoutError || err.message.includes('exceeded wait time')) {
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
      
      // On error, leave stores list empty
      console.log('🔄 [StoreSelector] Stores list remains empty due to error');
      setStores([]);
    } finally {
      console.log('🏁 [StoreSelector] Loading completed');
      setIsRequestInProgress(false);
    }
  }, [apiUrl, authToken, api.loading, error, stores.length, isRequestInProgress]);

  // Clear stores list and selected store when API settings change
  useEffect(() => {
    console.log('🔄 [StoreSelector] API settings changed, clearing data');
    setStores([]);
    setError(null);
    // Clear selected store when API mode changes
    if (selectedStore) {
      console.log('🗑️ [StoreSelector] Resetting selected store:', selectedStore.name);
      onStoreSelect(null);
    }
  }, [apiUrl, authToken]); // Removed selectedStore and onStoreSelect from dependencies

  // Load stores only on first list open (if no error)
  useEffect(() => {
    console.log('🔍 [StoreSelector] useEffect triggered:', { 
      showStoreList, 
      storesLength: stores.length, 
      loading: api.loading, 
      hasError: !!error,
      isRequestInProgress 
    });
    if (showStoreList && stores.length === 0 && !api.loading && !error && !isRequestInProgress) {
      console.log('📂 [StoreSelector] Modal opened, loading stores');
      loadStores();
    }
  }, [showStoreList, stores.length, loadStores, api.loading, error, isRequestInProgress]);

  const handleStoreSelect = (store) => {
    onStoreSelect(store);
    setShowStoreList(false);
  };

  // Log component state on each render
  console.log('🎨 [StoreSelector] Component render:', {
    loading: api.loading,
    storesCount: stores.length,
    showStoreList,
    selectedStore: selectedStore ? selectedStore.name : 'not selected',
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
            console.log('🖱️ [StoreSelector] "Select Store" button clicked');
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
                      console.log('🔄 [StoreSelector] Retrying stores loading');
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
