'use client';

import { useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

/**
 * Reusable filter bar component — renders filters inline in a single flex row.
 * @param {object} filters - Current filter values
 * @param {function} onChange - Filter change handler
 * @param {array} filterConfig - Array of filter configurations
 * @param {string} className - Additional CSS classes
 * @param {boolean} [isOpen] - Controlled open state (optional)
 * @param {function} [onToggle] - Controlled toggle handler (optional)
 */
export default function FilterBar({
  filters,
  onChange,
  filterConfig = [],
  className = '',
  isOpen: controlledIsOpen,
  onToggle,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled state if provided, otherwise fall back to internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = onToggle ?? (() => setInternalIsOpen((prev) => !prev));

  if (filterConfig.length === 0) {
    return null;
  }

  // Count active filters (only those in filterConfig)
  const filterNames = new Set(filterConfig.map(config => config.name));
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => filterNames.has(key) && value && value !== ''
  ).length;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Toggle button — always visible */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-label="Φίλτρα"
      >
        <FunnelIcon className="h-5 w-5 text-gray-600" />
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Inline filters — only shown when open */}
      {isOpen && filterConfig.map((config) => {
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
            <select
              key={name}
              name={name}
              value={filters[name] || ''}
              onChange={onChange}
              aria-label={label}
              className="h-10 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">{resolvedPlaceholder}</option>
              {filteredOptions.map((option) => {
                const value = typeof option === 'object' ? option.value : option;
                const label = typeof option === 'object' ? (option.label || option.value) : option;
                return (
                  <option key={value} value={value}>{label}</option>
                );
              })}
            </select>
          );
        }

        if (type === 'text') {
          return (
            <input
              key={name}
              type="text"
              name={name}
              value={filters[name] || ''}
              onChange={onChange}
              placeholder={placeholder || `Filter by ${label.toLowerCase()}...`}
              aria-label={label}
              className="h-10 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        }

        return null;
      })}
    </div>
  );
}
