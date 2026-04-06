'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api/client.js';

/**
 * Shared person-search dropdown component.
 *
 * Props:
 *   onSelect(person)       – called with the selected person object ({ id, firstName, lastName,
 *                            username?, type: 'profile'|'user', ... })
 *   placeholder            – input placeholder text
 *   includeUsers           – also search /api/auth/users/search alongside /api/persons
 *   showTopSuggestions     – on focus with empty query, load top persons/users as suggestions
 *   value                  – controlled input value (optional)
 *   onChange               – controlled onChange handler (optional)
 */
export default function PersonSearch({
  onSelect,
  placeholder = 'Αναζητήστε πρόσωπο...',
  includeUsers = false,
  showTopSuggestions = false,
  value,
  onChange,
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
  // Mirror of results so the search callback can read the current count without
  // needing results in its dependency array (avoids the stale-closure recreation bug).
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
      const [profileRes, userRes] = await Promise.allSettled([
        apiRequest('/api/persons?limit=8&claimStatus=all'),
        includeUsers ? apiRequest('/api/auth/users/search?limit=8') : Promise.resolve(null),
      ]);
      if (myId !== requestIdRef.current) return;
      const profiles = (profileRes.status === 'fulfilled' ? profileRes.value?.data?.profiles : null) || [];
      const users = (userRes.status === 'fulfilled' ? userRes.value?.data?.users : null) || [];
      const merged = [
        ...profiles.map((p) => ({ ...p, type: 'profile' })),
        ...users.map((u) => ({ ...u, type: 'user' })),
      ];
      setResults(merged);
      setIsTopSuggestions(true);
      setOpen(merged.length > 0);
      setSearchStatus(merged.length > 0 ? null : 'empty');
    } catch {
      if (myId !== requestIdRef.current) return;
      setResults([]);
    } finally {
      if (myId === requestIdRef.current) setSearching(false);
    }
  }, [showTopSuggestions, includeUsers]);

  // Debounced search — dependency array intentionally excludes results state.
  // resultsRef is used for the 1-char guard so the callback is never stale.
  const search = useCallback((q) => {
    clearTimeout(timer.current);
    setSearchStatus(null);

    if (!q.trim()) {
      setResults([]);
      setIsTopSuggestions(false);
      setOpen(false);
      return;
    }

    // For very short queries (1 char) keep whatever is currently visible and
    // wait for more input before hitting the server.
    if (q.trim().length < 2) {
      setOpen(resultsRef.current.length > 0);
      return;
    }

    // 2+ characters: fire debounced search; keep old results visible until new ones arrive.
    setOpen(true);

    timer.current = setTimeout(async () => {
      const myId = ++requestIdRef.current;
      setSearching(true);
      try {
        // Send raw query; backend already handles Greek normalization + raw matching.
        const encodedQ = encodeURIComponent(q.trim());
        const [profileRes, userRes] = await Promise.allSettled([
          apiRequest(`/api/persons?search=${encodedQ}&limit=8&claimStatus=all`),
          includeUsers
            ? apiRequest(`/api/auth/users/search?search=${encodedQ}&limit=8`)
            : Promise.resolve(null),
        ]);
        if (myId !== requestIdRef.current) return;
        const profiles = (profileRes.status === 'fulfilled' ? profileRes.value?.data?.profiles : null) || [];
        const users = (userRes.status === 'fulfilled' ? userRes.value?.data?.users : null) || [];
        const merged = [
          ...profiles.map((p) => ({ ...p, type: 'profile' })),
          ...users.map((u) => ({ ...u, type: 'user' })),
        ];
        setResults(merged);
        setIsTopSuggestions(false);
        setSearchStatus(merged.length > 0 ? null : 'empty');
        setOpen(true);
      } catch {
        if (myId !== requestIdRef.current) return;
        setResults([]);
        setOpen(false);
      } finally {
        if (myId === requestIdRef.current) setSearching(false);
      }
    }, 300);
  }, [includeUsers]);

  const handleInputChange = (e) => {
    const q = e.target.value;
    if (!isControlled) setInternalQuery(q);
    if (onChange) onChange(e);
    search(q);
  };

  const handleSelect = (person) => {
    const displayName = person.type === 'user'
      ? ((`${person.firstNameNative || ''} ${person.lastNameNative || ''}`.trim()) || person.username)
      : `${person.firstNameNative} ${person.lastNameNative}`;
    if (!isControlled) setInternalQuery(displayName);
    if (onChange) onChange({ target: { value: displayName } });
    setOpen(false);
    setSearchStatus(null);
    onSelect(person);
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
          {results.map((person) => {
            const isUser = person.type === 'user';
            const isVerifiedUser = isUser && person.isVerified === true;
            // Unverified users can appear in results but cannot be selected;
            // only verified users are permitted as candidates.
            const isBlockedUser = isUser && !isVerifiedUser;
            const displayName = isUser
              ? ((`${person.firstNameNative || ''} ${person.lastNameNative || ''}`.trim()) || person.username)
              : `${person.firstNameNative} ${person.lastNameNative}`;
            const photo = isUser ? person.avatar : person.photo;
            return (
              <li
                key={`${person.type}-${person.id}`}
                role="option"
                onClick={() => {
                  if (isBlockedUser) return;
                  handleSelect(person);
                }}
                onKeyDown={(e) => e.key === 'Enter' && !isBlockedUser && handleSelect(person)}
                tabIndex={isBlockedUser ? -1 : 0}
                title={isBlockedUser ? 'Μόνο επαληθευμένοι χρήστες μπορούν να προστεθούν.' : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isBlockedUser ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer transition-colors'}`}
              >
                {photo
                  ? <img src={photo} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                  : <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="h-4 w-4 text-gray-400" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{displayName}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isBlockedUser ? 'bg-gray-100 text-gray-400' : isVerifiedUser ? 'bg-green-100 text-green-600' : isUser ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {isBlockedUser ? '🔒 Μη επαληθευμένος' : isUser ? '🧑 Χρήστης' : '📋 Δημόσιο Προφίλ'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
