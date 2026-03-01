'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Delay before closing the dropdown on blur so that a mousedown on a
// suggestion option fires before the blur handler hides the list.
const DROPDOWN_CLOSE_DELAY_MS = 150;

/**
 * Lightweight tag input with autocomplete and comma-separated tag creation.
 *
 * @param {string[]} value - Current array of tags
 * @param {Function} onChange - Called with updated tag array
 * @param {string[]} [suggestions=[]] - Autocomplete suggestions
 * @param {string} [label] - Field label
 * @param {string} [placeholder='Add tag…'] - Input placeholder
 * @param {string} [helpText] - Help text shown below the input
 */
export default function TagInput({
  value = [],
  onChange,
  suggestions = [],
  label,
  placeholder = 'Add tag\u2026',
  helpText = 'Separate tags with commas.',
}) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listboxId = useId();

  // Filter suggestions: match input text, exclude already-added tags
  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  const commitTag = (raw) => {
    // Trim and collapse internal whitespace
    const tag = raw.trim().replace(/\s+/g, ' ');
    if (!tag) return;
    // Case-insensitive dedup: skip if already present
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  };

  const removeTag = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    // Backspace with empty input removes the last tag
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        commitTag(filtered[activeIndex]);
      } else if (inputValue) {
        commitTag(inputValue);
      }
      setInputValue('');
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }

    if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.includes(',')) {
      // Commit everything before the last comma as separate tags
      const parts = val.split(',');
      parts.slice(0, -1).forEach((p) => commitTag(p));
      setInputValue(parts[parts.length - 1]);
    } else {
      setInputValue(val);
    }
    setShowDropdown(true);
    setActiveIndex(-1);
  };

  const handleSuggestionMouseDown = (suggestion) => {
    commitTag(suggestion);
    setInputValue('');
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Tag chips + text input */}
      <div
        role="group"
        className="relative flex flex-wrap gap-1.5 items-center px-3 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-text min-h-[42px]"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-sm rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="hover:text-blue-600 focus:outline-none"
              aria-label={`Remove tag ${tag}`}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowDropdown(true)}
          onBlur={() =>
            // Delay so mousedown on suggestion fires first
            setTimeout(() => {
              setShowDropdown(false);
              setActiveIndex(-1);
            }, DROPDOWN_CLOSE_DELAY_MS)
          }
          className="flex-1 min-w-[120px] outline-none text-sm py-0.5 bg-transparent"
          placeholder={value.length === 0 ? placeholder : ''}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showDropdown && filtered.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
        />

        {/* Autocomplete dropdown */}
        {showDropdown && filtered.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {filtered.map((s, i) => (
              <li
                key={s}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => handleSuggestionMouseDown(s)}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  i === activeIndex ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
                }`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {helpText && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
