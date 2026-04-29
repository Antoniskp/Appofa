'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { personAPI } from '@/lib/api/persons.js';

/**
 * Shared person-search dropdown component.
 * Uses the unified-search endpoint that merges person profiles and real users.
 *
 * Props:
 *   onSelect(result)       – called with the selected result object (has .id, .entityType, .claimStatus)
 *   placeholder            – input placeholder text
 *   showTopSuggestions     – on focus with empty query, load top suggestions
 *   value                  – controlled input value (optional)
 *   onChange               – controlled onChange handler (optional)
 */
export default function PersonSearch({
  onSelect,
  placeholder = 'Αναζητήστε πρόσωπο...',
  showTopSuggestions = false,
  value,
  onChange,
  nationality,
}) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState('');
  const query = isControlled ? value : internalQuery;

  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isTopSuggestions, setIsTopSuggestions] = useState(false);
  const [searchStatus, setSearchStatus] = useState(null); // null | 'empty'

  const timer = useRef(null);
  const requestIdRef = useRef(0);
  const ref = useRef(null);
  const resultsRef = useRef([]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearchStatus(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadTopSuggestions = useCallback(async () => {
    if (!showTopSuggestions) return;
    const myId = ++requestIdRef.current;
    setSearching(true);
    try {
      const params = { limit: 8 };
      if (nationality) params.nationality = nationality;
      const res = await personAPI.unifiedSearch(params);
      if (myId !== requestIdRef.current) return;
      const items = res?.data?.results || [];
      setResults(items);
      setIsTopSuggestions(true);
      setOpen(items.length > 0);
      setSearchStatus(items.length > 0 ? null : 'empty');
    } catch {
      if (myId !== requestIdRef.current) return;
      setResults([]);
    } finally {
      if (myId === requestIdRef.current) setSearching(false);
    }
  }, [showTopSuggestions, nationality]);

  const search = useCallback((q) => {
    clearTimeout(timer.current);
    setSearchStatus(null);

    if (!q.trim()) {
      setResults([]);
      setIsTopSuggestions(false);
      setOpen(false);
      return;
    }

    if (q.trim().length < 2) {
      setOpen(resultsRef.current.length > 0);
      return;
    }

    setOpen(true);

    timer.current = setTimeout(async () => {
      const myId = ++requestIdRef.current;
      setSearching(true);
      try {
        const params = { search: q.trim(), limit: 8 };
        if (nationality) params.nationality = nationality;
        const res = await personAPI.unifiedSearch(params);
        if (myId !== requestIdRef.current) return;
        const items = res?.data?.results || [];
        setResults(items);
        setIsTopSuggestions(false);
        setSearchStatus(items.length > 0 ? null : 'empty');
        setOpen(true);
      } catch {
        if (myId !== requestIdRef.current) return;
        setResults([]);
        setOpen(false);
      } finally {
        if (myId === requestIdRef.current) setSearching(false);
      }
    }, 300);
  }, [nationality]);

  const handleInputChange = (e) => {
    const q = e.target.value;
    if (!isControlled) setInternalQuery(q);
    if (onChange) onChange(e);
    search(q);
  };

  const handleSelect = (result) => {
    const displayName = (`${result.firstNameNative || ''} ${result.lastNameNative || ''}`.trim()) || result.username || '';
    if (!isControlled) setInternalQuery(displayName);
    if (onChange) onChange({ target: { value: displayName } });
    setOpen(false);
    setSearchStatus(null);
    onSelect(result);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (resultsRef.current.length > 0) {
              setOpen(true);
            } else if (!query.trim() && showTopSuggestions) {
              loadTopSuggestions();
            }
          }}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && searchStatus === 'empty' && (
        <div
          role="status"
          aria-live="polite"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400 text-center"
        >
          Δεν βρέθηκαν αποτελέσματα
        </div>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {isTopSuggestions && (
            <li className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 pointer-events-none">
              Δημοφιλείς Προτάσεις
            </li>
          )}
          {results.map((result) => {
            const displayName = (`${result.firstNameNative || ''} ${result.lastNameNative || ''}`.trim()) || result.username || '';
            const photo = result.displayPhoto || result.photo || result.avatar || null;

            let badge;
            if (result.entityType === 'person') {
              if (result.claimStatus === 'unclaimed') {
                badge = { label: 'Αδιεκδίκητο', cls: 'bg-amber-100 text-amber-700' };
              } else if (result.claimStatus === 'pending') {
                badge = { label: '⏳ Σε Αναμονή', cls: 'bg-gray-100 text-gray-500' };
              } else {
                badge = { label: '✅ Επαληθευμένος', cls: 'bg-green-100 text-green-600' };
              }
            } else {
              badge = result.isVerified
                ? { label: '✅ Επαληθευμένος', cls: 'bg-green-100 text-green-600' }
                : { label: '👤 Χρήστης', cls: 'bg-blue-100 text-blue-600' };
            }

            return (
              <li
                key={`${result.entityType}-${result.id}`}
                role="option"
                onClick={() => handleSelect(result)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(result)}
                tabIndex={0}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {photo
                  ? <img src={photo} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                  : <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="h-4 w-4 text-gray-400" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{displayName}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
