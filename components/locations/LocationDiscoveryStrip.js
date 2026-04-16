'use client';

import Link from 'next/link';

/**
 * LocationDiscoveryStrip — horizontal scrollable chip row of locations.
 * Non-critical: returns null when empty and not loading.
 * @param {{ locations: Array, loading: boolean }} props
 */
export default function LocationDiscoveryStrip({ locations = [], loading = false }) {
  if (!loading && locations.length === 0) return null;

  return (
    <section className="bg-white border-b border-gray-100" aria-label="Εξερεύνησε Περιοχές">
      <div className="app-container py-4">
        <p className="text-sm font-semibold text-gray-600 mb-2">📍 Εξερεύνησε Περιοχές:</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-24 bg-gray-200 animate-pulse rounded-full flex-shrink-0"
                  aria-hidden="true"
                />
              ))
            : locations.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/locations/${loc.slug || loc.id}`}
                  className="flex-shrink-0 px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap"
                >
                  {loc.name}
                </Link>
              ))}
          <Link
            href="/locations"
            className="flex-shrink-0 px-4 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            Δείτε όλες →
          </Link>
        </div>
      </div>
    </section>
  );
}
