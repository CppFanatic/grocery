import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './CarouselWidget.css';

/**
 * Component for displaying product carousel
 * @param {Object} props - Component properties
 * @param {Object} props.widget - Carousel widget data
 * @param {string} props.widget.category_id - Category ID
 * @param {string} props.widget.title - Carousel title
 * @param {Array} props.products - Array of products to display
 * @param {Function} props.onAddToCart - Add to cart handler
 * @param {Function} props.onCategoryClick - Click handler for navigating to category
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} - JSX element of product carousel
 */
const CarouselWidget = ({ widget, products = [], onAddToCart, onCategoryClick, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Limit maximum number of products to 5
  const limitedProducts = products.slice(0, 5);
  
  // Total number of items including "View all" card
  const totalItems = limitedProducts.length + 1;

  // Determine number of items to display based on screen size
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
    console.warn('⚠️ [CarouselWidget] Invalid widget data:', widget);
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

  // "View all" card click handler
  const handleViewAllClick = () => {
    if (onCategoryClick) {
      onCategoryClick({
        id: widget.category_id,
        title: widget.title
      });
    }
  };

  // Minimum swipe distance in pixels to change slide
  const minSwipeDistance = 50;

  // Swipe handlers with smooth finger-following
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate offset as percentage relative to container width
    const containerWidth = e.currentTarget.offsetWidth;
    const dragDistance = currentTouch - touchStart;
    const dragPercent = (dragDistance / containerWidth) * 100;
    
    // Apply offset considering current index
    setDragOffset(dragPercent);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragOffset(0);
    
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && canGoNext) {
      goToNext();
    } else if (isRightSwipe && canGoPrevious) {
      goToPrevious();
    }
    
    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
  };

  console.log('🎠 [CarouselWidget] Rendering carousel:', widget.title, 'with', limitedProducts.length, 'products');

  return (
    <div className="carousel-widget">
      <div className="carousel-widget__header">
        <h2 className="carousel-widget__title">{widget.title}</h2>
        <div className="carousel-widget__controls">
          <button 
            className="carousel-widget__button carousel-widget__button--prev"
            onClick={goToPrevious}
            disabled={!canGoPrevious}
            aria-label="Previous products"
          >
            ‹
          </button>
          <button 
            className="carousel-widget__button carousel-widget__button--next"
            onClick={goToNext}
            disabled={!canGoNext}
            aria-label="Next products"
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
          className={`carousel-widget__track ${isDragging ? 'carousel-widget__track--dragging' : ''}`}
          style={{
            transform: `translateX(calc(-${currentIndex * (100 / itemsPerView)}% + ${dragOffset}%))`,
            width: `${(totalItems / itemsPerView) * 100}%`
          }}
        >
          {loading ? (
            <div className="carousel-widget__loading">
              <div className="carousel-widget__loading-spinner"></div>
              <p>Loading products...</p>
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
              {/* "View all" card */}
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
                  <h3 className="carousel-widget__view-all-title">View All</h3>
                  <p className="carousel-widget__view-all-subtitle">Go to category</p>
                </div>
              </div>
            </>
          ) : (
            <div className="carousel-widget__empty">
              <p>No products found</p>
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
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(CarouselWidget);
