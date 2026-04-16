'use client';

import Link from 'next/link';

const TYPE_LABELS = {
  country: 'Χώρα',
  prefecture: 'Νομός / Περιφέρεια',
  municipality: 'Δήμος',
  international: 'Διεθνής',
};

const TYPE_COLORS = {
  country: 'bg-blue-100 text-blue-700',
  prefecture: 'bg-green-100 text-green-700',
  municipality: 'bg-purple-100 text-purple-700',
  international: 'bg-gray-100 text-gray-700',
};

/**
 * LocationCard — displays a location summary for homepage / discovery use.
 * @param {{ location: { id: number, name: string, name_local?: string, type: string, slug?: string, parent?: { name: string } } }} props
 */
export default function LocationCard({ location }) {
  return (
    <Link
      href={`/locations/${location.slug || location.id}`}
      className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl" aria-hidden="true">📍</span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[location.type] || 'bg-gray-100 text-gray-700'}`}
        >
          {TYPE_LABELS[location.type] || location.type}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
        {location.name}
      </h3>
      {location.name_local && (
        <p className="text-sm text-gray-500">{location.name_local}</p>
      )}
      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {location.parent?.name || ''}
        </span>
        <span className="text-xs text-blue-600 font-medium group-hover:underline">
          Εξερεύνηση →
        </span>
      </div>
    </Link>
  );
}
