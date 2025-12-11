import React, { useState, useEffect, useCallback, useRef } from 'react';
import './BottomPanel.css';
import { fetchOrdersTracking } from '../utils/api';

// Helper to get human-readable status text
const getOrderStateText = (state) => {
  const stateMap = {
    'created': 'Order Created',
    'assembling': 'Assembling',
    'assembled': 'Ready for Pickup',
    'courier_assigned': 'Courier Assigned',
    'delivering': 'On the Way',
    'delivery_arrived': 'Arrived',
    'closed': 'Delivered',
    'canceled': 'Canceled'
  };
  return stateMap[state] || state;
};

// Helper to get icon for order state
const getOrderStateIcon = (state) => {
  const iconMap = {
    'created': '📝',
    'assembling': '👨‍🍳',
    'assembled': '📦',
    'courier_assigned': '🚴',
    'delivering': '🚗',
    'delivery_arrived': '🏠',
    'closed': '✅',
    'canceled': '❌'
  };
  return iconMap[state] || '📋';
};

function BottomPanel({
  cart,
  isLoggedIn,
  onLogin,
  onUpdateQuantity,
  onRemoveFromCart,
  totalItems,
  totalPrice,
  apiUrl,
  onApiUrlChange,
  authToken,
  onAuthTokenChange,
  onCheckout,
  locale,
  onLocaleChange,
  checkoutSuccess // New prop to trigger fetch after checkout
}) {
  const [showCart, setShowCart] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const pollingIntervalRef = useRef(null);

  // Fetch active orders from API
  const fetchActiveOrders = useCallback(async () => {
    if (!apiUrl || !authToken) {
      console.log('📋 [BottomPanel] Skipping orders fetch - missing apiUrl or authToken');
      return;
    }

    try {
      setOrdersLoading(true);
      console.log('📋 [BottomPanel] Fetching active orders...');
      const orders = await fetchOrdersTracking(apiUrl, authToken);
      
      // Filter only active orders (not closed or canceled)
      const active = (orders || []).filter(
        order => order.state !== 'closed' && order.state !== 'canceled'
      );
      
      console.log('✅ [BottomPanel] Active orders:', active.length);
      setActiveOrders(active);
    } catch (error) {
      console.error('❌ [BottomPanel] Error fetching orders:', error);
      // Don't clear active orders on error to avoid UI flicker
    } finally {
      setOrdersLoading(false);
    }
  }, [apiUrl, authToken]);

  // Start polling for orders
  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Fetch immediately
    fetchActiveOrders();

    // Set up polling every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 [BottomPanel] Polling for orders...');
      fetchActiveOrders();
    }, 10000);

    console.log('⏱️ [BottomPanel] Started polling for orders (every 10s)');
  }, [fetchActiveOrders]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('⏹️ [BottomPanel] Stopped polling for orders');
    }
  }, []);

  // Trigger fetch immediately upon successful checkout
  useEffect(() => {
    if (checkoutSuccess) {
      console.log('🎉 [BottomPanel] Checkout success detected, fetching orders...');
      startPolling();
    }
  }, [checkoutSuccess, startPolling]);

  // Start polling when component mounts (if we have credentials)
  useEffect(() => {
    if (apiUrl && authToken) {
      startPolling();
    }
    
    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [apiUrl, authToken, startPolling, stopPolling]);

  // Get display text for orders button
  const getOrdersDisplayText = () => {
    if (ordersLoading && activeOrders.length === 0) {
      return 'Loading...';
    }
    
    if (activeOrders.length === 0) {
      return 'No Orders';
    }
    
    if (activeOrders.length === 1) {
      return getOrderStateText(activeOrders[0].state);
    }
    
    return `${activeOrders.length} Orders`;
  };

  // Get icon for orders button
  const getOrdersIcon = () => {
    if (activeOrders.length === 0) {
      return '📋';
    }
    
    if (activeOrders.length === 1) {
      return getOrderStateIcon(activeOrders[0].state);
    }
    
    return '📋';
  };

  return (
    <>
      <div className="bottom-panel">
        <div className="panel-item" onClick={() => setShowCart(true)}>
          <div className="icon">🛒</div>
          <span className="label">Cart</span>
          {totalItems > 0 && <span className="badge">{totalItems}</span>}
        </div>
        
        <div className="panel-item order-status" onClick={fetchActiveOrders}>
          <div className="icon">{getOrdersIcon()}</div>
          <span className="label">{getOrdersDisplayText()}</span>
          {activeOrders.length > 1 && <span className="badge orders-badge">{activeOrders.length}</span>}
        </div>
        
        <div className="panel-item" onClick={onLogin}>
          <div className="icon">{isLoggedIn ? '👤' : '🔐'}</div>
          <span className="label">{isLoggedIn ? 'Profile' : 'Sign In'}</span>
        </div>
        
        <div className="panel-item" onClick={() => setShowSettings(true)}>
          <div className="icon">⚙️</div>
          <span className="label">Settings</span>
        </div>
      </div>

      {showCart && (
        <div className="cart-modal">
          <div className="cart-content">
            <div className="cart-header">
              <h2>Cart</h2>
              <button className="close-btn" onClick={() => setShowCart(false)}>×</button>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="empty-cart">Cart is empty</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p>${item.price}</p>
                    </div>
                    <div className="item-controls">
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                      <button className="remove-btn" onClick={() => onRemoveFromCart(item.id)}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="total">
                  <strong>Total: ${totalPrice}</strong>
                </div>
                <button className="checkout-btn" onClick={onCheckout}>Checkout</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
            </div>
            
            <div className="settings-body">
              <div className="setting-item">
                <label htmlFor="apiUrl">Backend API URL:</label>
                <input
                  id="apiUrl"
                  type="url"
                  value={apiUrl}
                  onChange={(e) => onApiUrlChange(e.target.value)}
                  placeholder="http://localhost:3005"
                  className="api-url-input"
                />
                  <p className="setting-description">
                    API server address for fetching product and order data. Saved to localStorage.
                  </p>
              </div>
              
                <div className="setting-item">
                  <label htmlFor="authToken">Authorization Token:</label>
                  <input
                    id="authToken"
                    type="password"
                    value={authToken}
                    onChange={(e) => onAuthTokenChange(e.target.value)}
                    placeholder="Enter authorization token"
                    className="auth-token-input"
                  />
                  <p className="setting-description">
                    Token for API request authorization. Automatically added as <code>Authorization: Bearer &lt;token&gt;</code> header to all requests. Saved to localStorage.
                  </p>
                </div>

              <div className="setting-item">
                <label htmlFor="locale">Locale:</label>
                <select
                  id="locale"
                  value={locale}
                  onChange={(e) => onLocaleChange(e.target.value)}
                  className="locale-select"
                >
                  <option value="en">English (en)</option>
                  <option value="ru">Русский (ru)</option>
                  <option value="es">Español (es)</option>
                  <option value="fr">Français (fr)</option>
                  <option value="de">Deutsch (de)</option>
                </select>
                <p className="setting-description">
                  Language for API requests (two-letter code). Saved to localStorage.
                </p>
              </div>

            </div>
            
            <div className="settings-footer">
                <button 
                  className="save-btn"
                  onClick={() => setShowSettings(false)}
                >
                  Save
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BottomPanel;
