'use client';

/**
 * LocationModeratorManager
 *
 * Admin-only component for managing platform-level moderator assignments for a
 * specific location.  Displayed in the LocationEditForm so that the location
 * page is the primary place to manage who moderates each location.
 *
 * Features:
 * - Lists currently assigned moderators as removable chips
 * - Allows searching for users to add as moderators
 * - Only valid users (home location ancestor-chain) can be added (validated server-side)
 * - Removing the last assignment automatically demotes the user's global role
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { locationPlatformRoleAPI, authAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatName(user) {
  if (!user) return '—';
  const native = [user.firstNameNative, user.lastNameNative].filter(Boolean).join(' ');
  const en = [user.firstNameEn, user.lastNameEn].filter(Boolean).join(' ');
  return native || en || user.username || `#${user.id}`;
}

// ---------------------------------------------------------------------------
// User search picker (re-used from LocationRoleManager pattern)
// ---------------------------------------------------------------------------
function UserSearchPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await authAPI.getAdminUsers({ search: query, limit: 8, placeholder: 'false' }).catch(() => null);
        const items = res?.data?.users || [];
        setResults(items);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-3 mt-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Αναζήτηση χρήστη..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
          aria-label="Κλείσιμο"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {searching && (
        <p className="text-xs text-gray-400 px-1 py-1">Αναζήτηση...</p>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-xs text-gray-400 px-1 py-1">Δεν βρέθηκαν χρήστες.</p>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onSelect(u)}
                className="w-full text-left px-2 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition-colors"
              >
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <UserCircleIcon className="h-6 w-6 text-gray-300 flex-shrink-0" />
                )}
                <span className="flex-1 min-w-0 truncate">
                  <span className="font-medium text-gray-900">{formatName(u)}</span>
                  {u.username && (
                    <span className="text-gray-400 ml-1.5">@{u.username}</span>
                  )}
                </span>
                {u.homeLocation && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {u.homeLocation.name}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LocationModeratorManager({ locationId }) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    try {
      const res = await locationPlatformRoleAPI.listAssignments(locationId);
      if (res.success) {
        setAssignments(res.assignments.filter((a) => a.roleKey === 'moderator'));
      }
    } catch {
      // silent — component may be outside admin context
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (user) => {
    setShowPicker(false);
    try {
      const res = await locationPlatformRoleAPI.addAssignment(locationId, user.id, 'moderator');
      if (res.success) {
        toastSuccess('Ο συντονιστής προστέθηκε!');
        setAssignments((prev) => [...prev, res.assignment]);
      }
    } catch (err) {
      toastError(err.message || 'Αποτυχία προσθήκης συντονιστή.');
    }
  };

  const handleRemove = async (assignment) => {
    setRemovingId(assignment.id);
    try {
      const res = await locationPlatformRoleAPI.removeAssignment(locationId, assignment.id);
      if (res.success) {
        toastSuccess('Η ανάθεση αφαιρέθηκε.');
        setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
      }
    } catch (err) {
      toastError(err.message || 'Αποτυχία αφαιρέσης ανάθεσης.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <ShieldCheckIcon className="h-4 w-4 text-blue-500" />
          Συντονιστές τοποθεσίας
        </div>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Προσθήκη
        </button>
      </div>

      {/* Search picker */}
      {showPicker && (
        <UserSearchPicker onSelect={handleAdd} onClose={() => setShowPicker(false)} />
      )}

      {/* List */}
      {loading ? (
        <p className="text-xs text-gray-400">Φόρτωση...</p>
      ) : assignments.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          Δεν υπάρχουν ανατεθειμένοι συντονιστές γι&apos; αυτήν την τοποθεσία.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2 mt-1">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200"
            >
              {a.user?.avatar ? (
                <img
                  src={a.user.avatar}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <UserCircleIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
              )}
              <span className="max-w-[140px] truncate">
                {formatName(a.user)}
                {a.user?.username && (
                  <span className="text-blue-500 font-normal ml-1">@{a.user.username}</span>
                )}
              </span>
              <button
                type="button"
                disabled={removingId === a.id}
                onClick={() => handleRemove(a)}
                className="ml-0.5 text-blue-400 hover:text-red-500 rounded-full p-0.5 disabled:opacity-40 transition-colors"
                aria-label={`Αφαίρεση ${formatName(a.user)}`}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
