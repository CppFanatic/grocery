import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './CarouselWidget.css';

/**
 * Компонент для отображения карусели продуктов
 * @param {Object} props - Свойства компонента
 * @param {Object} props.widget - Данные виджета карусели
 * @param {string} props.widget.category_id - ID категории
 * @param {string} props.widget.title - Заголовок карусели
 * @param {Array} props.products - Массив продуктов для отображения
 * @param {Function} props.onAddToCart - Обработчик добавления в корзину
 * @param {boolean} props.loading - Состояние загрузки
 * @returns {JSX.Element} - JSX элемент карусели продуктов
 */
const CarouselWidget = ({ widget, products = [], onAddToCart, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Определяем количество элементов для отображения в зависимости от размера экрана
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  if (!widget) {
    console.warn('⚠️ [CarouselWidget] Некорректные данные виджета:', widget);
    return null;
  }

  const maxIndex = Math.max(0, products.length - itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  console.log('🎠 [CarouselWidget] Рендерим карусель:', widget.title, 'с', products.length, 'продуктами');

  return (
    <div className="carousel-widget">
      <div className="carousel-widget__header">
        <h2 className="carousel-widget__title">{widget.title}</h2>
        <div className="carousel-widget__controls">
          <button 
            className="carousel-widget__button carousel-widget__button--prev"
            onClick={goToPrevious}
            disabled={!canGoPrevious}
            aria-label="Предыдущие продукты"
          >
            ‹
          </button>
          <button 
            className="carousel-widget__button carousel-widget__button--next"
            onClick={goToNext}
            disabled={!canGoNext}
            aria-label="Следующие продукты"
          >
            ›
          </button>
        </div>
      </div>
      
      <div className="carousel-widget__container">
        <div 
          className="carousel-widget__track"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            width: `${(products.length / itemsPerView) * 100}%`
          }}
        >
          {loading ? (
            <div className="carousel-widget__loading">
              <div className="carousel-widget__loading-spinner"></div>
              <p>Загрузка продуктов...</p>
            </div>
          ) : products.length > 0 ? (
            products.map((product, index) => (
              <div 
                key={product.id || index} 
                className="carousel-widget__item"
                style={{ width: `${100 / products.length}%` }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                />
              </div>
            ))
          ) : (
            <div className="carousel-widget__empty">
              <p>Продукты не найдены</p>
            </div>
          )}
        </div>
      </div>
      
      {products.length > itemsPerView && (
        <div className="carousel-widget__indicators">
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <button
              key={index}
              className={`carousel-widget__indicator ${index === currentIndex ? 'carousel-widget__indicator--active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselWidget;
