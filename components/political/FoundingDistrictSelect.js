'use client';

import { useTranslations } from 'next-intl';
import { foundingCandidateDistricts } from '@/lib/founding-candidate-districts';

export default function FoundingDistrictSelect({ id, value, onChange, required = false }) {
  const t = useTranslations('foundingInitiative.candidates');

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-900">{t('districtLabel')}</label>
      <select
        id={id}
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper"
      >
        <option value="">{t('districtPlaceholder')}</option>
        {foundingCandidateDistricts.map(district => (
          <option key={district.slug} value={district.slug}>{district.name}</option>
        ))}
      </select>
    </div>
  );
}
