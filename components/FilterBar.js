'use client';

/**
 * Reusable filter bar component
 * @param {object} filters - Current filter values
 * @param {function} onChange - Filter change handler
 * @param {array} filterConfig - Array of filter configurations
 * @param {function} onReset - Reset filters handler
 * @param {string} className - Additional CSS classes
 */
export default function FilterBar({
  filters,
  onChange,
  filterConfig = [],
  onReset,
  className = ''
}) {
  if (filterConfig.length === 0) {
    return null;
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null);

  return (
    <div className={`card p-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filterConfig.map((config) => {
          const { name, label, type = 'select', options = [], placeholder } = config;

          if (type === 'select') {
            return (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
                <select
                  id={name}
                  name={name}
                  value={filters[name] || ''}
                  onChange={onChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{placeholder || `All ${label.toLowerCase()}`}</option>
                  {options.map((option) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (type === 'text') {
            return (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
                <input
                  type="text"
                  id={name}
                  name={name}
                  value={filters[name] || ''}
                  onChange={onChange}
                  placeholder={placeholder || `Filter by ${label.toLowerCase()}...`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            );
          }

          return null;
        })}
      </div>

      {hasActiveFilters && onReset && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
