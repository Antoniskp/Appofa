'use client';

import { useId } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * Reusable select/dropdown component
 * 
 * @param {string} label - Label text
 * @param {string} name - Select name attribute
 * @param {string|number} value - Selected value
 * @param {function} onChange - Change handler
 * @param {array} options - Array of options (can be strings or {label, value} objects)
 * @param {string} error - Error message to display
 * @param {boolean} required - Whether field is required
 * @param {boolean} disabled - Disabled state
 * @param {string} placeholder - Placeholder text for empty option
 * @param {string} helpText - Help text to display below select
 * @param {string} className - Additional CSS classes for container
 */
export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  helpText,
  className = '',
  ...rest
}) {
  const uniqueId = useId();
  const selectId = `select-${name}-${uniqueId}`;
  const errorId = `${selectId}-error`;
  const helpId = `${selectId}-help`;
  
  const hasError = !!error;
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-600" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full px-4 py-2 pr-10 border rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 appearance-none
            ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
          `}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : (helpText ? helpId : undefined)}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option 
              key={option.value || `${option}-${index}`} 
              value={option.value || option}
            >
              {option.label || option}
            </option>
          ))}
        </select>
        <ChevronDownIcon 
          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" 
          aria-hidden="true"
        />
      </div>
      
      {helpText && !error && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
