import React, { useState } from 'react';
import ProductCard from './ProductCard';
import './GridView.css';

function GridView({ gridData, products, onAddToCart, loading, error, selectedStore, useRealApi, onLoadProducts }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleCategorySelect = (category, group) => {
    console.log('📂 [GridView] Выбрана категория:', category.title, 'ID:', category.id, 'из группы:', group.title);
    setSelectedCategory(category);
    setSelectedGroup(group);
    
    // Загружаем продукты для выбранной категории, если используем реальный API
    if (useRealApi && onLoadProducts) {
      console.log('📦 [GridView] Загружаем продукты для категории:', category.id);
      onLoadProducts(category.id);
    }
  };

  const handleBackToGrid = () => {
    setSelectedCategory(null);
    setSelectedGroup(null);
  };

  const filteredProducts = selectedCategory 
    ? products.filter(product => product.categoryId === selectedCategory.id)
    : products;

  // Проверяем, выбран ли склад для реального API
  if (useRealApi && !selectedStore) {
    return (
      <div className="grid-view">
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
      <div className="grid-view">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid-view">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>Ошибка загрузки данных: {error}</p>
        </div>
      </div>
    );
  }

  if (!gridData || !gridData.groups || gridData.groups.length === 0) {
    return (
      <div className="grid-view">
        <div className="empty-state">
          <p>Нет доступных категорий</p>
        </div>
      </div>
    );
  }

  // Показываем продукты выбранной категории
  if (selectedCategory) {
    return (
      <div className="grid-view">
        <div className="grid-header">
          <button className="back-button" onClick={handleBackToGrid}>
            ← Назад к категориям
          </button>
          <h2>{selectedCategory.title}</h2>
          {selectedGroup && <p className="group-subtitle">{selectedGroup.title}</p>}
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
      </div>
    );
  }

  // Показываем сетку групп и категорий
  return (
    <div className="grid-view">
      <div className="groups-container">
        {gridData.groups.map(group => (
          <div key={group.id} className="group-section">
            <div className="group-header">
              <h3 className="group-title">{group.title}</h3>
              {group.image_url_template && (
                <img 
                  src={group.image_url_template} 
                  alt={group.title} 
                  className="group-image"
                />
              )}
            </div>
            
            <div className="categories-grid">
              {group.categories && group.categories.map(category => (
                <div
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategorySelect(category, group)}
                >
                  <div className="category-image">
                    {category.image_url ? (
                      <img src={category.image_url} alt={category.title} />
                    ) : (
                      <div className="category-placeholder">📦</div>
                    )}
                  </div>
                  <div className="category-info">
                    <h4 className="category-name">{category.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GridView;

