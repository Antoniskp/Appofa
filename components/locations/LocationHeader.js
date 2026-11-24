import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MapPinIcon, PencilIcon } from '@heroicons/react/24/outline';
import ExpandablePhoto from '@/components/ui/ExpandablePhoto';
import { TIKTOK_CREATOR_LOCATION_TYPES } from '@/config/tiktokCreators';

const TYPE_LABELS = { country: 'Χώρα', prefecture: 'Νομός / Περιφέρεια', municipality: 'Δήμος', electoral_district: 'Εκλογική περιφέρεια', international: 'Διεθνές' };

export default function LocationHeader({ location, imageError, setImageError, canManageLocations, onEdit }) {
  const t = useTranslations('locationImprovements');
  const tCreators = useTranslations('tiktokCreators');
  const [shareState, setShareState] = useState('');
  const name = location.name_local || location.name;
  const population = location.population_override ?? location.population;
  const preliminaryGreekCensus = location.type === 'country' && (location.code === 'GR' || location.slug === 'greece') && Number(population) === 10432481;
  const image = location.imageUrl
    ? location.imageUrl + (location.imageUpdatedAt ? '?v=' + new Date(location.imageUpdatedAt).getTime() : '')
    : location.wikipedia_image_url;
  const share = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) await navigator.share({ title: name, url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setShareState('Ο σύνδεσμος αντιγράφηκε'); }
      else setShareState('Η κοινοποίηση δεν υποστηρίζεται');
    } catch (error) { if (error.name !== 'AbortError') setShareState('Αδυναμία κοινοποίησης'); }
  };
  return (
    <>
    <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {image && !imageError && (
          <ExpandablePhoto src={image} name={name} className="rounded-2xl">
            <Image
              src={image}
              alt={name}
              width={192}
              height={192}
              // Uploaded photos are already processed by the backend.
              unoptimized={Boolean(location.imageUrl)}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover"
              onError={() => setImageError(true)}
            />
          </ExpandablePhoto>
        )}
        {(!image || imageError) && <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-100/70 text-blue-700"><MapPinIcon className="h-9 w-9" aria-hidden="true" /></div>}
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">Η τοπική σου κοινότητα</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-950 break-words">{name}</h1>
            {canManageLocations() && <button type="button" onClick={onEdit} aria-label="Επεξεργασία τοποθεσίας" className="p-2 text-gray-500 hover:text-gray-900"><PencilIcon className="h-4 w-4" /></button>}
          </div>
          <p className="mt-2 text-sm text-gray-500">{TYPE_LABELS[location.type] || 'Περιοχή'}{population != null && ' · ' + new Intl.NumberFormat('el-GR').format(population) + ' κάτοικοι'}</p>
          {population != null && <p className="mt-1 text-xs text-gray-600">
            {preliminaryGreekCensus ? (
              <a className="underline" href="https://www.statistics.gr/documents/20181/17938086/APOTELESMATA_APOGRAFI_PLITHISMOU_IG.pdf/e557d7d8-e49b-f84f-ec98-192cb963e34e">ΕΛΣΤΑΤ · Απογραφή 2021 (προσωρινά στοιχεία)</a>
            ) : location.population_override != null ? (
              <>{location.populationReview?.sourceUrl
                ? <a className="underline" href={location.populationReview.sourceUrl}>Πηγή πληθυσμού</a>
                : 'Καταχώριση στην Απόφαση'}
                {location.populationReview?.reviewedAt && ` · Έλεγχος ${new Date(location.populationReview.reviewedAt).toLocaleDateString('el-GR')}`}</>
            ) : location.wikipedia_url ? (
              <><a className="underline" href={location.wikipedia_url}>Wikipedia</a>
                {location.wikipedia_data_updated_at && ` · Ανάκτηση ${new Date(location.wikipedia_data_updated_at).toLocaleDateString('el-GR')}`}</>
            ) : 'Χωρίς καταγεγραμμένη πηγή'}
          </p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        {TIKTOK_CREATOR_LOCATION_TYPES.includes(location.type) && <Link href={`/creators?locationId=${location.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">{tCreators('title')}</Link>}
        <Link href={`/locations/${location.slug || location.id}/improve`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><PencilIcon className="h-4 w-4" aria-hidden="true" />{t('improve')}</Link>
        <Link href={'/suggestions/new?locationId=' + location.id} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Κάνε πρόταση</Link>
        <button type="button" onClick={share} className="text-sm text-gray-600 hover:text-gray-950">Κοινοποίηση</button>
        {shareState && <span role="status" className="text-xs text-gray-500">{shareState}</span>}
      </div>
    </div>
    {location.description && (
      <details className="mt-5 border-t border-blue-100 pt-3"><summary className="cursor-pointer py-2 text-sm font-medium text-gray-600">Γνώρισε την περιοχή</summary><p className="mt-5 max-w-3xl whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">{location.description}</p></details>
    )}
    </>
  );
}
