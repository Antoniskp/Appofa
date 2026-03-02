'use client';

import { forwardRef, useId } from 'react';

/**
 * Reusable form input component with consistent styling and accessibility
 * 
 * @param {string} label - Input label text
 * @param {string} name - Input name attribute
 * @param {string} type - Input type (text, email, password, number, url, tel, date, etc.)
 * @param {string|number} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} error - Error message to display
 * @param {boolean} required - Whether field is required
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disabled state
 * @param {string} helpText - Help text to display below input
 * @param {number} maxLength - Maximum character length
 * @param {boolean} showCharCount - Show character counter
 * @param {number} rows - Number of rows (for textarea)
 * @param {string} autoComplete - Autocomplete attribute
 * @param {string} className - Additional CSS classes for container
 * @param {string} inputClassName - Additional CSS classes for input element
 */
const FormInput = forwardRef(function FormInput({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  helpText,
  maxLength,
  showCharCount = false,
  rows = 4,
  autoComplete,
  className = '',
  inputClassName = '',
  ...rest
}, ref) {
  const uniqueId = useId();
  const inputId = `input-${name}-${uniqueId}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  
  const hasError = !!error;
  const currentLength = String(value || '').length;
  
  const baseInputClasses = `w-full px-4 py-2 border rounded-md text-gray-900 placeholder-gray-500 transition-colors
    ${hasError 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }
    ${disabled 
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
      : 'bg-white'
    }
    ${inputClassName}`;
  
  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={baseInputClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : (helpText ? helpId : undefined)}
          {...rest}
        />
      );
    }
    
    return (
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={baseInputClasses}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : (helpText ? helpId : undefined)}
        {...rest}
      />
    );
  };
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-600" aria-label="required">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {/* Character count */}
      {showCharCount && maxLength && (
        <div className="mt-1 text-xs text-right text-gray-500">
          {currentLength} / {maxLength}
        </div>
      )}
      
      {/* Help text */}
      {helpText && !error && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      
      {/* Error message */}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default FormInput;
