'use client';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { issueFollowAPI } from '@/lib/api/issueFollows';

export default function IssueDigestPreference() {
  const t = useTranslations('proposalDigest');
  const locale = useLocale();
  const [value, setValue] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const result = await issueFollowAPI.getDigestPreference();
      if (!result.success) throw new Error();
      setValue(result.data);
    } catch { setError(t('loadError')); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const save = async (enabled) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await issueFollowAPI.updateDigestPreference(enabled, locale);
      if (!result.success) throw new Error(result.message || t('saveError'));
      setValue(result.data); setMessage(t(enabled ? 'enabledMessage' : 'disabledMessage'));
    } catch (err) { setError(err.message || t('saveError')); }
    finally { setBusy(false); }
  };

  return <section className="mb-4 border-t border-gray-100 pt-4" aria-label={t('title')}>
    <h3 className="text-sm font-medium text-gray-700">{t('title')}</h3>
    <p className="mt-1 text-xs text-gray-500">{t('description')}</p>
    {value && <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
      <input className="mt-1" type="checkbox" checked={value.enabled} disabled={busy || !value.emailVerified} onChange={(event) => save(event.target.checked)} />
      <span>{value.enabled ? t('enabled') : t('disabled')}<br /><span className="text-xs text-gray-500">{value.emailVerified ? value.email : t('verifyEmail')}</span></span>
    </label>}
    {!value && !error && <p className="mt-2 text-sm text-gray-500" role="status">{t('loading')}</p>}
    {busy && <p className="mt-2 text-sm text-gray-500" role="status">{t('saving')}</p>}
    {message && <p className="mt-2 text-sm text-green-700" role="status">{message}</p>}
    {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
  </section>;
}
