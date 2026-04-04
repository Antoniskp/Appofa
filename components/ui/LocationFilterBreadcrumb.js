'use client';

import { useState, useEffect } from 'react';
import { locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { MapPinIcon, HomeIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function LocationFilterBreadcrumb({ value, onChange, showHomeShortcut = true }) {
  const { user } = useAuth();
  const [selections, setSelections] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load children of the deepest selected location (or root locations when nothing selected)
  useEffect(() => {
    const parentId = selections.length > 0 ? selections[selections.length - 1].id : null;
    setLoading(true);
    locationAPI.getAll({ parent_id: parentId ?? '', limit: 200 })
      .then(res => {
        if (res.success) setChildren(res.data || res.locations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  const handleHomeShortcut = () => {
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

  const hasChildren = children.length > 0;

  return (
    <div className="flex items-center flex-wrap gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
      <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />

      {showHomeShortcut && user?.homeLocation && (
        <button
          onClick={handleHomeShortcut}
          className="text-amber-600 hover:text-amber-800 flex-shrink-0"
          title="Μετάβαση στην τοποθεσία μου"
        >
          <HomeIcon className="h-4 w-4" />
        </button>
      )}

      {selections.map((sel, index) => (
        <span key={sel.id} className="flex items-center gap-1">
          {index > 0 && <span className="text-gray-400">/</span>}
          <button
            onClick={() => handleBreadcrumbClick(index)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {sel.name}
          </button>
        </span>
      ))}

      {hasChildren && (
        <>
          {selections.length > 0 && <span className="text-gray-400">/</span>}
          <select
            className="border-none bg-transparent text-gray-700 text-sm focus:ring-0 cursor-pointer py-0"
            value=""
            onChange={(e) => {
              const loc = children.find(c => String(c.id) === e.target.value);
              if (loc) handleSelect(loc);
            }}
            disabled={loading}
          >
            <option value="">
              {selections.length === 0 ? 'Επιλέξτε τοποθεσία...' : 'Επιλέξτε...'}
            </option>
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        </>
      )}

      {selections.length > 0 && (
        <button onClick={handleClear} className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0" title="Εκκαθάριση φίλτρου τοποθεσίας">
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
