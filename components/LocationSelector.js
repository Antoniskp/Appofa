'use client';

import { useState, useEffect } from 'react';

/**
 * Hierarchical Location Selector Component
 * Allows users to select locations from international down to municipality level
 */
export default function LocationSelector({ 
  value = null, 
  onChange, 
  label = "Location",
  allowedTypes = ['international', 'country', 'prefecture', 'municipality'],
  required = false 
}) {
  const [locations, setLocations] = useState({
    international: [],
    country: [],
    prefecture: [],
    municipality: []
  });
  
  const [selected, setSelected] = useState({
    international: null,
    country: null,
    prefecture: null,
    municipality: null
  });

  const [loading, setLoading] = useState({
    international: false,
    country: false,
    prefecture: false,
    municipality: false
  });

  // Load international locations on mount
  useEffect(() => {
    if (allowedTypes.includes('international')) {
      loadLocations('international', null);
    }
  }, []);

  // Load initial value if provided
  useEffect(() => {
    if (value) {
      loadLocationHierarchy(value);
    }
  }, [value]);

  const loadLocations = async (type, parentId) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      const params = new URLSearchParams({ type });
      if (parentId) {
        params.append('parent_id', parentId);
      } else if (type !== 'international') {
        params.append('parent_id', 'null');
      }
      
      const response = await fetch(`/api/locations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLocations(prev => ({ ...prev, [type]: data.data }));
      }
    } catch (error) {
      console.error(`Error loading ${type} locations:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const loadLocationHierarchy = async (locationId) => {
    try {
      const response = await fetch(`/api/locations/${locationId}`);
      const data = await response.json();
      
      if (data.success) {
        const location = data.data;
        const newSelected = { ...selected };
        
        // Build hierarchy from location and parent
        const hierarchy = [];
        let current = location;
        while (current) {
          hierarchy.unshift(current);
          current = current.parent;
        }
        
        // Set selected values for each level
        hierarchy.forEach(loc => {
          newSelected[loc.type] = loc.id;
        });
        
        setSelected(newSelected);
        
        // Load locations for each level
        for (let i = 0; i < hierarchy.length; i++) {
          const loc = hierarchy[i];
          const parentId = i > 0 ? hierarchy[i - 1].id : null;
          await loadLocations(loc.type, parentId);
          
          // Load next level if not the last
          if (i < hierarchy.length - 1) {
            await loadLocations(hierarchy[i + 1].type, loc.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading location hierarchy:', error);
    }
  };

  const handleSelect = async (type, locationId) => {
    const newSelected = { ...selected };
    newSelected[type] = locationId ? parseInt(locationId) : null;
    
    // Clear child selections
    const typeOrder = ['international', 'country', 'prefecture', 'municipality'];
    const currentIndex = typeOrder.indexOf(type);
    for (let i = currentIndex + 1; i < typeOrder.length; i++) {
      newSelected[typeOrder[i]] = null;
      setLocations(prev => ({ ...prev, [typeOrder[i]]: [] }));
    }
    
    setSelected(newSelected);
    
    // Load next level if a location was selected
    if (locationId) {
      const nextType = typeOrder[currentIndex + 1];
      if (nextType && allowedTypes.includes(nextType)) {
        await loadLocations(nextType, locationId);
      }
    }
    
    // Call onChange with the most specific selected location
    const selectedId = newSelected.municipality || newSelected.prefecture || 
                       newSelected.country || newSelected.international;
    onChange(selectedId);
  };

  const renderSelect = (type, parentType = null) => {
    if (!allowedTypes.includes(type)) return null;
    
    const isDisabled = parentType && !selected[parentType];
    const typeLabels = {
      international: 'International',
      country: 'Country',
      prefecture: 'Prefecture/State',
      municipality: 'Municipality/City'
    };
    
    return (
      <div key={type} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {typeLabels[type]}
        </label>
        <select
          value={selected[type] || ''}
          onChange={(e) => handleSelect(type, e.target.value)}
          disabled={isDisabled || loading[type]}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select {typeLabels[type]}</option>
          {locations[type].map(location => (
            <option key={location.id} value={location.id}>
              {location.name} {location.name_local ? `(${location.name_local})` : ''}
            </option>
          ))}
        </select>
        {loading[type] && (
          <p className="text-sm text-gray-500 mt-1">Loading...</p>
        )}
      </div>
    );
  };

  return (
    <div className="location-selector">
      {label && (
        <div className="mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        </div>
      )}
      
      {renderSelect('international')}
      {renderSelect('country', 'international')}
      {renderSelect('prefecture', 'country')}
      {renderSelect('municipality', 'prefecture')}
      
      {value && (
        <button
          type="button"
          onClick={() => {
            setSelected({
              international: null,
              country: null,
              prefecture: null,
              municipality: null
            });
            onChange(null);
          }}
          className="text-sm text-red-600 hover:text-red-800 mt-2"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
