import React from 'react';
import CategoryCard from './CategoryCard';
import './GroupWidget.css';

/**
 * Component for displaying category group
 * @param {Object} props - Component properties
 * @param {Object} props.widget - Group widget data
 * @param {string} props.widget.id - Group ID
 * @param {string} props.widget.title - Group title
 * @param {Array} props.widget.categories - Array of categories
 * @param {Function} props.onCategoryClick - Category click handler
 * @returns {JSX.Element} - JSX element of category group
 */
const GroupWidget = ({ widget, onCategoryClick }) => {
  if (!widget || !widget.categories || !Array.isArray(widget.categories)) {
    console.warn('⚠️ [GroupWidget] Invalid widget data:', widget);
    return null;
  }

  console.log('📂 [GroupWidget] Rendering group:', widget.title, 'with', widget.categories.length, 'categories');

  return (
    <div className="group-widget">
      <h2 className="group-widget__title">{widget.title}</h2>
      <div className="group-widget__categories">
        {widget.categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={() => onCategoryClick && onCategoryClick(category)}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(GroupWidget);
