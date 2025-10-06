import React from 'react';
import './CategoryCard.css';

function CategoryCard({ category, onClick }) {
  return (
    <div className="category-card" onClick={onClick}>
      <div className="category-image">
        <img src={category.image} alt={category.name} />
      </div>
      <div className="category-info">
        <h3 className="category-name">{category.name}</h3>
        <p className="category-description">{category.description}</p>
      </div>
    </div>
  );
}

export default CategoryCard;
