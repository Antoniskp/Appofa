import React from 'react';

export default function CategoryPills({ categories, selected, onSelect, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        className={`px-4 py-1 rounded-full border text-sm font-medium transition-colors ${!selected ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
        onClick={() => onSelect('')}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.value || cat}
          className={`px-4 py-1 rounded-full border text-sm font-medium transition-colors ${selected === (cat.value || cat) ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
          onClick={() => onSelect(cat.value || cat)}
        >
          {cat.label || cat}
        </button>
      ))}
    </div>
  );
}
