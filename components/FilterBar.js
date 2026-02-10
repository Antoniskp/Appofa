'use client';

import { useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import FormSelect from '@/components/FormSelect';
import SearchInput from '@/components/SearchInput';

/**
 * Reusable filter bar component
 * @param {object} filters - Current filter values
 * @param {function} onChange - Filter change handler
 * @param {array} filterConfig - Array of filter configurations
 * @param {string} className - Additional CSS classes
 * @param {boolean} defaultExpanded - Whether filters are shown by default
 */
export default function FilterBar({
  filters,
  onChange,
  filterConfig = [],
  className = '',
  defaultExpanded = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (filterConfig.length === 0) {
    return null;
  }

  // Count active filters (only those in filterConfig)
  const filterNames = new Set(filterConfig.map(config => config.name));
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => filterNames.has(key) && value && value !== ''
  ).length;

  return (
    <div className={className}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors mb-4"
      >
        <FunnelIcon className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          Φίλτρα
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </span>
      </button>

      {/* Filters */}
      {isExpanded && (
        <div className="card p-6 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        {filterConfig.map((config) => {
          const { name, label, type = 'select', options = [], placeholder } = config;

          if (type === 'select') {
            const emptyOption = options.find((option) => (
              typeof option === 'object' ? option.value === '' : option === ''
            ));
            const filteredOptions = emptyOption
              ? options.filter((option) => (
                  typeof option === 'object' ? option.value !== '' : option !== ''
                ))
              : options;
            const resolvedPlaceholder = placeholder
              || (emptyOption ? (emptyOption.label || emptyOption) : `All ${label.toLowerCase()}`);

            return (
              <FormSelect
                key={name}
                name={name}
                label={label}
                value={filters[name] || ''}
                onChange={onChange}
                options={filteredOptions}
                placeholder={resolvedPlaceholder}
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
      )}
    </div>
  );
}
