import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GroupWidget from './GroupWidget';
import CarouselWidget from './CarouselWidget';
import RadialCarousel from './RadialCarousel';
import './MainView.css';

/**
 * Component for displaying main page with widgets
 * @param {Object} props - Component properties
 * @param {Object} props.mainsData - Main page data with widgets
 * @param {Function} props.onAddToCart - Add to cart handler
 * @param {Function} props.onCategoryClick - Category click handler
 * @param {Function} props.onLoadProducts - Products loading handler for category
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {Object} props.selectedStore - Selected store
 * @param {boolean} props.useRealApi - Use real API
 * @returns {JSX.Element} - JSX element of main page
 */
const MainView = ({ 
  mainsData, 
  onAddToCart, 
  onCategoryClick, 
  onLoadProducts,
  loading = false, 
  error = null, 
  selectedStore, 
  useRealApi = false,
  onRetry = null,
  retryCount = 0
}) => {
  const [carouselProducts, setCarouselProducts] = useState({});
  const [carouselLoading, setCarouselLoading] = useState({});
  const [radialSize, setRadialSize] = useState(320);

  // Update radial carousel size based on window width
  useEffect(() => {
    const updateSize = () => {
      const maxSize = Math.min(320, window.innerWidth - 40);
      setRadialSize(maxSize);
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Function to load products for carousel
  const loadCarouselProducts = useCallback(async (categoryId) => {
    if (!useRealApi || !onLoadProducts || carouselProducts[categoryId]) {
      return;
    }

    try {
      console.log('🎠 [MainView] Loading products for carousel category:', categoryId);
      setCarouselLoading(prev => ({ ...prev, [categoryId]: true }));
      
      // Load only first page with limit 5 (maximum for carousel)
      // Use null for first page (page_token not included in request)
      const result = await onLoadProducts(categoryId, null, 5);
      
      setCarouselProducts(prev => ({ 
        ...prev, 
        [categoryId]: result?.products || [] 
      }));
      
      console.log('✅ [MainView] Carousel products loaded:', result?.products?.length || 0);
    } catch (error) {
      console.error('❌ [MainView] Error loading carousel products:', error);
      setCarouselProducts(prev => ({ 
        ...prev, 
        [categoryId]: [] 
      }));
    } finally {
      setCarouselLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  }, [useRealApi, onLoadProducts, carouselProducts]);

  // Load products for all carousels when data is received
  useEffect(() => {
    if (mainsData && mainsData.widgets && Array.isArray(mainsData.widgets)) {
      mainsData.widgets.forEach(widget => {
        if (widget.type === 'carousel' && widget.category_id) {
          loadCarouselProducts(widget.category_id);
        }
      });
    }
  }, [mainsData, loadCarouselProducts]);

  // Category click handler
  const handleCategoryClick = useCallback((category) => {
    console.log('📂 [MainView] Category clicked:', category);
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  }, [onCategoryClick]);

  // Extract all categories from group widgets for the radial carousel
  const allCategories = useMemo(() => {
    if (!mainsData || !mainsData.widgets) return [];
    
    const categories = [];
    mainsData.widgets.forEach(widget => {
      if (widget.type === 'group' && widget.categories) {
        categories.push(...widget.categories);
      }
    });
    
    // Return unique categories (by id) - the radial carousel handles large datasets internally
    const uniqueCategories = categories.filter((cat, index, self) => 
      index === self.findIndex(c => c.id === cat.id)
    );
    
    console.log('🎡 [MainView] Categories for radial carousel:', uniqueCategories.length);
    return uniqueCategories;
  }, [mainsData]);

  // Add to cart handler
  const handleAddToCart = useCallback((product) => {
    console.log('🛒 [MainView] Adding to cart:', product);
    if (onAddToCart) {
      onAddToCart(product);
    }
  }, [onAddToCart]);

  if (loading) {
    return (
      <div className="main-view main-view--loading">
        <div className="main-view__spinner"></div>
        <p>Loading main page...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-view main-view--error">
        <div className="main-view__error-icon">⚠️</div>
        <h3>Loading Error</h3>
        <p>{error}</p>
        {retryCount > 0 && (
          <p className="main-view__retry-info">
            Loading attempt: {retryCount}
          </p>
        )}
        {onRetry && (
          <button 
            className="main-view__retry-button"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!mainsData || !mainsData.widgets || !Array.isArray(mainsData.widgets)) {
    return (
      <div className="main-view main-view--empty">
        <div className="main-view__empty-icon">📭</div>
        <h3>No Data</h3>
        <p>Main page is empty or data not loaded</p>
        {!loading && onRetry && (
          <button 
            className="main-view__retry-button"
            onClick={onRetry}
          >
            Load Data
          </button>
        )}
      </div>
    );
  }

  console.log('🏠 [MainView] Rendering main page with', mainsData.widgets.length, 'widgets');

  return (
    <div className="main-view">
      {/* ID hidden as requested */}
      {/* {mainsData.id && (
        <div className="main-view__header">
          <p className="main-view__id">ID: {mainsData.id}</p>
        </div>
      )} */}
      
      {/* Radial Carousel for category navigation */}
      {allCategories.length > 0 && (
        <div className="main-view__radial-section">
          <h2 className="main-view__radial-title">Explore Categories</h2>
          <p className="main-view__radial-subtitle">Spin the wheel to discover</p>
          <RadialCarousel
            categories={allCategories}
            onCategoryClick={handleCategoryClick}
            size={radialSize}
          />
        </div>
      )}
      
      <div className="main-view__widgets">
        {mainsData.widgets.map((widget, index) => {
          if (widget.type === 'group') {
            return (
              <GroupWidget
                key={widget.id || `group-${index}`}
                widget={widget}
                onCategoryClick={handleCategoryClick}
              />
            );
          } else if (widget.type === 'carousel') {
            const products = carouselProducts[widget.category_id] || [];
            const isLoading = carouselLoading[widget.category_id] || false;
            
            return (
              <CarouselWidget
                key={widget.category_id || `carousel-${index}`}
                widget={widget}
                products={products}
                onAddToCart={handleAddToCart}
                onCategoryClick={handleCategoryClick}
                loading={isLoading}
              />
            );
          } else {
            console.warn('⚠️ [MainView] Unknown widget type:', widget.type);
            return null;
          }
        })}
      </div>
    </div>
  );
};

export default React.memo(MainView);
