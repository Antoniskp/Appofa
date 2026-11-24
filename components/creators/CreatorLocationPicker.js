'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { locationAPI } from '@/lib/api/locations';
import { useAsyncData } from '@/hooks/useAsyncData';
import { TIKTOK_CREATOR_LOCATION_TYPES } from '@/config/tiktokCreators';

function getLocationPath(location) {
  const path = [];
  for (let current = location; current; current = current.parent) {
    if (TIKTOK_CREATOR_LOCATION_TYPES.includes(current.type)) path.unshift(current);
  }
  return path;
}

export default function CreatorLocationPicker({ value, onChange, label, rootLabel }) {
  const t = useTranslations('tiktokCreators');
  const locale = useLocale();
  const id = useId();
  const [selection, setSelection] = useState(null);
  const { data, loading, error, refetch } = useAsyncData(async () => {
    if (!value || selection?.at(-1)?.id === value) return { value, path: selection || [] };
    const result = await locationAPI.getById(value);
    return { value, path: getLocationPath(result.location) };
  }, [value, selection]);

  const path = value ? (selection?.at(-1)?.id === value ? selection : data?.value === value ? data.path : []) : [];
  const current = path.at(-1);
  const resolving = Boolean(value && !current && loading);
  const { data: options, loading: loadingOptions, error: optionsError, refetch: retryOptions } = useAsyncData(async () => {
    if (resolving || current?.type === 'municipality') return null;
    const scope = current ? { parent_id: current.id } : { type: 'country' };
    const { locations } = await locationAPI.getAll({ ...scope, limit: 300 });
    return { parentId: current?.id, locations: locations.filter(location => TIKTOK_CREATOR_LOCATION_TYPES.includes(location.type)) };
  }, [current?.id, current?.type, resolving]);

  const locationName = (location) => (locale === 'el' && location.name_local) || location.name;
  const selectPath = (nextPath) => {
    setSelection(nextPath);
    onChange(nextPath.at(-1)?.id ?? null);
  };
  const children = options?.parentId === current?.id ? options?.locations ?? [] : [];

  return (
    <div className="min-w-0 space-y-2" role="group" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`} className="text-sm font-medium text-charcoal">{label}</p>
      {path.length > 0 && (
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-copper">
          <li><button type="button" onClick={() => selectPath([])} className="font-semibold underline underline-offset-4">{rootLabel}</button></li>
          {path.map((location, index) => (
            <li key={location.id} className="flex min-w-0 items-center gap-1">
              <ChevronRightIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
              {location.id === current.id ? <span aria-current="location" className="break-words font-semibold text-charcoal">{locationName(location)}</span>
                : <button type="button" onClick={() => selectPath(path.slice(0, index + 1))} className="break-words underline underline-offset-4">{locationName(location)}</button>}
            </li>
          ))}
        </ol>
      )}
      {resolving || loadingOptions ? <p role="status" className="text-sm text-gray-600">{t('loading')}</p>
        : error || optionsError ? (
          <p role="alert" className="text-sm text-red-700">
            {t('loadError')}{' '}
            <button type="button" className="font-semibold underline" onClick={error ? refetch : retryOptions}>{t('retry')}</button>
            {error && <button type="button" className="ml-2 font-semibold underline" onClick={() => selectPath([])}>{rootLabel}</button>}
          </p>
        ) : children.length > 0 && (
          <select value="" aria-label={t(current ? 'chooseChildLocation' : 'chooseCountry')}
            className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal"
            onChange={(event) => {
              const child = children.find(location => String(location.id) === event.target.value);
              if (child) selectPath([...path, child]);
            }}>
            <option value="">{t(current ? 'chooseChildLocation' : 'chooseCountry')}</option>
            {TIKTOK_CREATOR_LOCATION_TYPES.map((type) => {
              const locations = children.filter(location => location.type === type);
              return locations.length > 0 && <optgroup key={type} label={t(`locationTypes.${type}`)}>
                {locations.map(location => <option key={location.id} value={location.id}>{locationName(location)}</option>)}
              </optgroup>;
            })}
          </select>
        )}
    </div>
  );
}
