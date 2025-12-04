import React, { useState, useEffect } from 'react';
import './BottomPanel.css';

function BottomPanel({
  cart,
  orderStatus,
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
  onLocaleChange
}) {
  const [showCart, setShowCart] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const getOrderStatusIcon = () => {
    switch (orderStatus) {
      case 'Preparing':
        return '👨‍🍳';
      case 'On the way':
        return '🚗';
      case 'Delivered':
        return '✅';
      default:
        return '📦';
    }
  };

  return (
    <>
      <div className="bottom-panel">
        <div className="panel-item" onClick={() => setShowCart(true)}>
          <div className="icon">🛒</div>
          <span className="label">Cart</span>
          {totalItems > 0 && <span className="badge">{totalItems}</span>}
        </div>
        
        <div className="panel-item order-status">
          <div className="icon">{getOrderStatusIcon()}</div>
          <span className="label">{orderStatus}</span>
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
