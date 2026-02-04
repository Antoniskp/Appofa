'use client';

import { useEffect, useState } from 'react';
import { locationAPI } from '@/lib/api';

const LOCATION_TYPES = ['international', 'country', 'prefecture', 'municipality'];

export default function LocationSelector({ 
  value, 
  onChange, 
  placeholder = 'Select a location',
  className = '',
  allowClear = true,
  filterType = null,
  filterParentId = null 
}) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLocations();
  }, [filterType, filterParentId]);

  useEffect(() => {
    // Load selected location details if value is provided
    if (value && !selectedLocation) {
      loadSelectedLocation(value);
    } else if (!value && selectedLocation) {
      setSelectedLocation(null);
    }
  }, [value]);

  const fetchLocations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (filterParentId) params.parent_id = filterParentId;
      
      const response = await locationAPI.getAll(params);
      if (response.success) {
        setLocations(response.locations || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedLocation = async (locationId) => {
    try {
      const response = await locationAPI.getById(locationId);
      if (response.success) {
        setSelectedLocation(response.location);
      }
    } catch (err) {
      console.error('Failed to load selected location:', err);
    }
  };

  const handleSelect = (location) => {
    setSelectedLocation(location);
    onChange(location.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedLocation(null);
    onChange(null);
    setSearchTerm('');
  };

  const getDisplayText = () => {
    if (selectedLocation) {
      let text = selectedLocation.name;
      if (selectedLocation.name_local) {
        text += ` (${selectedLocation.name_local})`;
      }
      if (selectedLocation.parent) {
        text += ` - ${selectedLocation.parent.name}`;
      }
      return text;
    }
    return placeholder;
  };

  const filteredLocations = searchTerm
    ? locations.filter(loc => 
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loc.name_local && loc.name_local.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : locations;

  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    if (!acc[loc.type]) {
      acc[loc.type] = [];
    }
    acc[loc.type].push(loc);
    return acc;
  }, {});

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-left focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex items-center justify-between"
        >
          <span className={selectedLocation ? '' : 'text-gray-500'}>
            {getDisplayText()}
          </span>
          <div className="flex items-center gap-2">
            {allowClear && selectedLocation && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-auto">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search locations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading locations...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : filteredLocations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No locations found</div>
            ) : (
              <div>
                {LOCATION_TYPES.map(type => {
                  const typeLocations = groupedLocations[type] || [];
                  if (typeLocations.length === 0) return null;

                  return (
                    <div key={type}>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                        {type}
                      </div>
                      {typeLocations.map(location => (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => handleSelect(location)}
                          className={`w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between ${
                            selectedLocation?.id === location.id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div>
                            <div className="text-sm text-gray-900">
                              {location.name}
                              {location.name_local && (
                                <span className="text-gray-500 ml-2">({location.name_local})</span>
                              )}
                            </div>
                            {location.parent && (
                              <div className="text-xs text-gray-500">
                                {location.parent.name}
                              </div>
                            )}
                          </div>
                          {location.code && (
                            <span className="text-xs text-gray-400">{location.code}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
