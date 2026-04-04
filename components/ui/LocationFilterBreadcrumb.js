'use client';

import { useState, useEffect } from 'react';
import { locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function LocationFilterBreadcrumb({ value, onChange }) {
  const { user, loading: authLoading } = useAuth();
  const [selections, setSelections] = useState([]);
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  // Load children of the deepest selected location (only when there is a selection)
  useEffect(() => {
    if (selections.length === 0) {
      setChildren([]);
      return;
    }
    const parentId = selections[selections.length - 1].id;
    setChildrenLoading(true);
    locationAPI.getAll({ parent_id: parentId, limit: 200 })
      .then(res => {
        if (res.success) setChildren(res.data || res.locations || []);
        else setChildren([]);
      })
      .catch(() => setChildren([]))
      .finally(() => setChildrenLoading(false));
  }, [selections]);

  const handleSelect = (location) => {
    const newSelections = [...selections, location];
    setSelections(newSelections);
    onChange(location.id);
  };

  const handleBreadcrumbClick = (index) => {
    const newSelections = selections.slice(0, index + 1);
    setSelections(newSelections);
    onChange(newSelections[newSelections.length - 1].id);
  };

  const handleClear = () => {
    setSelections([]);
    onChange(null);
  };

  const handleRestoreHome = () => {
    if (user?.homeLocation) {
      const path = [];
      let loc = user.homeLocation;
      while (loc) {
        path.unshift(loc);
        loc = loc.parent;
      }
      setSelections(path);
      onChange(user.homeLocation.id);
    }
  };

  // Still loading auth — render nothing to avoid layout shift
  if (authLoading) return null;

  // No active selection — show a subtle prompt for users who have a home location
  if (selections.length === 0) {
    if (!user?.homeLocation) return null;
    return (
      <div className="mb-2">
        <button
          onClick={handleRestoreHome}
          className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800"
        >
          <span>🏠</span>
          <span>Φιλτράρισμα για την τοποθεσία μου</span>
        </button>
      </div>
    );
  }

  return (
    <nav className="mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        <li className="flex items-center text-amber-700 font-semibold mr-1">🏠</li>
        {selections.map((sel, index) => (
          <li key={sel.id} className="flex items-center">
            {index > 0 && <span className="mx-1 text-amber-400">/</span>}
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className={
                index === selections.length - 1
                  ? 'text-amber-700 font-semibold hover:text-amber-900'
                  : 'text-amber-600 hover:text-amber-800'
              }
            >
              {sel.name}
            </button>
          </li>
        ))}
        {children.length > 0 && (
          <li className="flex items-center">
            <span className="mx-1 text-amber-400">/</span>
            <select
              className="border-none bg-transparent text-amber-600 text-sm focus:ring-0 cursor-pointer py-0"
              value=""
              onChange={(e) => {
                const loc = children.find(c => String(c.id) === e.target.value);
                if (loc) handleSelect(loc);
              }}
              disabled={childrenLoading}
            >
              <option value="">{childrenLoading ? '...' : '▾'}</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </li>
        )}
        <li className="ml-auto flex items-center">
          <button
            onClick={handleClear}
            className="text-amber-400 hover:text-amber-600"
            title="Εκκαθάριση φίλτρου τοποθεσίας"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </li>
      </ol>
    </nav>
  );
}
