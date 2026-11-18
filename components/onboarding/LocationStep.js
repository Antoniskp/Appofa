'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';
import EmailPreferences from './EmailPreferences';

export default function LocationStep({ onContinue }) {
  const t = useTranslations('locationOnboarding');
  const { user, updateProfile } = useAuth();
  const [locationId, setLocationId] = useState(user?.homeLocationId || null);
  const [abroad, setAbroad] = useState(!!user?.isDiaspora);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (!locationId || saving) return;
    setSaving(true); setError('');
    try {
      await updateProfile({ homeLocationId: locationId, isDiaspora: abroad });
      await onContinue(locationId);
    } catch (err) { setError(err.message || t('saveError')); }
    finally { setSaving(false); }
  };
  return <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
      <p className="mt-2 text-gray-600">{t('description')}</p>
    </div>
    <section className="space-y-4 rounded-xl border border-blue-200 bg-white p-5">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={abroad} disabled={saving} onChange={(e) => setAbroad(e.target.checked)} />{t('abroad')}</label>
      {abroad && <p className="text-sm text-gray-600">{t('abroadHelp')}</p>}
      <CascadingLocationSelector value={locationId} onChange={setLocationId} disabled={saving} allowClear={false} />
      <p className="text-xs text-gray-500">{t('eligibility')}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={save} disabled={!locationId || saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t(saving ? 'saving' : 'saveLocation')}</button>
        <button type="button" onClick={async () => { setSaving(true); setError(''); try { await onContinue(); } catch { setError(t('saveError')); } finally { setSaving(false); } }} disabled={saving} className="px-3 py-2 text-sm text-gray-600">{t('skip')}</button>
      </div>
    </section>
    <details className="rounded-xl border border-gray-200 bg-white p-4">
      <summary className="cursor-pointer py-1 text-sm font-semibold text-gray-700">{t('emailTitle')} ({t('optional')})</summary>
      <div className="mt-4"><EmailPreferences /></div>
    </details>
  </div>;
}
