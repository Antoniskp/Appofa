'use client';

import { useEffect, useState } from 'react';
import { locationAPI } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import SkeletonLoader from '@/components/SkeletonLoader';

const LOCATION_TYPE_LABELS = {
  international: 'Διεθνές',
  country: 'Χώρα',
  prefecture: 'Περιφέρεια',
  municipality: 'Δήμος'
};

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    let isActive = true;

    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (typeFilter) {
          params.type = typeFilter;
        }
        if (searchFilter) {
          params.search = searchFilter;
        }
        const response = await locationAPI.getAll(params);
        if (response.success && isActive) {
          setLocations(response.data || []);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Failed to load locations.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchLocations();

    return () => {
      isActive = false;
    };
  }, [typeFilter, searchFilter]);

  const filterInputClassName = 'w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Τοποθεσίες</h1>
            <p className="text-gray-600">Εξερευνήστε τις διαθέσιμες γεωγραφικές τοποθεσίες.</p>
          </div>
          {!loading && !error && (
            <span className="text-sm text-gray-500">
              {locations.length} αποτελέσματα
            </span>
          )}
        </div>

        <div className="card p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Αναζήτηση
              </label>
              <input
                id="search"
                name="search"
                type="text"
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                placeholder="Αναζήτηση τοποθεσίας..."
                className={filterInputClassName}
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Τύπος
              </label>
              <select
                id="type"
                name="type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className={filterInputClassName}
              >
                <option value="">Όλοι οι τύποι</option>
                {Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader count={6} variant="grid" />
          </div>
        )}

        {error && (
          <EmptyState
            type="error"
            title="Αποτυχία φόρτωσης τοποθεσιών"
            description={error}
            action={{
              text: 'Δοκιμάστε ξανά',
              onClick: () => window.location.reload()
            }}
          />
        )}

        {!loading && !error && locations.length === 0 && (
          <EmptyState
            type="empty"
            title="Δεν βρέθηκαν τοποθεσίες"
            description="Δεν υπάρχουν διαθέσιμες τοποθεσίες με τα τρέχοντα φίλτρα."
          />
        )}

        {!loading && !error && locations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div key={location.id} className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {location.name}
                      {location.name_local && (
                        <span className="text-sm text-gray-500"> ({location.name_local})</span>
                      )}
                    </h2>
                    {location.parent && (
                      <p className="text-sm text-gray-600 mt-1">
                        Γονέας: {location.parent.name}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {LOCATION_TYPE_LABELS[location.type] || location.type}
                  </span>
                </div>
                {location.code && (
                  <p className="text-sm text-gray-500 mt-3">
                    Κωδικός: {location.code}
                  </p>
                )}
                {location.slug && (
                  <p className="text-xs text-gray-400 mt-2">/{location.slug}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
