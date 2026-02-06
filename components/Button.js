'use client';

/**
 * Reusable button component with consistent styling and accessibility
 * 
 * @param {string} variant - Button style variant
 *   - 'primary': Blue background, white text (default)
 *   - 'secondary': Blue border, blue text
 *   - 'danger': Red background, white text
 *   - 'ghost': Transparent background, blue text
 * @param {string} size - Button size (sm, md, lg)
 * @param {boolean} disabled - Disabled state
 * @param {boolean} loading - Loading state (shows spinner, disables button)
 * @param {React.ReactNode} icon - Optional icon to display before text
 * @param {string} type - Button type (button, submit, reset)
 * @param {function} onClick - Click handler
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 */
export default function Button({ 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  type = 'button',
  onClick,
  className = '',
  children,
  ...rest
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 focus:ring-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-blue-900 hover:bg-seafoam/40 focus:ring-blue-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
