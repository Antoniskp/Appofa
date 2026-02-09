'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { locationAPI } from '@/lib/api';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import SkeletonLoader from '@/components/SkeletonLoader';
import { MagnifyingGlassIcon, MapPinIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';

const LOCATION_TYPE_ORDER = ['international', 'country', 'prefecture', 'municipality'];
const DEBOUNCE_DELAY = 300;

export default function LocationsPage() {
  const router = useRouter();
  
  // Dropdown states
  const [countries, setCountries] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Display states
  const [displayedLocations, setDisplayedLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Breadcrumb state
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Load countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch countries
  const fetchCountries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await locationAPI.getAll({ type: 'country' });
      if (response.success) {
        const sortedCountries = (response.locations || []).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setCountries(sortedCountries);
        
        // If no selections, show countries by default
        if (!selectedCountry && !searchTerm) {
          setDisplayedLocations(sortedCountries);
        }
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
      const response = await locationAPI.getAll({ 
        type: 'prefecture', 
        parent_id: countryId 
      });
      if (response.success) {
        const sortedPrefectures = (response.locations || []).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setPrefectures(sortedPrefectures);
        if (!searchTerm) {
          setDisplayedLocations(sortedPrefectures);
        }
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
      const response = await locationAPI.getAll({ 
        type: 'municipality', 
        parent_id: prefectureId 
      });
      if (response.success) {
        const sortedMunicipalities = (response.locations || []).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setMunicipalities(sortedMunicipalities);
        if (!searchTerm) {
          setDisplayedLocations(sortedMunicipalities);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load municipalities');
    } finally {
      setLoading(false);
    }
  };

  // Update breadcrumbs based on selections
  const updateBreadcrumbs = () => {
    const crumbs = [];
    
    if (selectedCountry) {
      const country = countries.find(c => c.id === parseInt(selectedCountry));
      if (country) {
        crumbs.push({ name: country.name, id: country.id, type: 'country' });
      }
    }
    
    if (selectedPrefecture) {
      const prefecture = prefectures.find(p => p.id === parseInt(selectedPrefecture));
      if (prefecture) {
        crumbs.push({ name: prefecture.name, id: prefecture.id, type: 'prefecture' });
      }
    }
    
    if (selectedMunicipality) {
      const municipality = municipalities.find(m => m.id === parseInt(selectedMunicipality));
      if (municipality) {
        crumbs.push({ name: municipality.name, id: municipality.id, type: 'municipality' });
      }
    }
    
    setBreadcrumbs(crumbs);
  };

  // Fetch prefectures when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchPrefectures(selectedCountry);
      updateBreadcrumbs();
    } else {
      setPrefectures([]);
      setSelectedPrefecture('');
      setSelectedMunicipality('');
      setMunicipalities([]);
      setBreadcrumbs([]);
      if (!searchTerm) {
        setDisplayedLocations(countries);
      }
    }
  }, [selectedCountry]);

  // Fetch municipalities when prefecture changes
  useEffect(() => {
    if (selectedPrefecture) {
      fetchMunicipalities(selectedPrefecture);
      updateBreadcrumbs();
    } else {
      setMunicipalities([]);
      setSelectedMunicipality('');
      if (selectedCountry && !searchTerm) {
        setDisplayedLocations(prefectures);
      }
    }
  }, [selectedPrefecture]);

  // Update displayed locations when municipality changes
  useEffect(() => {
    if (selectedMunicipality) {
      updateBreadcrumbs();
      // Show the selected municipality
      const municipality = municipalities.find(m => m.id === parseInt(selectedMunicipality));
      if (municipality && !searchTerm) {
        setDisplayedLocations([municipality]);
      }
    } else if (selectedPrefecture && !searchTerm) {
      setDisplayedLocations(municipalities);
    }
  }, [selectedMunicipality]);

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    try {
      const response = await locationAPI.getAll({ search: query, limit: 50 });
      if (response.success) {
        const results = response.locations || [];
        // Sort by type priority and then by name
        const sortedResults = results.sort((a, b) => {
          const typeOrder = LOCATION_TYPE_ORDER.indexOf(a.type) - LOCATION_TYPE_ORDER.indexOf(b.type);
          if (typeOrder !== 0) return typeOrder;
          return a.name.localeCompare(b.name);
        });
        setSearchResults(sortedResults);
        setDisplayedLocations(sortedResults);
        setShowSearchDropdown(true);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      // Reset to current dropdown selection
      if (selectedMunicipality) {
        const municipality = municipalities.find(m => m.id === parseInt(selectedMunicipality));
        if (municipality) setDisplayedLocations([municipality]);
      } else if (selectedPrefecture) {
        setDisplayedLocations(municipalities);
      } else if (selectedCountry) {
        setDisplayedLocations(prefectures);
      } else {
        setDisplayedLocations(countries);
      }
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCountryChange = (e) => {
    const value = e.target.value;
    setSelectedCountry(value);
    setSelectedPrefecture('');
    setSelectedMunicipality('');
    setSearchTerm('');
  };

  const handlePrefectureChange = (e) => {
    const value = e.target.value;
    setSelectedPrefecture(value);
    setSelectedMunicipality('');
    setSearchTerm('');
  };

  const handleMunicipalityChange = (e) => {
    const value = e.target.value;
    setSelectedMunicipality(value);
    setSearchTerm('');
  };

  const handleSearchSelect = (location) => {
    router.push(`/locations/${location.id}`);
  };

  const handleLocationClick = (location) => {
    router.push(`/locations/${location.id}`);
  };

  const handleClearAll = () => {
    setSelectedCountry('');
    setSelectedPrefecture('');
    setSelectedMunicipality('');
    setSearchTerm('');
    setPrefectures([]);
    setMunicipalities([]);
    setBreadcrumbs([]);
    setSearchResults([]);
    setDisplayedLocations(countries);
  };

  const getLocationHierarchy = (location) => {
    if (!location.parent) return location.name;
    
    const parts = [location.name];
    let current = location;
    
    while (current.parent) {
      parts.push(current.parent.name);
      current = current.parent;
    }
    
    return parts.reverse().join(' → ');
  };

  const getTypeLabel = (type) => {
    const labels = {
      international: 'International',
      country: 'Country',
      prefecture: 'Prefecture',
      municipality: 'Municipality'
    };
    return labels[type] || type;
  };

  const getTypeBadgeVariant = (type) => {
    const variants = {
      international: 'purple',
      country: 'primary',
      prefecture: 'success',
      municipality: 'info'
    };
    return variants[type] || 'default';
  };

  const hasActiveFilters = selectedCountry || selectedPrefecture || selectedMunicipality;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search + Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <SearchInput
                id="location-search"
                name="location-search"
                label="Αναζήτηση"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm && setShowSearchDropdown(true)}
                placeholder="Αναζήτηση τοποθεσιών..."
                loading={isSearching}
              />

              {/* Search Autocomplete Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {searchResults.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleSearchSelect(location)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors focus:outline-none focus:bg-blue-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">
                              {location.name}
                            </span>
                            {location.name_local && (
                              <span className="text-sm text-gray-500 truncate">
                                ({location.name_local})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <span className="truncate">{getLocationHierarchy(location)}</span>
                          </div>
                        </div>
                        <Badge variant={getTypeBadgeVariant(location.type)} size="sm">
                          {getTypeLabel(location.type)}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Country Dropdown */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                id="country"
                value={selectedCountry}
                onChange={handleCountryChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                    {country.name_local ? ` (${country.name_local})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Prefecture Dropdown */}
            {selectedCountry && (
              <div>
                <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
                  Prefecture / Region
                </label>
                <select
                  id="prefecture"
                  value={selectedPrefecture}
                  onChange={handlePrefectureChange}
                  disabled={prefectures.length === 0}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  <option value="">All Prefectures</option>
                  {prefectures.map((prefecture) => (
                    <option key={prefecture.id} value={prefecture.id}>
                      {prefecture.name}
                      {prefecture.name_local ? ` (${prefecture.name_local})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Municipality Dropdown */}
            {selectedPrefecture && (
              <div>
                <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-2">
                  City / Municipality
                </label>
                <select
                  id="municipality"
                  value={selectedMunicipality}
                  onChange={handleMunicipalityChange}
                  disabled={municipalities.length === 0}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  <option value="">All Municipalities</option>
                  {municipalities.map((municipality) => (
                    <option key={municipality.id} value={municipality.id}>
                      {municipality.name}
                      {municipality.name_local ? ` (${municipality.name_local})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && !searchTerm && (
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <button
                  onClick={handleClearAll}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  All Locations
                </button>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.id} className="flex items-center space-x-2">
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  <span className={index === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : "text-gray-600"}>
                    {crumb.name}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Results Section */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchTerm ? 'Search Results' : breadcrumbs.length > 0 ? `Locations in ${breadcrumbs[breadcrumbs.length - 1].name}` : 'All Countries'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({displayedLocations.length} {displayedLocations.length === 1 ? 'location' : 'locations'})
              </span>
            </h2>
          </div>

          <div className="p-6">
            {loading && (
              <SkeletonLoader type="card" count={6} variant="grid" />
            )}

            {error && (
              <EmptyState
                type="error"
                title="Error Loading Locations"
                description={error}
                action={{
                  text: 'Try Again',
                  onClick: () => window.location.reload()
                }}
              />
            )}

            {!loading && !error && displayedLocations.length === 0 && (
              <EmptyState
                type="empty"
                title="No Locations Found"
                description={searchTerm ? "Try adjusting your search term" : "No locations available at this level"}
              />
            )}

            {!loading && !error && displayedLocations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleLocationClick(location)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate mb-1">
                          {location.name}
                        </h3>
                        {location.name_local && (
                          <p className="text-sm text-gray-500 truncate">
                            {location.name_local}
                          </p>
                        )}
                      </div>
                      <Badge variant={getTypeBadgeVariant(location.type)} size="sm">
                        {getTypeLabel(location.type)}
                      </Badge>
                    </div>

                    {location.parent && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                        <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{location.parent.name}</span>
                      </div>
                    )}

                    {location.code && (
                      <div className="mt-2 text-xs text-gray-400">
                        Code: {location.code}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
