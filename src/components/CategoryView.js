import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from './ProductCard';
import './CategoryView.css';

/**
 * Component for displaying category and its products with lazy loading
 * @param {Object} props - Component properties
 * @param {Object} props.category - Category data
 * @param {Function} props.onAddToCart - Add to cart handler
 * @param {Function} props.onBack - Back to main page handler
 * @param {Function} props.onLoadProducts - Function to load products for category
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.locale - Locale for API requests
 * @returns {JSX.Element} - JSX element of category page
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

  // Load products when component mounts
  useEffect(() => {
    if (category && !initialLoad) {
      console.log('📦 [CategoryView] Loading products for category:', category.id);
      loadProducts();
      setInitialLoad(true);
    }
  }, [category, initialLoad]);

  // Products loading function
  const loadProducts = useCallback(async (nextPageToken = null) => {
    if (!category || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const response = await onLoadProducts(category.id, nextPageToken);
      if (response && response.products) {
        if (nextPageToken) {
          // Add to existing products
          setProducts(prev => [...prev, ...response.products]);
        } else {
          // Replace products (first load)
          setProducts(response.products);
        }
        // next_page_token — string or null (for last page)
        const nextPageTokenValue = response.next_page_token ?? null;
        setPageToken(nextPageTokenValue);
        setHasMore(!!response.next_page_token);
      }
    } catch (err) {
      console.error('❌ [CategoryView] Error loading products:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [category, onLoadProducts, loadingMore]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          console.log('🔄 [CategoryView] Loading next page of products');
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
          <p>Category not found</p>
          <button onClick={onBack} className="back-button">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-view">
      <div className="category-view__header">
        <button onClick={onBack} className="back-button">
          ← Back
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
          <p>Loading error: {error}</p>
          <button onClick={() => loadProducts()} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="category-view__loading">
          <p>Loading products...</p>
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
              
              {/* Element for visibility tracking for lazy loading */}
              {hasMore && (
                <div ref={loadingRef} className="loading-trigger">
                  {loadingMore && <p>Loading more products...</p>}
                </div>
              )}
              
              {!hasMore && products.length > 0 && (
                <div className="no-more-products">
                  <p>All products loaded</p>
                </div>
              )}
            </>
          ) : (
            <div className="no-products">
              <p>No products in this category yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryView;
