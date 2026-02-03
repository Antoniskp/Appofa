'use client';

import { useState, useEffect } from 'react';
import { locationAPI } from '@/lib/api';

export default function LocationSelector({ 
  selectedLocations = [], 
  onChange, 
  label = 'Location',
  multiple = false,
  allowedTypes = ['country', 'prefecture', 'municipality']
}) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);

  // Load countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Initialize selected values if locations are pre-selected
  useEffect(() => {
    if (selectedLocations.length > 0 && locations.length > 0) {
      initializeSelections();
    }
  }, [selectedLocations, locations]);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const response = await locationAPI.getAll({ type: 'country' });
      if (response.success) {
        setLocations(response.data);
      }
    } catch (err) {
      setError('Failed to load countries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeSelections = async () => {
    // Find the most specific selected location and work backwards
    const municipality = selectedLocations.find(loc => loc.type === 'municipality');
    const prefecture = selectedLocations.find(loc => loc.type === 'prefecture');
    const country = selectedLocations.find(loc => loc.type === 'country');

    if (municipality) {
      setSelectedMunicipality(municipality.id);
      if (municipality.parent_id) {
        setSelectedPrefecture(municipality.parent_id);
        await loadPrefectures(municipality.parent?.parent_id || prefecture?.parent_id);
      }
    } else if (prefecture) {
      setSelectedPrefecture(prefecture.id);
      if (prefecture.parent_id) {
        setSelectedCountry(prefecture.parent_id);
        await loadPrefectures(prefecture.parent_id);
      }
    } else if (country) {
      setSelectedCountry(country.id);
    }
  };

  const loadPrefectures = async (countryId) => {
    if (!countryId) return;
    try {
      const response = await locationAPI.getAll({ type: 'prefecture', parent_id: countryId });
      if (response.success) {
        return response.data;
      }
    } catch (err) {
      console.error('Failed to load prefectures:', err);
    }
  };

  const handleCountryChange = async (e) => {
    const countryId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedCountry(countryId);
    setSelectedPrefecture(null);
    setSelectedMunicipality(null);

    if (countryId) {
      const country = locations.find(loc => loc.id === countryId);
      if (!multiple) {
        onChange(country ? [country] : []);
      }
    } else {
      onChange([]);
    }
  };

  const handlePrefectureChange = async (e) => {
    const prefectureId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedPrefecture(prefectureId);
    setSelectedMunicipality(null);

    if (prefectureId) {
      const prefectures = await loadPrefectures(selectedCountry);
      const prefecture = prefectures?.find(loc => loc.id === prefectureId);
      const country = locations.find(loc => loc.id === selectedCountry);
      
      if (!multiple) {
        onChange([country, prefecture].filter(Boolean));
      }
    } else {
      const country = locations.find(loc => loc.id === selectedCountry);
      onChange(country ? [country] : []);
    }
  };

  const handleMunicipalityChange = (e) => {
    const municipalityId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedMunicipality(municipalityId);

    // This will be implemented when municipalities are loaded
    // For now, just update the selection
  };

  const [prefectures, setPrefectures] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  useEffect(() => {
    if (selectedCountry) {
      loadPrefectureList();
    } else {
      setPrefectures([]);
      setMunicipalities([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedPrefecture) {
      loadMunicipalityList();
    } else {
      setMunicipalities([]);
    }
  }, [selectedPrefecture]);

  const loadPrefectureList = async () => {
    try {
      const response = await locationAPI.getAll({ type: 'prefecture', parent_id: selectedCountry });
      if (response.success) {
        setPrefectures(response.data);
      }
    } catch (err) {
      console.error('Failed to load prefectures:', err);
    }
  };

  const loadMunicipalityList = async () => {
    try {
      const response = await locationAPI.getAll({ type: 'municipality', parent_id: selectedPrefecture });
      if (response.success) {
        setMunicipalities(response.data);
      }
    } catch (err) {
      console.error('Failed to load municipalities:', err);
    }
  };

  const handleMunicipalityChangeComplete = async (e) => {
    const municipalityId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedMunicipality(municipalityId);

    if (municipalityId) {
      const municipality = municipalities.find(loc => loc.id === municipalityId);
      const prefecture = prefectures.find(loc => loc.id === selectedPrefecture);
      const country = locations.find(loc => loc.id === selectedCountry);
      
      onChange([country, prefecture, municipality].filter(Boolean));
    } else if (selectedPrefecture) {
      const prefecture = prefectures.find(loc => loc.id === selectedPrefecture);
      const country = locations.find(loc => loc.id === selectedCountry);
      onChange([country, prefecture].filter(Boolean));
    } else if (selectedCountry) {
      const country = locations.find(loc => loc.id === selectedCountry);
      onChange(country ? [country] : []);
    } else {
      onChange([]);
    }
  };

  if (loading && locations.length === 0) {
    return <div className="text-gray-500">Loading locations...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      {/* Country Selection */}
      {allowedTypes.includes('country') && (
        <div>
          <select
            value={selectedCountry || ''}
            onChange={handleCountryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Country</option>
            {locations.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name} {country.name_local && `(${country.name_local})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Prefecture Selection */}
      {allowedTypes.includes('prefecture') && selectedCountry && prefectures.length > 0 && (
        <div>
          <select
            value={selectedPrefecture || ''}
            onChange={handlePrefectureChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Prefecture/Region (Optional)</option>
            {prefectures.map((prefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name} {prefecture.name_local && `(${prefecture.name_local})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Municipality Selection */}
      {allowedTypes.includes('municipality') && selectedPrefecture && municipalities.length > 0 && (
        <div>
          <select
            value={selectedMunicipality || ''}
            onChange={handleMunicipalityChangeComplete}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select City/Municipality (Optional)</option>
            {municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.id}>
                {municipality.name} {municipality.name_local && `(${municipality.name_local})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Display selected locations */}
      {selectedLocations.length > 0 && (
        <div className="text-sm text-gray-600">
          Selected: {selectedLocations.map(loc => loc.name).join(' > ')}
        </div>
      )}
    </div>
  );
}
