
// Mobile: one horizontally scrolling row so the pills never push the list
// below the fold. Desktop (md+): wraps as before.
const ROW = 'flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none md:mx-0 md:px-0 md:pb-0 md:flex-wrap md:overflow-visible';
const PILL = 'shrink-0 whitespace-nowrap md:shrink md:whitespace-normal md:break-words max-w-full px-4 py-1 rounded-full border text-sm font-medium transition-colors';
const PILL_ON = 'bg-blue-600 text-white border-blue-600';
const PILL_OFF = 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50';
const TAG_ON = 'bg-charcoal text-white border-charcoal';
const TAG_OFF = 'bg-white text-gray-600 border-dashed border-gray-300 hover:bg-blue-50';

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
  allLabel = 'All',
}) {
  if (!countsLoaded) {
    return (
      <div className={`${ROW} ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-20 shrink-0 rounded-full bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const hasCounts = counts && categories.some((cat) => (counts[cat.value || cat] ?? 0) > 0);
  const visibleCategories = hasCounts
    ? categories.filter((cat) => (counts[cat.value || cat] ?? 0) > 0)
    : [];

  return (
    <div className={`${ROW} ${className}`}>
      <button
        type="button"
        aria-pressed={!selected}
        className={`${PILL} ${!selected ? PILL_ON : PILL_OFF}`}
        onClick={() => onSelect('')}
      >
        {allLabel}
      </button>
      {visibleCategories.map((cat) => {
        const key = cat.value || cat;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected === key}
            className={`${PILL} ${selected === key ? PILL_ON : PILL_OFF}`}
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
          type="button"
          aria-pressed={selectedTag === tag}
          className={`${PILL} ${selectedTag === tag ? TAG_ON : TAG_OFF}`}
          onClick={() => onTagSelect?.(selectedTag === tag ? '' : tag)}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
