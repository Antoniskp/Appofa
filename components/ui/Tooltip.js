'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Reusable tooltip component with accessibility
 * 
 * @param {React.ReactNode} children - Element that triggers the tooltip
 * @param {string|React.ReactNode} content - Tooltip content
 * @param {string} position - Tooltip position (top, bottom, left, right)
 * @param {number} delay - Delay before showing tooltip (ms)
 * @param {boolean} disabled - Disable tooltip
 * @param {string} className - Additional CSS classes for tooltip
 */
export default function Tooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 300,
  disabled = false,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  
  const positions = {
    top: {
      tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      arrow: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900'
    },
    bottom: {
      tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
      arrow: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900'
    },
    left: {
      tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
      arrow: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900'
    },
    right: {
      tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
      arrow: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
    }
  };
  
  const showTooltip = () => {
    if (disabled || !content) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  if (!content || disabled) {
    return <>{children}</>;
  }
  
  return (
    <div 
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap ${positions[position].tooltip} ${className} animate-fadeIn pointer-events-none`}
        >
          {content}
          {/* Arrow */}
          <div 
            className={`absolute w-2 h-2 border-4 ${positions[position].arrow}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Tooltip for truncated text - shows full text on hover
 */
export function TruncatedTextTooltip({ 
  children, 
  maxLength = 50,
  className = ''
}) {
  const text = String(children || '');
  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? text.substring(0, maxLength) + '...' : text;
  
  return (
    <Tooltip content={isTruncated ? text : null} position="top">
      <span className={className}>{displayText}</span>
    </Tooltip>
  );
}

/**
 * Icon button with tooltip
 * Common use case: icon-only buttons
 */
export function TooltipIconButton({ 
  icon: Icon,
  tooltip,
  onClick,
  disabled = false,
  className = '',
  variant = 'default',
  ...rest
}) {
  const variants = {
    default: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    primary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50'
  };
  
  return (
    <Tooltip content={tooltip} position="top">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        aria-label={tooltip}
        {...rest}
      >
        <Icon className="h-5 w-5" />
      </button>
    </Tooltip>
  );
}
