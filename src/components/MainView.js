import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GroupWidget from './GroupWidget';
import CarouselWidget from './CarouselWidget';
import RadialCarousel from './RadialCarousel';
import './MainView.css';

/**
 * Компонент для отображения главной страницы с виджетами
 * @param {Object} props - Свойства компонента
 * @param {Object} props.mainsData - Данные главной страницы с виджетами
 * @param {Function} props.onAddToCart - Обработчик добавления в корзину
 * @param {Function} props.onCategoryClick - Обработчик клика по категории
 * @param {Function} props.onLoadProducts - Обработчик загрузки продуктов для категории
 * @param {boolean} props.loading - Состояние загрузки
 * @param {string} props.error - Сообщение об ошибке
 * @param {Object} props.selectedStore - Выбранный склад
 * @param {boolean} props.useRealApi - Использовать реальный API
 * @returns {JSX.Element} - JSX элемент главной страницы
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

  // Функция для загрузки продуктов для карусели
  const loadCarouselProducts = useCallback(async (categoryId) => {
    if (!useRealApi || !onLoadProducts || carouselProducts[categoryId]) {
      return;
    }

    try {
      console.log('🎠 [MainView] Загружаем продукты для карусели категории:', categoryId);
      setCarouselLoading(prev => ({ ...prev, [categoryId]: true }));
      
      // Загружаем только первую страницу с лимитом 5 (максимум для карусели)
      // Используем null для первой страницы (page_token не включается в запрос)
      const result = await onLoadProducts(categoryId, null, 5);
      
      setCarouselProducts(prev => ({ 
        ...prev, 
        [categoryId]: result?.products || [] 
      }));
      
      console.log('✅ [MainView] Продукты для карусели загружены:', result?.products?.length || 0);
    } catch (error) {
      console.error('❌ [MainView] Ошибка загрузки продуктов для карусели:', error);
      setCarouselProducts(prev => ({ 
        ...prev, 
        [categoryId]: [] 
      }));
    } finally {
      setCarouselLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  }, [useRealApi, onLoadProducts, carouselProducts]);

  // Загружаем продукты для всех каруселей при получении данных
  useEffect(() => {
    if (mainsData && mainsData.widgets && Array.isArray(mainsData.widgets)) {
      mainsData.widgets.forEach(widget => {
        if (widget.type === 'carousel' && widget.category_id) {
          loadCarouselProducts(widget.category_id);
        }
      });
    }
  }, [mainsData, loadCarouselProducts]);

  // Обработчик клика по категории
  const handleCategoryClick = useCallback((category) => {
    console.log('📂 [MainView] Клик по категории:', category);
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

  // Обработчик добавления в корзину
  const handleAddToCart = useCallback((product) => {
    console.log('🛒 [MainView] Добавление в корзину:', product);
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

  console.log('🏠 [MainView] Рендерим главную страницу с', mainsData.widgets.length, 'виджетами');

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
            console.warn('⚠️ [MainView] Неизвестный тип виджета:', widget.type);
            return null;
          }
        })}
      </div>
    </div>
  );
};

export default React.memo(MainView);
