'use client';

import { useEffect, useState } from 'react';
import { locationAPI } from '@/lib/api';

export default function CascadingLocationSelector({ 
  value, 
  onChange, 
  placeholder = 'Select a location',
  className = '',
  allowClear = true
}) {
  const [countries, setCountries] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Load selected location if value is provided
  useEffect(() => {
    if (value && !selectedMunicipality && !selectedPrefecture && !selectedCountry) {
      loadSelectedLocation(value);
    } else if (!value) {
      // Clear all selections
      setSelectedCountry(null);
      setSelectedPrefecture(null);
      setSelectedMunicipality(null);
      setPrefectures([]);
      setMunicipalities([]);
    }
  }, [value]);

  const fetchCountries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await locationAPI.getAll({ type: 'country' });
      if (response.success) {
        const allCountries = response.locations || [];
        // Add "International" as a special option
        const internationalOption = {
          id: 'international',
          name: 'International',
          type: 'international',
          isInternational: true
        };
        setCountries([internationalOption, ...allCountries]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrefectures = async (countryId) => {
    setLoading(true);
    setError('');
    try {
      const response = await locationAPI.getAll({ type: 'prefecture', parent_id: countryId });
      if (response.success) {
        setPrefectures(response.locations || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load prefectures');
    } finally {
      setLoading(false);
    }
  };

  const fetchMunicipalities = async (prefectureId) => {
    setLoading(true);
    setError('');
    try {
      const response = await locationAPI.getAll({ type: 'municipality', parent_id: prefectureId });
      if (response.success) {
        setMunicipalities(response.locations || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load municipalities');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedLocation = async (locationId) => {
    try {
      const response = await locationAPI.getById(locationId);
      if (response.success) {
        const location = response.location;
        
        // Determine what type of location this is and set up the chain
        if (location.type === 'municipality') {
          // Load the full chain: country -> prefecture -> municipality
          setSelectedMunicipality(location);
          
          if (location.parent_id) {
            const prefectureResponse = await locationAPI.getById(location.parent_id);
            if (prefectureResponse.success) {
              const prefecture = prefectureResponse.location;
              setSelectedPrefecture(prefecture);
              
              if (prefecture.parent_id) {
                const countryResponse = await locationAPI.getById(prefecture.parent_id);
                if (countryResponse.success) {
                  const country = countryResponse.location;
                  setSelectedCountry(country);
                  
                  // Load prefectures and municipalities
                  await fetchPrefectures(country.id);
                  await fetchMunicipalities(prefecture.id);
                }
              }
            }
          }
        } else if (location.type === 'prefecture') {
          setSelectedPrefecture(location);
          
          if (location.parent_id) {
            const countryResponse = await locationAPI.getById(location.parent_id);
            if (countryResponse.success) {
              const country = countryResponse.location;
              setSelectedCountry(country);
              await fetchPrefectures(country.id);
            }
          }
        } else if (location.type === 'country') {
          setSelectedCountry(location);
        }
      }
    } catch (err) {
      console.error('Failed to load selected location:', err);
    }
  };

  const handleCountryChange = (e) => {
    const countryValue = e.target.value;
    
    if (!countryValue) {
      setSelectedCountry(null);
      setSelectedPrefecture(null);
      setSelectedMunicipality(null);
      setPrefectures([]);
      setMunicipalities([]);
      onChange(null);
      return;
    }
    
    // Handle "International" selection
    if (countryValue === 'international') {
      const internationalOption = countries.find(c => c.id === 'international');
      setSelectedCountry(internationalOption);
      setSelectedPrefecture(null);
      setSelectedMunicipality(null);
      setPrefectures([]);
      setMunicipalities([]);
      onChange('international');
      return;
    }
    
    const country = countries.find(c => c.id === parseInt(countryValue));
    setSelectedCountry(country);
    setSelectedPrefecture(null);
    setSelectedMunicipality(null);
    setMunicipalities([]);
    
    // Load prefectures for Greece or other countries
    fetchPrefectures(country.id);
    
    // If country is selected but no prefecture/municipality, return country id
    onChange(country.id);
  };

  const handlePrefectureChange = (e) => {
    const prefectureValue = e.target.value;
    
    if (!prefectureValue) {
      setSelectedPrefecture(null);
      setSelectedMunicipality(null);
      setMunicipalities([]);
      // Return to country level
      onChange(selectedCountry?.id || null);
      return;
    }
    
    const prefecture = prefectures.find(p => p.id === parseInt(prefectureValue));
    setSelectedPrefecture(prefecture);
    setSelectedMunicipality(null);
    
    // Load municipalities
    fetchMunicipalities(prefecture.id);
    
    // Return prefecture id
    onChange(prefecture.id);
  };

  const handleMunicipalityChange = (e) => {
    const municipalityValue = e.target.value;
    
    if (!municipalityValue) {
      setSelectedMunicipality(null);
      // Return to prefecture level
      onChange(selectedPrefecture?.id || null);
      return;
    }
    
    const municipality = municipalities.find(m => m.id === parseInt(municipalityValue));
    setSelectedMunicipality(municipality);
    
    // Return municipality id
    onChange(municipality.id);
  };

  const handleClear = () => {
    setSelectedCountry(null);
    setSelectedPrefecture(null);
    setSelectedMunicipality(null);
    setPrefectures([]);
    setMunicipalities([]);
    onChange(null);
  };

  const isInternational = selectedCountry?.isInternational || selectedCountry?.id === 'international';

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      
      {/* Country Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country *
        </label>
        <div className="flex gap-2">
          <select
            value={selectedCountry?.id || ''}
            onChange={handleCountryChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading}
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
                {country.name_local && ` (${country.name_local})`}
              </option>
            ))}
          </select>
          {allowClear && selectedCountry && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
              aria-label="Clear selection"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Prefecture Dropdown - Only show if country is selected and not international */}
      {selectedCountry && !isInternational && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prefecture
          </label>
          <select
            value={selectedPrefecture?.id || ''}
            onChange={handlePrefectureChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading || prefectures.length === 0}
          >
            <option value="">Select a prefecture</option>
            {prefectures.map((prefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name}
                {prefecture.name_local && ` (${prefecture.name_local})`}
              </option>
            ))}
          </select>
          {prefectures.length === 0 && !loading && (
            <p className="mt-1 text-xs text-gray-500">No prefectures available</p>
          )}
        </div>
      )}

      {/* Municipality Dropdown - Only show if prefecture is selected */}
      {selectedPrefecture && !isInternational && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City/Municipality
          </label>
          <select
            value={selectedMunicipality?.id || ''}
            onChange={handleMunicipalityChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading || municipalities.length === 0}
          >
            <option value="">Select a city/municipality</option>
            {municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.id}>
                {municipality.name}
                {municipality.name_local && ` (${municipality.name_local})`}
              </option>
            ))}
          </select>
          {municipalities.length === 0 && !loading && (
            <p className="mt-1 text-xs text-gray-500">No municipalities available</p>
          )}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">Loading...</div>
      )}

      {/* Display selected location summary */}
      {selectedCountry && (
        <div className="text-sm text-gray-600">
          <strong>Selected:</strong>{' '}
          {selectedMunicipality ? (
            <>
              {selectedMunicipality.name}
              {selectedMunicipality.name_local && ` (${selectedMunicipality.name_local})`}
              {' → '}
              {selectedPrefecture.name}
              {' → '}
              {selectedCountry.name}
            </>
          ) : selectedPrefecture ? (
            <>
              {selectedPrefecture.name}
              {selectedPrefecture.name_local && ` (${selectedPrefecture.name_local})`}
              {' → '}
              {selectedCountry.name}
            </>
          ) : (
            selectedCountry.name
          )}
        </div>
      )}
    </div>
  );
}
