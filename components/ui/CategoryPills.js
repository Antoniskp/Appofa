import React from 'react';

export default function CategoryPills({
  categories,
  selected,
  onSelect,
  counts = {},
  countsLoaded = false,
  className = '',
  topTags = [],
  selectedTag = '',
  onTagSelect,
}) {
  if (!countsLoaded) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const hasCounts = counts && categories.some((cat) => (counts[cat.value || cat] ?? 0) > 0);
  const visibleCategories = hasCounts
    ? categories.filter((cat) => (counts[cat.value || cat] ?? 0) > 0)
    : [];

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
      {topTags.map((tag) => (
        <button
          key={tag}
          className={`px-4 py-1 rounded-full border text-sm font-medium transition-colors ${selectedTag === tag ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}
          onClick={() => onTagSelect?.(selectedTag === tag ? '' : tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
