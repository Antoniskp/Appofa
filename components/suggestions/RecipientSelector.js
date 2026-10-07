'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { suggestionAPI } from '@/lib/api/suggestions';
import { useAsyncData } from '@/hooks/useAsyncData';
import { recipientLabel } from './RecipientLabel';

export default function RecipientSelector({ locationId, value, onChange, currentRecipient = null }) {
  const id = useId();
  const locale = useLocale();
  const t = useTranslations('suggestionRecipients');
  const { data, loading, error, refetch } = useAsyncData(async () => {
    if (!locationId) return { locationId, recipients: [] };
    const response = await suggestionAPI.getRecipients(locationId);
    if (!response.success) throw new Error(response.message || 'Unable to load offices');
    return { locationId, recipients: response.data };
  }, [locationId]);
  const fresh = data?.locationId === locationId;
  const recipients = fresh ? data.recipients : [];
  const missing = value && !recipients.some(recipient => recipient.key === value);

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-800">{t('label')}</label>
      <p id={`${id}-help`} className="text-sm text-gray-600">{t('help')}</p>
      <select id={id} value={value || ''} onChange={event => onChange(event.target.value || null)}
        aria-describedby={`${id}-help`} disabled={!locationId || loading || !fresh || Boolean(error)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:opacity-60">
        <option value="">{!locationId ? t('choose_location') : loading ? t('loading') : t('community')}</option>
        {missing && <option value={value}>{currentRecipient ? recipientLabel(currentRecipient, locale, t) : t('unavailable')}</option>}
        {recipients.map(recipient => <option key={recipient.key} value={recipient.key}>{recipientLabel(recipient, locale, t)}</option>)}
      </select>
      {error && <p role="alert" className="text-sm text-red-700">{t('load_error')} <button type="button" onClick={refetch} className="underline">{t('retry')}</button></p>}
      {value && <button type="button" onClick={() => onChange(null)} className="text-sm text-blue-700 underline">{t('clear')}</button>}
      {!loading && !error && locationId && fresh && !recipients.length && <p className="text-sm text-gray-600">{t('empty')}</p>}
      <p className="text-xs text-gray-500">{t('publication_note')}</p>
    </div>
  );
}
