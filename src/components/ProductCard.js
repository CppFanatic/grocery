import React from 'react';
import './ProductCard.css';

function ProductCard({ product, onAddToCart }) {
  const handleAddToCart = () => {
    onAddToCart(product);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">{product.price} ₽</span>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
