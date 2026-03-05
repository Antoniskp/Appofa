'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { locationAPI, locationRequestAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import SkeletonLoader from '@/components/SkeletonLoader';
import Modal from '@/components/Modal';
import { MagnifyingGlassIcon, MapPinIcon, ChevronRightIcon, UserGroupIcon, ExclamationTriangleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';

const LOCATION_TYPE_ORDER = ['international', 'country', 'prefecture', 'municipality'];
const DEBOUNCE_DELAY = 300;

export default function LocationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Dropdown states
  const [countries, setCountries] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');

  // Track whether the user has explicitly chosen a country (prevents default from overriding)
  const userHasSelectedCountry = useRef(false);
  
  // Filter for locations needing moderators
  const [showNeedsModerators, setShowNeedsModerators] = useState(false);
  
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

  // Country request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ countryName: '', countryNameLocal: '', notes: '' });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

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
        
        // Apply default country selection if user hasn't explicitly chosen one
        if (!userHasSelectedCountry.current && !searchTerm) {
          await applyDefaultCountry(sortedCountries);
        } else if (!selectedCountry && !searchTerm) {
          setDisplayedLocations(sortedCountries);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  // Determine and apply the default country:
  // 1. If authenticated user has homeLocationId, resolve to country
  // 2. Otherwise default to Greece
  const applyDefaultCountry = async (countryList) => {
    // Don't override if user already picked something
    if (userHasSelectedCountry.current) return;

    if (user && user.homeLocationId) {
      try {
        const res = await locationAPI.getById(user.homeLocationId);
        if (res.success && res.location) {
          // Walk up the parent chain to find the country
          let loc = res.location;
          while (loc && loc.type !== 'country') {
            if (loc.parent) {
              loc = loc.parent;
            } else if (loc.parent_id) {
              const parentRes = await locationAPI.getById(loc.parent_id);
              loc = parentRes.success ? parentRes.location : null;
            } else {
              loc = null;
            }
          }
          if (loc && loc.type === 'country') {
            const match = countryList.find(c => c.id === loc.id);
            if (match && !userHasSelectedCountry.current) {
              setSelectedCountry(String(match.id));
              return;
            }
          }
        }
      } catch (err) {
        // Fall through to Greece default
      }
    }

    // Default to Greece (try code 'GR' first, then name match)
    if (!userHasSelectedCountry.current) {
      const greece =
        countryList.find(c => c.code && c.code.toUpperCase() === 'GR') ||
        countryList.find(c => c.name.toLowerCase() === 'greece');
      if (greece) {
        setSelectedCountry(String(greece.id));
        return;
      }
    }

    // No default found – show all countries
    setDisplayedLocations(countryList);
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
    userHasSelectedCountry.current = true;
    setSelectedCountry(value);
    setSelectedPrefecture('');
    setSelectedMunicipality('');
    setSearchTerm('');
  };

  const handleClearCountry = () => {
    userHasSelectedCountry.current = true;
    setSelectedCountry('');
    setSelectedPrefecture('');
    setSelectedMunicipality('');
    setPrefectures([]);
    setMunicipalities([]);
    setBreadcrumbs([]);
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
    router.push(`/locations/${location.slug || location.id}`);
  };

  const handleLocationClick = (location) => {
    router.push(`/locations/${location.slug || location.id}`);
  };

  const handleClearAll = () => {
    userHasSelectedCountry.current = true;
    setSelectedCountry('');
    setSelectedPrefecture('');
    setSelectedMunicipality('');
    setSearchTerm('');
    setShowNeedsModerators(false);
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

  const needsModerator = (location) => {
    return !location.hasModerator;
  };

  const getModeratorDisplayName = (location) => {
    const moderator = location?.moderatorPreview;
    if (!moderator) {
      return '';
    }

    const fullName = [moderator.firstName, moderator.lastName].filter(Boolean).join(' ').trim();
    return fullName || moderator.username || '';
  };

  const hasActiveFilters = selectedCountry || selectedPrefecture || selectedMunicipality || showNeedsModerators;

  const selectedCountryName = selectedCountry
    ? (countries.find(c => c.id === parseInt(selectedCountry))?.name || '')
    : '';

  const getResultsHeading = () => {
    if (searchTerm) return 'Search Results';
    if (breadcrumbs.length > 0) return `Locations in ${breadcrumbs[breadcrumbs.length - 1].name}`;
    if (selectedCountryName) return `Locations in ${selectedCountryName}`;
    return 'All Countries';
  };

  const handleRequestFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.countryName.trim()) return;
    setRequestSubmitting(true);
    setRequestError('');
    try {
      const res = await locationRequestAPI.create({
        countryName: requestForm.countryName.trim(),
        countryNameLocal: requestForm.countryNameLocal.trim() || undefined,
        notes: requestForm.notes.trim() || undefined,
      });
      if (res.success) {
        setRequestSuccess(true);
        setRequestForm({ countryName: '', countryNameLocal: '', notes: '' });
      } else {
        setRequestError(res.message || 'Failed to submit request');
      }
    } catch (err) {
      setRequestError(err.message || 'Failed to submit request');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setRequestSuccess(false);
    setRequestError('');
    setRequestForm({ countryName: '', countryNameLocal: '', notes: '' });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search + Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                {selectedCountry && (
                  <button
                    onClick={handleClearCountry}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                    aria-label="Show all countries"
                  >
                    <GlobeAltIcon className="w-3.5 h-3.5" />
                    All countries
                  </button>
                )}
              </div>
              <select
                id="country"
                value={selectedCountry}
                onChange={handleCountryChange}
                className="w-full h-10 px-4 py-2 border rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 border-gray-300 transition-colors"
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
                <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-1">
                  Prefecture / Region
                </label>
                <select
                  id="prefecture"
                  value={selectedPrefecture}
                  onChange={handlePrefectureChange}
                  disabled={prefectures.length === 0}
                  className="w-full h-10 px-4 py-2 border rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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
                <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
                  City / Municipality
                </label>
                <select
                  id="municipality"
                  value={selectedMunicipality}
                  onChange={handleMunicipalityChange}
                  disabled={municipalities.length === 0}
                  className="w-full h-10 px-4 py-2 border rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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

          {/* Moderator Filter Checkbox */}
          <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="needsModerators"
              checked={showNeedsModerators}
              onChange={(e) => setShowNeedsModerators(e.target.checked)}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <label htmlFor="needsModerators" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
              <span>Εμφάνιση μόνο περιοχών που χρειάζονται συντονιστές</span>
            </label>
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {getResultsHeading()}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({displayedLocations.length} {displayedLocations.length === 1 ? 'location' : 'locations'})
              </span>
            </h2>
            {!selectedCountry && !searchTerm && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <GlobeAltIcon className="w-4 h-4" />
                <span>Can&apos;t find your country? <span className="underline">Request it</span></span>
              </button>
            )}
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
              <div>
                <EmptyState
                  type="empty"
                  title="No Locations Found"
                  description={searchTerm ? "Try adjusting your search term" : "No locations available at this level"}
                />
                {!selectedCountry && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 text-sm font-medium transition-colors"
                    >
                      <GlobeAltIcon className="w-4 h-4" />
                      Request your country
                    </button>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && displayedLocations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedLocations
                  .filter(location => !showNeedsModerators || needsModerator(location))
                  .map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleLocationClick(location)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
                  >
                    {/* Moderator Status Badge */}
                    {needsModerator(location) && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-300">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Χρειάζεται Συντονιστή
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-3 mb-2 mt-6">
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
                    
                    {!needsModerator(location) && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                        <UserGroupIcon className="h-3 w-3 flex-shrink-0" />
                        <span>Έχει Συντονιστή</span>
                        {location.moderatorPreview && (
                          <div className="ml-1 inline-flex items-center gap-2 min-w-0">
                            <div
                              className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-semibold text-white border border-green-200 bg-slate-500 flex-shrink-0"
                              style={{ backgroundColor: location.moderatorPreview.avatarColor || '#64748b' }}
                              aria-label="Moderator avatar"
                            >
                              {location.moderatorPreview.avatar ? (
                                <img
                                  src={location.moderatorPreview.avatar}
                                  alt={getModeratorDisplayName(location) || 'Moderator'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (location.moderatorPreview.username?.[0] || '?').toUpperCase()
                              )}
                            </div>
                            <span className="truncate text-gray-700 font-medium max-w-[140px]">
                              {getModeratorDisplayName(location)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Subtle CTA below results when in All Countries view */}
            {!loading && !error && !selectedCountry && !searchTerm && displayedLocations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors underline"
                >
                  Don&apos;t see your country? Request it to be added.
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Country Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={handleCloseRequestModal}
        title="Request a Country"
        size="md"
      >
        {requestSuccess ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <GlobeAltIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Request submitted!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Thank you! Our team will review your request and add the country if approved.
            </p>
            <button
              onClick={handleCloseRequestModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              If your country is not listed, you can request it to be added. Our moderators will review your request.
            </p>

            {requestError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {requestError}
              </div>
            )}

            <div>
              <label htmlFor="req-countryName" className="block text-sm font-medium text-gray-700 mb-1">
                Country name in English <span className="text-red-500">*</span>
              </label>
              <input
                id="req-countryName"
                name="countryName"
                type="text"
                value={requestForm.countryName}
                onChange={handleRequestFormChange}
                required
                maxLength={100}
                placeholder="e.g. Albania"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="req-countryNameLocal" className="block text-sm font-medium text-gray-700 mb-1">
                Local name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                id="req-countryNameLocal"
                name="countryNameLocal"
                type="text"
                value={requestForm.countryNameLocal}
                onChange={handleRequestFormChange}
                maxLength={100}
                placeholder="e.g. Shqipëria"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="req-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional notes <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea
                id="req-notes"
                name="notes"
                value={requestForm.notes}
                onChange={handleRequestFormChange}
                maxLength={500}
                rows={3}
                placeholder="Any additional context..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseRequestModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={requestSubmitting || !requestForm.countryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestSubmitting ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
