'use client';

import FormSelect from '@/components/FormSelect';
import SearchInput from '@/components/SearchInput';

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
              <SearchInput
                key={name}
                id={name}
                name={name}
                label={label}
                value={filters[name] || ''}
                onChange={onChange}
                placeholder={placeholder || `Filter by ${label.toLowerCase()}...`}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
