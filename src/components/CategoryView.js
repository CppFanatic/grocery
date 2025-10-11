import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from './ProductCard';
import './CategoryView.css';

/**
 * Компонент для отображения категории и её продуктов с ленивой загрузкой
 * @param {Object} props - Свойства компонента
 * @param {Object} props.category - Данные категории
 * @param {Function} props.onAddToCart - Обработчик добавления в корзину
 * @param {Function} props.onBack - Обработчик возврата к главной странице
 * @param {Function} props.onLoadProducts - Функция загрузки продуктов для категории
 * @param {boolean} props.loading - Состояние загрузки
 * @param {string} props.error - Сообщение об ошибке
 * @param {string} props.locale - Локаль для API запросов
 * @returns {JSX.Element} - JSX элемент страницы категории
 */
const CategoryView = ({ 
  category, 
  onAddToCart, 
  onBack, 
  onLoadProducts, 
  loading = false, 
  error = null,
  locale = 'en'
}) => {
  const [products, setProducts] = useState([]);
  const [pageToken, setPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  
  const observerRef = useRef();
  const loadingRef = useRef();

  // Загружаем продукты при монтировании компонента
  useEffect(() => {
    if (category && !initialLoad) {
      console.log('📦 [CategoryView] Загружаем продукты для категории:', category.id);
      loadProducts();
      setInitialLoad(true);
    }
  }, [category, initialLoad]);

  // Функция загрузки продуктов
  const loadProducts = useCallback(async (nextPageToken = null) => {
    if (!category || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const response = await onLoadProducts(category.id, nextPageToken);
      if (response && response.products) {
        if (nextPageToken) {
          // Добавляем к существующим продуктам
          setProducts(prev => [...prev, ...response.products]);
        } else {
          // Заменяем продукты (первая загрузка)
          setProducts(response.products);
        }
        // Убеждаемся, что next_page_token является integer
        const nextPageTokenInt = response.next_page_token ? parseInt(response.next_page_token, 10) : null;
        console.log('🔄 [CategoryView] next_page_token conversion:', {
          original: response.next_page_token,
          type: typeof response.next_page_token,
          converted: nextPageTokenInt,
          convertedType: typeof nextPageTokenInt
        });
        setPageToken(nextPageTokenInt);
        setHasMore(!!response.next_page_token);
      }
    } catch (err) {
      console.error('❌ [CategoryView] Ошибка загрузки продуктов:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [category, onLoadProducts, loadingMore]);

  // Intersection Observer для ленивой загрузки
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          console.log('🔄 [CategoryView] Загружаем следующую страницу продуктов');
          loadProducts(pageToken);
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [hasMore, loadingMore, pageToken, loadProducts]);

  if (!category) {
    return (
      <div className="category-view">
        <div className="category-view__error">
          <p>Категория не найдена</p>
          <button onClick={onBack} className="back-button">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-view">
      <div className="category-view__header">
        <button onClick={onBack} className="back-button">
          ← Назад
        </button>
        <div className="category-view__title">
          <h1>{category.title}</h1>
          {category.description && (
            <p className="category-view__description">{category.description}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="category-view__error">
          <p>Ошибка загрузки: {error}</p>
          <button onClick={() => loadProducts()} className="retry-button">
            Повторить
          </button>
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="category-view__loading">
          <p>Загрузка продуктов...</p>
        </div>
      ) : (
        <div className="category-view__content">
          {products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
              
              {/* Элемент для отслеживания видимости для ленивой загрузки */}
              {hasMore && (
                <div ref={loadingRef} className="loading-trigger">
                  {loadingMore && <p>Загрузка дополнительных продуктов...</p>}
                </div>
              )}
              
              {!hasMore && products.length > 0 && (
                <div className="no-more-products">
                  <p>Все продукты загружены</p>
                </div>
              )}
            </>
          ) : (
            <div className="no-products">
              <p>В этой категории пока нет продуктов</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryView;
