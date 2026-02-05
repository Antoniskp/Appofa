'use client';

/**
 * Reusable input component for authentication forms
 * @param {string} id - Input ID and name
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} label - Label text
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {boolean} required - Whether field is required
 * @param {string} autoComplete - Autocomplete attribute
 * @param {string} placeholder - Placeholder text
 */
export default function AuthInput({
  id,
  type = 'text',
  label,
  value,
  onChange,
  required = false,
  autoComplete,
  placeholder,
  className = ''
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}
