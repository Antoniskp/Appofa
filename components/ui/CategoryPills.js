import React from 'react';

export default function CategoryPills({ categories, selected, onSelect, counts = {}, countsLoaded = false, className = '' }) {
  const hasCounts = countsLoaded && counts && Object.keys(counts).length > 0;
  const visibleCategories = hasCounts
    ? categories.filter((cat) => (counts[cat.value || cat] ?? 0) > 0)
    : categories;

  if (!countsLoaded) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        className={`px-4 py-1 rounded-full border text-sm font-medium transition-colors ${!selected ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
        onClick={() => onSelect('')}
      >
        All
      </button>
      {visibleCategories.map((cat) => {
        const key = cat.value || cat;
        return (
          <button
            key={key}
            className={`px-4 py-1 rounded-full border text-sm font-medium transition-colors ${selected === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
            onClick={() => onSelect(key)}
          >
            {cat.label || cat}
            {hasCounts && counts[key] != null && (
              <span className="ml-1 text-xs opacity-70">({counts[key]})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
