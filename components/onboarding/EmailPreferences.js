'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { newsletterAPI } from '@/lib/api';

export default function EmailPreferences() {
  const t = useTranslations('locationOnboarding');
  const locale = useLocale();
  const [value, setValue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await newsletterAPI.getMyPreference();
      if (!response.success) throw new Error(t('loadError'));
      setValue(response.data);
    } catch { setError(t('loadError')); }
  }, [t]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      const response = await newsletterAPI.updateMyPreference({ ...value, locale });
      if (!response.success) throw new Error(t('saveError'));
      setValue(response.data); setMessage(t('preferencesSaved'));
    } catch (err) { setError(err.message || t('saveError')); }
    finally { setSaving(false); }
  };
  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4" aria-label={t('emailTitle')}>
      <h2 className="font-semibold text-gray-900">{t('emailTitle')}</h2>
      <p className="text-sm text-gray-600">{t('emailHelp')}</p>
      {value && <>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.subscribed} disabled={saving} onChange={(e) => setValue({ ...value, subscribed: e.target.checked })} />
          {t('subscribe')}
        </label>
        <fieldset disabled={!value.subscribed || saving} className="space-y-2 pl-6 disabled:opacity-50">
          <legend className="sr-only">{t('emailTitle')}</legend>
          {['general', 'local', 'activity'].map((topic) => <label key={topic} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!value.preferences?.[topic]} onChange={(e) => setValue({ ...value, preferences: { ...value.preferences, [topic]: e.target.checked } })} />
            {t(topic)}
          </label>)}
        </fieldset>
        <button type="button" onClick={save} disabled={saving} className="rounded-lg border border-blue-600 px-3 py-2 text-sm text-blue-700 disabled:opacity-50">{t(saving ? 'saving' : 'savePreferences')}</button>
      </>}
      {!value && !error && <p role="status">{t('loading')}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error} {!value && <button type="button" onClick={load} className="underline">{t('retry')}</button>}</p>}
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
    </section>
  );
}
