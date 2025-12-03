import React from 'react';
import CategoryCard from './CategoryCard';
import './GroupWidget.css';

/**
 * Компонент для отображения группы категорий
 * @param {Object} props - Свойства компонента
 * @param {Object} props.widget - Данные виджета группы
 * @param {string} props.widget.id - ID группы
 * @param {string} props.widget.title - Заголовок группы
 * @param {Array} props.widget.categories - Массив категорий
 * @param {Function} props.onCategoryClick - Обработчик клика по категории
 * @returns {JSX.Element} - JSX элемент группы категорий
 */
const GroupWidget = ({ widget, onCategoryClick }) => {
  if (!widget || !widget.categories || !Array.isArray(widget.categories)) {
    console.warn('⚠️ [GroupWidget] Некорректные данные виджета:', widget);
    return null;
  }

  console.log('📂 [GroupWidget] Рендерим группу:', widget.title, 'с', widget.categories.length, 'категориями');

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
