'use client';

import { useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

/**
 * Reusable filter bar component.
 * The toggle button is always visible; when open, filter inputs expand in a
 * wrapping row *below* the button so they never push adjacent elements sideways.
 *
 * @param {object}   filters           - Current filter values
 * @param {function} onChange          - Filter change handler
 * @param {array}    filterConfig      - Array of filter configurations
 * @param {string}   className         - Additional CSS classes
 * @param {boolean}  [isOpen]          - Controlled open state (optional)
 * @param {function} [onToggle]        - Controlled toggle handler (optional)
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

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = onToggle ?? (() => setInternalIsOpen((prev) => !prev));

  if (filterConfig.length === 0) {
    return null;
  }

  const filterNames = new Set(filterConfig.map((config) => config.name));
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => filterNames.has(key) && value && value !== '',
  ).length;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Toggle button — always visible */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors self-start"
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

      {/* Expanded filters — rendered in a wrapping row below the toggle */}
      {isOpen && (
        <div className="flex flex-wrap items-center gap-2">
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
                    const val = typeof option === 'object' ? option.value : option;
                    const lbl = typeof option === 'object' ? (option.label || option.value) : option;
                    return (
                      <option key={val} value={val}>{lbl}</option>
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
      )}
    </div>
  );
}
