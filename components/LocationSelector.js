'use client';

import { useState, useEffect } from 'react';

/**
 * LocationSelector Component
 * Provides hierarchical location selection with three dependent dropdowns:
 * - Country
 * - Jurisdiction (filtered by selected country)
 * - Municipality (filtered by selected jurisdiction)
 * 
 * Also includes a free-text location list field for future map integration.
 */
export default function LocationSelector({ 
  selectedLocationId, 
  onLocationChange,
  showUseUserLocation = false,
  useUserLocation = false,
  onUseUserLocationChange = null
}) {
  const [countries, setCountries] = useState([]);
  const [jurisdictions, setJurisdictions] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  useEffect(() => {
    if (!selectedLocationId || typeof selectedLocationId !== 'string') {
      if (selectedCountry) {
        setSelectedCountry('');
      }
      if (selectedJurisdiction) {
        setSelectedJurisdiction('');
      }
      if (selectedMunicipality) {
        setSelectedMunicipality('');
      }
      return;
    }

    const parts = selectedLocationId.split('-');
    const countryCode = parts[0] || '';
    const jurisdictionCode = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : '';
    const municipalityCode = parts.length >= 3 ? selectedLocationId : '';

    if (countryCode && selectedCountry !== countryCode) {
      setSelectedCountry(countryCode);
    } else if (!countryCode && selectedCountry) {
      setSelectedCountry('');
    }

    const jurisdictionReady =
      jurisdictionCode && jurisdictions.some((jurisdiction) => jurisdiction.id === jurisdictionCode);
    if (jurisdictionCode && jurisdictionReady && selectedJurisdiction !== jurisdictionCode) {
      setSelectedJurisdiction(jurisdictionCode);
    } else if (!jurisdictionCode && selectedJurisdiction) {
      setSelectedJurisdiction('');
    }

    const municipalityReady =
      municipalityCode && municipalities.some((municipality) => municipality.id === municipalityCode);
    if (municipalityCode && municipalityReady && selectedMunicipality !== municipalityCode) {
      setSelectedMunicipality(municipalityCode);
    } else if (!municipalityCode && selectedMunicipality) {
      setSelectedMunicipality('');
    }
  }, [
    selectedLocationId,
    selectedCountry,
    selectedJurisdiction,
    selectedMunicipality,
    jurisdictions,
    municipalities
  ]);

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch countries
  const fetchCountries = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/locations/countries`);
      if (!response.ok) {
        throw new Error('Unexpected response from server.');
      }
      const data = await response.json();
      if (data.success) {
        setCountries(data.data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      setError('Αποτυχία φόρτωσης χωρών');
    }
  };

  // Fetch jurisdictions when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchJurisdictions(selectedCountry);
    } else {
      setJurisdictions([]);
      setSelectedJurisdiction('');
    }
  }, [selectedCountry]);

  const fetchJurisdictions = async (countryId) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/locations/countries/${countryId}/jurisdictions`);
      if (!response.ok) {
        throw new Error('Unexpected response from server.');
      }
      const data = await response.json();
      if (data.success) {
        setJurisdictions(data.data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch jurisdictions:', error);
      setError('Αποτυχία φόρτωσης περιφερειών');
    } finally {
      setLoading(false);
    }
  };

  // Fetch municipalities when jurisdiction changes
  useEffect(() => {
    if (selectedJurisdiction) {
      fetchMunicipalities(selectedJurisdiction);
    } else {
      setMunicipalities([]);
      setSelectedMunicipality('');
    }
  }, [selectedJurisdiction]);

  const fetchMunicipalities = async (jurisdictionId) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/locations/jurisdictions/${jurisdictionId}/municipalities`);
      if (!response.ok) {
        throw new Error('Unexpected response from server.');
      }
      const data = await response.json();
      if (data.success) {
        setMunicipalities(data.data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch municipalities:', error);
      setError('Αποτυχία φόρτωσης δήμων');
    } finally {
      setLoading(false);
    }
  };

  // Handle country selection
  const handleCountryChange = (e) => {
    const value = e.target.value;
    setSelectedCountry(value);
    setSelectedJurisdiction('');
    setSelectedMunicipality('');
    
    // Always set country as location when selected - more specific selections will override
    if (value && onLocationChange) {
      onLocationChange(value);
    } else if (!value && onLocationChange) {
      onLocationChange(null);
    }
  };

  // Handle jurisdiction selection
  const handleJurisdictionChange = (e) => {
    const value = e.target.value;
    setSelectedJurisdiction(value);
    setSelectedMunicipality('');
    
    // Set jurisdiction as location
    if (value && onLocationChange) {
      onLocationChange(value);
    }
  };

  // Handle municipality selection
  const handleMunicipalityChange = (e) => {
    const value = e.target.value;
    setSelectedMunicipality(value);
    
    // Set municipality as location (most specific)
    if (value && onLocationChange) {
      onLocationChange(value);
    }
  };

  // Handle location notes change
  const handleLocationNotesChange = (e) => {
    setLocationNotes(e.target.value);
  };

  return (
    <div className="space-y-4">
      {/* Use User Location Checkbox (for articles) */}
      {showUseUserLocation && onUseUserLocationChange && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="useUserLocation"
            checked={useUserLocation}
            onChange={(e) => onUseUserLocationChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
            <label htmlFor="useUserLocation" className="ml-2 block text-sm text-gray-700">
            Χρήση της τοποθεσίας μου (από το προφίλ)
            </label>
          </div>
        )}

      {/* Only show dropdowns if not using user location */}
      {(!showUseUserLocation || !useUserLocation) && (
        <>
          {/* Country Dropdown */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Χώρα
            </label>
            <select
              id="country"
              value={selectedCountry}
              onChange={handleCountryChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Επιλέξτε χώρα</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Jurisdiction Dropdown (only show if country is selected) */}
          {selectedCountry && (
            <div>
              <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                Περιφέρεια / Περιοχή
              </label>
              <select
                id="jurisdiction"
                value={selectedJurisdiction}
                onChange={handleJurisdictionChange}
                disabled={loading || jurisdictions.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loading ? 'Φόρτωση...' : jurisdictions.length === 0 ? 'Δεν υπάρχουν διαθέσιμες περιφέρειες' : 'Επιλέξτε περιφέρεια'}
                </option>
                {jurisdictions.map((jurisdiction) => (
                  <option key={jurisdiction.id} value={jurisdiction.id}>
                    {jurisdiction.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Municipality Dropdown (only show if jurisdiction is selected) */}
          {selectedJurisdiction && (
            <div>
              <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
                Δήμος / Πόλη
              </label>
              <select
                id="municipality"
                value={selectedMunicipality}
                onChange={handleMunicipalityChange}
                disabled={loading || municipalities.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loading ? 'Φόρτωση...' : municipalities.length === 0 ? 'Δεν υπάρχουν διαθέσιμοι δήμοι' : 'Επιλέξτε δήμο'}
                </option>
                {municipalities.map((municipality) => (
                  <option key={municipality.id} value={municipality.id}>
                    {municipality.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location Notes (placeholder for future map integration) */}
          <div>
            <label htmlFor="locationNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Επιπλέον στοιχεία τοποθεσίας (Προαιρετικό)
            </label>
            <input
              type="text"
              id="locationNotes"
              value={locationNotes}
              onChange={handleLocationNotesChange}
              placeholder="π.χ. διεύθυνση, σημείο αναφοράς ή συντεταγμένες"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Αυτό το πεδίο προορίζεται για μελλοντική χρήση και δεν επηρεάζει την επιλογή τοποθεσίας.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
