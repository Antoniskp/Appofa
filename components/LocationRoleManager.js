'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { locationRoleAPI } from '@/lib/api';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import {
  UserCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPersonName(firstNameNative, lastNameNative, fallback) {
  return firstNameNative ? `${firstNameNative} ${lastNameNative || ''}`.trim() : (fallback || '');
}

// ---------------------------------------------------------------------------
// Person / User search picker
// ---------------------------------------------------------------------------
function AssigneePicker({ onSelect, onClose }) {
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
        const encodedQ = encodeURIComponent(query);
        const [usersRes, personsRes] = await Promise.all([
          apiRequest(`/api/auth/users/search?search=${encodedQ}&limit=5`).catch(() => null),
          apiRequest(`/api/persons?search=${encodedQ}&limit=5`).catch(() => null),
        ]);

        const userResults = (usersRes?.data?.users || []).map((u) => ({
          userId: u.id,
          name: formatPersonName(u.firstNameNative, u.lastNameNative, u.username),
          photo: u.avatar,
          username: u.username,
          isPerson: false,
        }));

        const personResults = (personsRes?.data?.profiles || [])
          .map((p) => {
            const userId = p.claimStatus === 'claimed' ? p.claimedByUserId : p.placeholderUserId;
            if (!userId) return null;
            return {
              userId,
              name: formatPersonName(p.firstNameNative, p.lastNameNative),
              photo: p.photo,
              claimStatus: p.claimStatus,
              isPerson: true,
            };
          })
          .filter(Boolean);

        // Person results take priority; skip user results whose userId is already
        // covered by a person result to avoid duplicates.
        const personUserIds = new Set(personResults.map((r) => r.userId));
        const filteredUsers = userResults.filter((r) => !personUserIds.has(r.userId));

        setResults([...personResults, ...filteredUsers]);
      } catch {
        // ignore search errors silently
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
      <div className="relative mb-2">
        <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση με όνομα…"
          className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {searching && (
        <p className="text-xs text-gray-500 py-1">Αναζήτηση…</p>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-xs text-gray-500 py-1">Δεν βρέθηκαν αποτελέσματα.</p>
      )}

      {results.length > 0 && (
        <div>
          {results.map((r, i) => (
            <button
              key={`result-${r.userId}-${i}`}
              type="button"
              onClick={() => onSelect({ type: 'user', id: r.userId, name: r.name, photo: r.photo })}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 text-sm"
            >
              {r.photo ? (
                <img src={r.photo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <UserCircleIcon className="w-7 h-7 text-gray-400 flex-shrink-0" />
              )}
              <span className="truncate">{r.name}</span>
              {r.username && (
                <span className="text-xs text-gray-400">@{r.username}</span>
              )}
              {r.isPerson && r.claimStatus === 'unclaimed' && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Αδιεκδίκητο</span>
              )}
              {r.isPerson && r.claimStatus === 'pending' && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Σε Αναμονή</span>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-2 text-xs text-gray-500 hover:text-gray-700"
      >
        Ακύρωση
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role slot row
// ---------------------------------------------------------------------------
function RoleSlotRow({ definition, assignment, onChange }) {
  const [picking, setPicking] = useState(false);

  const user = assignment?.user || null;
  const displayName = user ? formatPersonName(user.firstNameNative, user.lastNameNative, user.username) : null;
  const photo = user?.avatar || user?.placeholderPersonProfile?.photo || null;

  const handleSelect = ({ id }) => {
    setPicking(false);
    onChange(definition.key, { userId: id });
  };

  const handleClear = () => {
    onChange(definition.key, { userId: null });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{definition.title}</p>
          <p className="text-xs text-gray-500">{definition.titleEn}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
              {photo ? (
                <img src={photo} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <UserCircleIcon className="w-8 h-8 text-gray-400" />
              )}
              <span className="text-sm text-gray-700 max-w-[120px] truncate">{displayName}</span>
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleClear}
                title="Clear assignment"
                className="text-gray-400 hover:text-red-500"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Assign
            </button>
          )}
        </div>
      </div>

      {picking && (
        <AssigneePicker
          onSelect={handleSelect}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LocationRoleManager({ locationId, locationType }) {
  const [rolesData, setRolesData] = useState(null);
  const [localAssignments, setLocalAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  const load = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    try {
      const res = await locationRoleAPI.getRoles(locationId);
      if (res?.success) {
        setRolesData(res);
        // Build local assignments map from fetched data
        const map = {};
        for (const role of res.roles) {
          if (role.assignment) {
            map[role.key] = {
              userId: role.assignment.userId || null,
            };
          }
        }
        setLocalAssignments(map);
      }
    } catch (err) {
      toastError('Failed to load location roles');
    } finally {
      setLoading(false);
    }
  }, [locationId, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (roleKey, { userId }) => {
    setLocalAssignments((prev) => ({
      ...prev,
      [roleKey]: { userId },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build the roles array from all definitions + current local assignments
      const definitions = rolesData?.roles || [];
      const roles = definitions.map((def) => {
        const a = localAssignments[def.key] || {};
        return {
          roleKey: def.key,
          userId: a.userId || null,
        };
      });

      const res = await locationRoleAPI.upsertRoles(locationId, roles);
      if (res?.success) {
        toastSuccess('Roles saved successfully');
        // Update rolesData with fresh data from server
        setRolesData(res);
        const map = {};
        for (const role of res.roles) {
          if (role.assignment) {
            map[role.key] = {
              userId: role.assignment.userId || null,
            };
          }
        }
        setLocalAssignments(map);
      } else {
        toastError(res?.message || 'Failed to save roles');
      }
    } catch (err) {
      toastError(err.message || 'Failed to save roles');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">Loading roles…</div>
    );
  }

  if (!rolesData || rolesData.roles.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
        No predefined roles are configured for this location type.
      </div>
    );
  }

  // Merge server definitions with local assignment state for display
  const displayRoles = rolesData.roles.map((def) => {
    if (!(def.key in localAssignments)) return def;
    const localA = localAssignments[def.key];
    // If local differs from server assignment, use local (for optimistic display)
    const serverA = def.assignment;
    const changed = (localA.userId !== (serverA?.userId || null));
    if (!changed) return def;
    return {
      ...def,
      assignment: {
        ...serverA,
        userId: localA.userId,
        // user object will be stale until save — show name via local state only
        user: localA.userId ? serverA?.user : null,
      },
    };
  });

  return (
    <div className="space-y-3">
      {displayRoles.map((role) => (
        <RoleSlotRow
          key={role.key}
          definition={role}
          assignment={role.assignment}
          onChange={handleChange}
        />
      ))}

      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <CheckIcon className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Roles'}
        </button>
      </div>
    </div>
  );
}
