'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MAP_ISSUE_TYPE_COLORS } from '@/lib/constants/mapIssues';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-lg bg-gray-100" role="status">Φόρτωση χάρτη…</div>,
});

const ISSUE_LABELS = {
  pothole: 'Λακκούβα', neglected_building: 'Εγκαταλελειμμένο κτίριο',
  broken_lighting: 'Βλάβη φωτισμού', sidewalk_access: 'Πρόσβαση στο πεζοδρόμιο',
  trash: 'Απορρίμματα', unsafe_crossing: 'Επικίνδυνη διάβαση', flooding: 'Πλημμύρα',
  illegal_dumping: 'Παράνομη απόρριψη απορριμμάτων', graffiti_vandalism: 'Γκράφιτι / βανδαλισμός',
  abandoned_vehicle: 'Εγκαταλελειμμένο όχημα', noise: 'Θόρυβος', other: 'Άλλο',
};

function coordinate(value, limit) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

export default function SuggestionLocation({ suggestion }) {
  const lat = coordinate(suggestion.mapLat, 90);
  const lng = coordinate(suggestion.mapLng, 180);
  const hasPin = lat !== null && lng !== null;
  const location = suggestion.location;
  if (!hasPin && !location) return null;

  return (
    <section aria-label="Τοποθεσία αναφοράς" className="mt-6 space-y-3 border-t border-gray-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900">Τοποθεσία αναφοράς</h2>
        {hasPin && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{ISSUE_LABELS[suggestion.mapIssueType] || ISSUE_LABELS.other}</span>}
      </div>
      {location?.slug ? (
        <Link href={`/locations/${encodeURIComponent(location.slug)}`} className="inline-block text-sm font-medium text-blue-700 hover:underline">
          {location.name} — Σελίδα τοποθεσίας
        </Link>
      ) : location && <p className="text-sm text-gray-600">{location.name}</p>}
      {hasPin ? (
        <>
          <BaseMap
            key={`${lat},${lng}`}
            center={[lat, lng]}
            zoom={17}
            markers={[{ lat, lng, iconColor: MAP_ISSUE_TYPE_COLORS[suggestion.mapIssueType] || MAP_ISSUE_TYPE_COLORS.other }]}
            className="h-72 w-full rounded-lg overflow-hidden"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-gray-500">Σημείο αναφοράς: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 hover:underline">
              Οδηγίες διαδρομής ↗
            </a>
          </div>
        </>
      ) : <p className="text-sm text-gray-500">Δεν έχει οριστεί ακριβές σημείο στον χάρτη για αυτή την αναφορά.</p>}
    </section>
  );
}
