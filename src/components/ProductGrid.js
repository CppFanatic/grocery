import React, { useState } from 'react';
import ProductCard from './ProductCard';
import CategoryCard from './CategoryCard';
import './ProductGrid.css';

function ProductGrid({ categories, products, onAddToCart, loading, error, selectedStore, useRealApi, onLoadProducts }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategories, setShowCategories] = useState(true);

  const handleCategorySelect = (category) => {
    console.log('📂 [ProductGrid] Выбрана категория:', category.name, 'ID:', category.id);
    setSelectedCategory(category);
    setShowCategories(false);
    
    // Загружаем продукты для выбранной категории, если используем реальный API
    if (useRealApi && onLoadProducts) {
      console.log('📦 [ProductGrid] Загружаем продукты для категории:', category.id);
      onLoadProducts(category.id);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowCategories(true);
  };

  const filteredProducts = selectedCategory 
    ? products.filter(product => product.categoryId === selectedCategory.id)
    : products;

  // Проверяем, выбран ли склад для реального API
  if (useRealApi && !selectedStore) {
    return (
      <div className="product-grid">
        <div className="store-required-state">
          <div className="store-required-icon">🏪</div>
          <h3>Выберите склад для начала покупок</h3>
          <p>Чтобы увидеть доступные товары, сначала выберите склад для доставки.</p>
          <p>Нажмите кнопку "Выбрать склад" выше.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="product-grid">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-grid">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>Ошибка загрузки данных: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {showCategories ? (
        <>
          <div className="grid-header">
            <h2>Категории</h2>
          </div>
          <div className="categories-grid">
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => handleCategorySelect(category)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid-header">
            <button className="back-button" onClick={handleBackToCategories}>
              ← Назад к категориям
            </button>
            <h2>{selectedCategory.name}</h2>
          </div>
          <div className="products-grid">
            {loading && filteredProducts.length === 0 ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Загрузка продуктов...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>Продукты не найдены</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProductGrid;
