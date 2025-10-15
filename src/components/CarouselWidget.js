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
 * @param {Function} props.onCategoryClick - Обработчик клика для перехода в категорию
 * @param {boolean} props.loading - Состояние загрузки
 * @returns {JSX.Element} - JSX элемент карусели продуктов
 */
const CarouselWidget = ({ widget, products = [], onAddToCart, onCategoryClick, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Ограничиваем максимальное количество продуктов до 5
  const limitedProducts = products.slice(0, 5);
  
  // Общее количество элементов включая карточку "Смотреть все"
  const totalItems = limitedProducts.length + 1;

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

  const maxIndex = Math.max(0, totalItems - itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  // Обработчик клика по карточке "Смотреть все"
  const handleViewAllClick = () => {
    if (onCategoryClick) {
      onCategoryClick({
        id: widget.category_id,
        title: widget.title
      });
    }
  };

  // Минимальное расстояние свайпа в пикселях
  const minSwipeDistance = 50;

  // Обработчики свайпа
  const handleTouchStart = (e) => {
    setTouchEnd(0); // Сбрасываем предыдущее значение
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && canGoNext) {
      goToNext();
    }
    if (isRightSwipe && canGoPrevious) {
      goToPrevious();
    }
  };

  console.log('🎠 [CarouselWidget] Рендерим карусель:', widget.title, 'с', limitedProducts.length, 'продуктами');

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
      
      <div 
        className="carousel-widget__container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="carousel-widget__track"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            width: `${(totalItems / itemsPerView) * 100}%`
          }}
        >
          {loading ? (
            <div className="carousel-widget__loading">
              <div className="carousel-widget__loading-spinner"></div>
              <p>Загрузка продуктов...</p>
            </div>
          ) : limitedProducts.length > 0 ? (
            <>
              {limitedProducts.map((product, index) => (
                <div 
                  key={product.id || index} 
                  className="carousel-widget__item"
                  style={{ width: `${100 / totalItems}%` }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
              {/* Карточка "Смотреть все" */}
              <div 
                className="carousel-widget__item"
                style={{ width: `${100 / totalItems}%` }}
              >
                <div 
                  className="carousel-widget__view-all-card"
                  onClick={handleViewAllClick}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleViewAllClick();
                    }
                  }}
                >
                  <div className="carousel-widget__view-all-icon">→</div>
                  <h3 className="carousel-widget__view-all-title">Смотреть все</h3>
                  <p className="carousel-widget__view-all-subtitle">Перейти в категорию</p>
                </div>
              </div>
            </>
          ) : (
            <div className="carousel-widget__empty">
              <p>Продукты не найдены</p>
            </div>
          )}
        </div>
      </div>
      
      {totalItems > itemsPerView && (
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
