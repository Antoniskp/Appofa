import { useState } from 'react';
import Link from 'next/link';
import { PencilIcon } from '@heroicons/react/24/outline';

const TYPE_LABELS = { country: 'Χώρα', prefecture: 'Νομός / Περιφέρεια', municipality: 'Δήμος', electoral_district: 'Εκλογική περιφέρεια', international: 'Διεθνές' };

export default function LocationHeader({ location, imageError, setImageError, canManageLocations, onEdit }) {
  const [shareState, setShareState] = useState('');
  const name = location.name_local || location.name;
  const population = location.population_override ?? location.population;
  const image = location.imageUrl
    ? location.imageUrl + (location.imageUpdatedAt ? '?v=' + new Date(location.imageUpdatedAt).getTime() : '')
    : location.wikipedia_image_url;
  const share = async () => {
    try {
      const url = window.location.origin + '/locations/' + (location.slug || location.id);
      if (navigator.share) await navigator.share({ title: name, url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setShareState('Ο σύνδεσμος αντιγράφηκε'); }
      else setShareState('Η κοινοποίηση δεν υποστηρίζεται');
    } catch (error) { if (error.name !== 'AbortError') setShareState('Αδυναμία κοινοποίησης'); }
  };
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {image && !imageError && <img src={image} alt={name} className="h-16 w-16 rounded-lg object-cover shrink-0" onError={() => setImageError(true)} />}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 break-words">{name}</h1>
            {canManageLocations() && <button type="button" onClick={onEdit} aria-label="Επεξεργασία τοποθεσίας" className="p-2 text-gray-500 hover:text-gray-900"><PencilIcon className="h-4 w-4" /></button>}
          </div>
          <p className="mt-2 text-sm text-gray-500">{TYPE_LABELS[location.type] || 'Περιοχή'}{population != null && ' · ' + new Intl.NumberFormat('el-GR').format(population) + ' κάτοικοι'}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <Link href={'/suggestions/new?locationId=' + location.id} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Κάνε πρόταση</Link>
        <button type="button" onClick={share} className="text-sm text-gray-600 hover:text-gray-950">Κοινοποίηση</button>
        {shareState && <span role="status" className="text-xs text-gray-500">{shareState}</span>}
      </div>
    </div>
  );
}
