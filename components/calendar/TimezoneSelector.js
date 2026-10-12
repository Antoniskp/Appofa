'use client';
import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function TimezoneSelector({ value, onChange }) {
  const t = useTranslations('calendar');
  const id = useId();
  const [search, setSearch] = useState('');
  const zones = useMemo(() => [...new Set(['UTC', 'Europe/Athens', 'Europe/Bucharest', value,
    ...(typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [])])].filter(Boolean).sort(), [value]);
  const matches = zones.filter(zone => zone.toLowerCase().replace(/_/g, ' ').includes(search.toLowerCase().trim()));
  return <div className="space-y-2">
    <label htmlFor={`${id}-search`} className="block">{t('timezoneSearch')}</label>
    <input id={`${id}-search`} type="search" value={search} onChange={e => setSearch(e.target.value)} className="block w-full rounded-lg border p-2" />
    <label htmlFor={id} className="block">{t('timezone')}</label>
    <select id={id} name="timezone" value={value} onChange={e => onChange(e.target.value)} required className="block w-full rounded-lg border p-2">
      {!matches.includes(value) && <option value={value}>{value.replace(/_/g, ' ')}</option>}
      {matches.map(zone => <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>)}
    </select>
    {!matches.length && <p className="text-sm text-gray-500">{t('noTimezones')}</p>}
  </div>;
}
