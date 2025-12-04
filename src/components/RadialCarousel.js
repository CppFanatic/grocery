import React, { useState, useCallback } from 'react';
import './RadialCarousel.css';

/**
 * Radial Carousel Component for visualizing product categories
 * Uses a sliding window approach to display 7 active sectors + 1 static bottom sector
 * 
 * Sector Layout (clockwise from bottom):
 *           [4] ← TOP (indicator points here)
 *       [5]     [3]
 *     [6]         [2]
 *       [7]     [1]
 *           [0] ← BOTTOM (dead zone)
 * 
 * @param {Object} props - Component props
 * @param {Array} props.categories - Array of category objects with id, title, image_url
 * @param {Function} props.onCategoryClick - Handler for category click
 * @param {number} props.size - Carousel size in pixels (default: 320)
 */
const RadialCarousel = ({ categories = [], onCategoryClick, size = 320 }) => {
  // Sliding window start index
  const [windowStart, setWindowStart] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Configuration
  const TOTAL_SECTORS = 8; // 7 active + 1 static bottom
  const ACTIVE_SECTORS = 7; // Number of visible category slots
  const sectorAngle = 360 / TOTAL_SECTORS; // 45° per sector
  
  // Dead zone is at the bottom (sector index 0)
  const DEAD_ZONE_INDEX = 0;
  // Top sector (where indicator points)
  const TOP_SECTOR_INDEX = 4;

  /**
   * Map sector index to category based on sliding window
   * 
   * Sector indices are ordered clockwise starting from bottom:
   *   Sector 0: Bottom (dead zone) - no category
   *   Sector 1: Lower-right → Category[windowStart + 0]
   *   Sector 2: Right → Category[windowStart + 1]
   *   Sector 3: Upper-right → Category[windowStart + 2]
   *   Sector 4: Top → Category[windowStart + 3]
   *   Sector 5: Upper-left → Category[windowStart + 4]
   *   Sector 6: Left → Category[windowStart + 5]
   *   Sector 7: Lower-left → Category[windowStart + 6]
   */
  const getItemForSector = useCallback((sectorIndex) => {
    if (categories.length === 0) return null;
    if (sectorIndex === DEAD_ZONE_INDEX) return null; // Dead zone shows nothing
    
    // Simple mapping: sector N (1-7) maps to category[windowStart + (N-1)]
    const categoryIndex = windowStart + (sectorIndex - 1);
    
    // Check if within bounds
    if (categoryIndex < 0 || categoryIndex >= categories.length) return null;
    
    return categories[categoryIndex];
  }, [categories, windowStart, DEAD_ZONE_INDEX]);

  // Navigation handlers
  const canGoNext = windowStart + ACTIVE_SECTORS < categories.length;
  const canGoPrev = windowStart > 0;

  // Left button: shift categories forward (show next set)
  const goNext = useCallback((e) => {
    e.stopPropagation();
    if (!canGoNext || isAnimating) return;
    
    setIsAnimating(true);
    setWindowStart(prev => prev + 1);
    
    // Brief animation lock
    setTimeout(() => setIsAnimating(false), 200);
  }, [canGoNext, isAnimating]);

  // Right button: shift categories backward (show previous set)
  const goPrev = useCallback((e) => {
    e.stopPropagation();
    if (!canGoPrev || isAnimating) return;
    
    setIsAnimating(true);
    setWindowStart(prev => prev - 1);
    
    // Brief animation lock
    setTimeout(() => setIsAnimating(false), 200);
  }, [canGoPrev, isAnimating]);

  // Handle sector click
  const handleSectorClick = useCallback((category, sectorIndex) => {
    if (sectorIndex === DEAD_ZONE_INDEX) return;
    
    if (onCategoryClick && category) {
      onCategoryClick(category);
    }
  }, [onCategoryClick, DEAD_ZONE_INDEX]);

  // Calculate opacity based on proximity to dead zone
  const getSectorOpacity = useCallback((sectorIndex) => {
    if (sectorIndex === DEAD_ZONE_INDEX) return 0;
    
    // Calculate distance from dead zone (sector 0), accounting for circular wrap
    let distance = sectorIndex; // Since dead zone is at 0, distance is just the sector index
    if (distance > TOTAL_SECTORS / 2) {
      distance = TOTAL_SECTORS - distance;
    }
    
    // Fade out sectors adjacent to dead zone
    if (distance === 1) return 0.4;  // Sectors 1 and 7
    if (distance === 2) return 0.75; // Sectors 2 and 6
    
    return 1;
  }, [DEAD_ZONE_INDEX, TOTAL_SECTORS]);

  /**
   * Calculate the angle for a sector
   * Sectors are numbered clockwise starting from bottom (sector 0 at 90°)
   * Formula: angle = 90° - (sectorIndex × 45°)
   */
  const getSectorAngle = useCallback((sectorIndex) => {
    return 90 - (sectorIndex * sectorAngle);
  }, [sectorAngle]);

  // Create SVG path for sector
  const createSectorPath = useCallback((sectorIndex, innerRadius, outerRadius) => {
    const centerAngle = getSectorAngle(sectorIndex);
    const startAngleDeg = centerAngle - sectorAngle / 2;
    const endAngleDeg = centerAngle + sectorAngle / 2;
    
    const startRad = (startAngleDeg * Math.PI) / 180;
    const endRad = (endAngleDeg * Math.PI) / 180;
    
    const center = size / 2;
    
    const x1 = center + innerRadius * Math.cos(startRad);
    const y1 = center + innerRadius * Math.sin(startRad);
    const x2 = center + outerRadius * Math.cos(startRad);
    const y2 = center + outerRadius * Math.sin(startRad);
    const x3 = center + outerRadius * Math.cos(endRad);
    const y3 = center + outerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(endRad);
    const y4 = center + innerRadius * Math.sin(endRad);
    
    const largeArc = sectorAngle > 180 ? 1 : 0;
    
    // Draw clockwise (sweep flag = 0 for the arcs)
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1} Z`;
  }, [size, sectorAngle, getSectorAngle]);

  const innerRadius = size * 0.15;
  const outerRadius = size * 0.48;

  // Calculate visible range for display
  const windowEnd = Math.min(windowStart + ACTIVE_SECTORS - 1, categories.length - 1);

  return (
    <div 
      className="radial-carousel"
      style={{ width: size, height: size }}
    >
      {/* Decorative outer ring */}
      <div className="radial-carousel__outer-ring" />
      
      {/* SVG for sectors - static, no rotation */}
      <svg 
        className="radial-carousel__svg"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          {/* Define clip paths for each sector */}
          {Array.from({ length: TOTAL_SECTORS }).map((_, index) => (
            <clipPath key={`clip-${index}`} id={`sector-clip-${index}`}>
              <path d={createSectorPath(index, innerRadius, outerRadius)} />
            </clipPath>
          ))}
          
          {/* Gradient for hover effect */}
          <radialGradient id="sector-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        
        {/* Render all 8 sectors */}
        {Array.from({ length: TOTAL_SECTORS }).map((_, sectorIndex) => {
          const category = getItemForSector(sectorIndex);
          const isDeadZone = sectorIndex === DEAD_ZONE_INDEX;
          const opacity = getSectorOpacity(sectorIndex);
          const hasContent = category !== null;
          
          // Calculate image position within sector (at sector center)
          const sectorCenterAngle = getSectorAngle(sectorIndex) * (Math.PI / 180);
          const imageRadius = (innerRadius + outerRadius) / 2;
          const imageX = size / 2 + imageRadius * Math.cos(sectorCenterAngle);
          const imageY = size / 2 + imageRadius * Math.sin(sectorCenterAngle);
          const imageSize = outerRadius - innerRadius - 8;
          
          return (
            <g 
              key={`sector-${sectorIndex}`}
              className={`radial-carousel__sector ${isDeadZone ? 'radial-carousel__sector--deadzone' : ''} ${!hasContent ? 'radial-carousel__sector--empty' : ''}`}
              style={{ opacity: hasContent ? opacity : opacity * 0.3 }}
              onClick={() => hasContent && handleSectorClick(category, sectorIndex)}
            >
              {/* Sector background */}
              <path 
                d={createSectorPath(sectorIndex, innerRadius, outerRadius)}
                className="radial-carousel__sector-bg"
              />
              
              {/* Category image clipped to sector */}
              {hasContent && (
                <g clipPath={`url(#sector-clip-${sectorIndex})`}>
                  <image
                    href={category.image_url}
                    x={imageX - imageSize / 2}
                    y={imageY - imageSize / 2}
                    width={imageSize}
                    height={imageSize}
                    preserveAspectRatio="xMidYMid slice"
                    className="radial-carousel__sector-image"
                  />
                  {/* Overlay for better visibility */}
                  <path 
                    d={createSectorPath(sectorIndex, innerRadius, outerRadius)}
                    fill="url(#sector-gradient)"
                    className="radial-carousel__sector-overlay"
                  />
                </g>
              )}
              
              {/* Sector border */}
              <path 
                d={createSectorPath(sectorIndex, innerRadius, outerRadius)}
                className="radial-carousel__sector-border"
              />
            </g>
          );
        })}
      </svg>
      
      {/* Center hub */}
      <div className="radial-carousel__hub">
        <div className="radial-carousel__hub-inner">
          <span className="radial-carousel__hub-icon">🍽️</span>
        </div>
      </div>
      
      {/* STATIC Dead zone mask at bottom (sector 0) */}
      <div className="radial-carousel__dead-zone">
        <div className="radial-carousel__dead-zone-mask" />
        <div className="radial-carousel__dead-zone-gradient" />
      </div>
      
      {/* Top indicator arrow (points to sector 4) */}
      <div className="radial-carousel__indicator">
        <div className="radial-carousel__indicator-arrow" />
      </div>
      
      {/* Navigation buttons */}
      <button 
        className="radial-carousel__nav-btn radial-carousel__nav-btn--left"
        onClick={goPrev}
        disabled={!canGoPrev || isAnimating}
        aria-label="Previous items"
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      
      <button 
        className="radial-carousel__nav-btn radial-carousel__nav-btn--right"
        onClick={goNext}
        disabled={!canGoNext || isAnimating}
        aria-label="Next items"
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      
      {/* Window position indicator */}
      {categories.length > ACTIVE_SECTORS && (
        <div className="radial-carousel__count">
          {windowStart + 1}–{windowEnd + 1} of {categories.length}
        </div>
      )}
    </div>
  );
};

export default React.memo(RadialCarousel);
