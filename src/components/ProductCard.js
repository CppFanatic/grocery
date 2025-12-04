import React from 'react';
import './ProductCard.css';

function ProductCard({ product, onAddToCart }) {
  const handleAddToCart = () => {
    onAddToCart(product);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image_url} alt={product.title} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.title}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">${product.price}</span>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProductCard);
