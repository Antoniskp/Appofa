'use client';

import { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * Comprehensive, reusable DropdownMenu component with full accessibility
 * 
 * Features:
 * - Automatic click-outside-to-close
 * - Full keyboard navigation (Arrow keys, Enter, Escape, Home, End)
 * - Support for icons, dividers, and disabled items
 * - Customizable alignment (left, right, center)
 * - Full accessibility (ARIA attributes, focus management)
 * - Smooth animations
 * - Support for custom trigger elements
 * - Controlled and uncontrolled modes
 * 
 * @param {React.ReactNode} trigger - Custom trigger element (button, link, etc.)
 * @param {string} triggerText - Text for default trigger button (if no custom trigger)
 * @param {string} triggerClassName - Additional classes for default trigger
 * @param {boolean} showChevron - Show chevron icon on default trigger (default: true)
 * @param {Array} items - Array of menu items
 * @param {string} align - Menu alignment: 'left', 'right', 'center' (default: 'right')
 * @param {string} menuClassName - Additional classes for menu container
 * @param {string} menuId - ID for menu (auto-generated if not provided)
 * @param {boolean} open - Controlled open state (optional)
 * @param {function} onOpenChange - Callback when menu open state changes
 */
export default function DropdownMenu({
  trigger,
  triggerText = 'Menu',
  triggerClassName = '',
  showChevron = true,
  items = [],
  align = 'right',
  menuClassName = '',
  menuId,
  open,
  onOpenChange
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const generatedId = useId();
  const menuElementId = menuId || `dropdown-menu-${generatedId}`;

  // Support both controlled and uncontrolled modes
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalIsOpen;

  const setIsOpen = useCallback((value) => {
    const newValue = typeof value === 'function' ? value(isOpen) : value;
    if (!isControlled) {
      setInternalIsOpen(newValue);
    }
    if (onOpenChange) {
      onOpenChange(newValue);
    }
  }, [isControlled, isOpen, onOpenChange]);

  // Filter out dividers and disabled items for keyboard navigation
  const focusableItems = useMemo(
    () => items.filter(item => !item.divider && !item.disabled),
    [items]
  );

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          triggerRef.current?.focus();
          break;

        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev + 1;
            return nextIndex >= focusableItems.length ? 0 : nextIndex;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev - 1;
            return nextIndex < 0 ? focusableItems.length - 1 : nextIndex;
          });
          break;

        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;

        case 'End':
          event.preventDefault();
          setFocusedIndex(focusableItems.length - 1);
          break;

        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < focusableItems.length) {
            event.preventDefault();
            const focusedItem = focusableItems[focusedIndex];
            if (focusedItem.onClick) {
              focusedItem.onClick();
              setIsOpen(false);
              setFocusedIndex(-1);
            }
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, focusableItems, setIsOpen]);

  // Focus management for keyboard navigation
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < itemRefs.current.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setFocusedIndex(-1);
    }
  };

  const handleItemClick = (item) => {
    if (item.disabled) return;
    
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Alignment classes
  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  // Default trigger button
  const defaultTrigger = (
    <button
      ref={triggerRef}
      type="button"
      className={`inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${triggerClassName}`}
      onClick={handleToggle}
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-controls={menuElementId}
      id={`${menuElementId}-button`}
    >
      {triggerText}
      {showChevron && (
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      )}
    </button>
  );

  // Custom trigger with proper props
  const customTrigger = trigger && (
    <div
      ref={triggerRef}
      onClick={handleToggle}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-controls={menuElementId}
      id={`${menuElementId}-button`}
    >
      {trigger}
    </div>
  );

  return (
    <div className="relative inline-block">
      {trigger ? customTrigger : defaultTrigger}

      {isOpen && (
        <div
          ref={menuRef}
          id={menuElementId}
          role="menu"
          aria-labelledby={`${menuElementId}-button`}
          className={`absolute ${alignmentClasses[align]} z-20 mt-2 w-52 rounded-md border border-seafoam bg-white py-1 shadow-lg animate-slideDown ${menuClassName}`}
        >
          {items.map((item, index) => {
            // Render divider
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-1 border-t border-gray-200"
                  role="separator"
                />
              );
            }

            const focusableIndex = focusableItems.findIndex((fi) => fi === item);
            const isFocused = focusableIndex === focusedIndex;

            // Render link item
            if (item.href) {
              return (
                <Link
                  key={item.id || `item-${index}`}
                  href={item.href}
                  ref={(el) => {
                    if (focusableIndex >= 0) {
                      itemRefs.current[focusableIndex] = el;
                    }
                  }}
                  role="menuitem"
                  tabIndex={isFocused ? 0 : -1}
                  className={`flex items-center gap-2 px-4 py-2 text-sm ${item.className || ''} ${
                    item.disabled
                      ? 'cursor-not-allowed text-gray-400'
                      : item.variant === 'danger'
                      ? 'text-red-600 hover:bg-seafoam/40'
                      : 'text-blue-900 hover:bg-seafoam/40'
                  } ${isFocused ? 'bg-seafoam/40' : ''}`}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                      return;
                    }
                    handleItemClick(item);
                  }}
                  aria-disabled={item.disabled}
                >
                  {item.icon && (
                    <span aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </Link>
              );
            }

            // Render button item
            return (
              <button
                key={item.id || `item-${index}`}
                ref={(el) => {
                  if (focusableIndex >= 0) {
                    itemRefs.current[focusableIndex] = el;
                  }
                }}
                type="button"
                role="menuitem"
                tabIndex={isFocused ? 0 : -1}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-left ${item.className || ''} ${
                  item.disabled
                    ? 'cursor-not-allowed text-gray-400'
                    : item.variant === 'danger'
                    ? 'text-red-600 hover:bg-seafoam/40'
                    : 'text-blue-900 hover:bg-seafoam/40'
                } ${isFocused ? 'bg-seafoam/40' : ''}`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                aria-disabled={item.disabled}
              >
                {item.icon && (
                  <span aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
