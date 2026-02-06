'use client';

import FormSelect from '@/components/FormSelect';

/**
 * Reusable filter bar component
 * @param {object} filters - Current filter values
 * @param {function} onChange - Filter change handler
 * @param {array} filterConfig - Array of filter configurations
 * @param {string} className - Additional CSS classes
 */
export default function FilterBar({
  filters,
  onChange,
  filterConfig = [],
  className = ''
}) {
  if (filterConfig.length === 0) {
    return null;
  }

  return (
    <div className={`card p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filterConfig.map((config) => {
          const { name, label, type = 'select', options = [], placeholder } = config;

          if (type === 'select') {
            return (
              <FormSelect
                key={name}
                name={name}
                label={label}
                value={filters[name] || ''}
                onChange={onChange}
                options={options}
                placeholder={placeholder || `All ${label.toLowerCase()}`}
              />
            );
          }

          if (type === 'text') {
            return (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  id={name}
                  name={name}
                  value={filters[name] || ''}
                  onChange={onChange}
                  placeholder={placeholder || `Filter by ${label.toLowerCase()}...`}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
