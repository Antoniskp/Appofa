'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import Button from '@/components/ui/Button';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';

export default function LocationStep({ onContinue }) {
  const t = useTranslations('locationOnboarding');
  const { user, updateProfile } = useAuth();
  const [locationId, setLocationId] = useState(user?.homeLocationId || null);
  const [abroad, setAbroad] = useState(!!user?.isDiaspora);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');
  const saving = pendingAction !== null;

  const advance = async (selectedLocationId) => {
    if (saving) return;
    setPendingAction(selectedLocationId ? 'save' : 'skip');
    setError('');
    try {
      if (selectedLocationId) {
        await updateProfile({ homeLocationId: selectedLocationId, isDiaspora: abroad });
      }
      await onContinue(selectedLocationId);
    } catch (err) {
      setError(err.message || t('saveError'));
    } finally {
      setPendingAction(null);
    }
  };

  const usingSavedLocation = locationId === user?.homeLocationId && abroad === Boolean(user?.isDiaspora);
  const canSave = Boolean(locationId) && !usingSavedLocation;
  let continueLabel = locationId ? 'skipSelected' : 'skip';
  if (usingSavedLocation && locationId) continueLabel = 'continueSaved';

  return (
    <section aria-labelledby="onboarding-location-heading" className="space-y-4 rounded-xl border border-blue-200 bg-white p-5">
      <div>
        <h2 id="onboarding-location-heading" className="text-xl font-bold text-gray-900">{t('title')}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{t('description')}</p>
      </div>
      <CascadingLocationSelector value={locationId} onChange={setLocationId} disabled={saving} allowClear={false} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={abroad} disabled={saving} onChange={(e) => setAbroad(e.target.checked)} />{t('abroad')}</label>
      {abroad && <p className="text-sm text-gray-600">{t('abroadHelp')}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" aria-busy={saving}>
        {canSave && (
          <Button size="sm" onClick={() => advance(locationId)} disabled={saving} className="min-h-11">
            {t(pendingAction === 'save' ? 'saving' : 'saveLocation')}
          </Button>
        )}
        <Button size="sm" variant={canSave ? 'secondary' : 'primary'} onClick={() => advance()} disabled={saving} className="min-h-11">
          {t(pendingAction === 'skip' ? 'continuing' : continueLabel)}
        </Button>
      </div>
    </section>
  );
}
