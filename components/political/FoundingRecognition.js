'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { foundingInitiativeAPI } from '@/lib/api/foundingInitiative';
import AlertMessage from '@/components/ui/AlertMessage';
import LoginLink from '@/components/ui/LoginLink';
import FoundingSignatureProgress from './FoundingSignatureProgress';

function RecognitionForm({ onChange }) {
  const t = useTranslations('foundingInitiative.signatures');
  const { data, loading, error, refetch } = useAsyncData(() => foundingInitiativeAPI.getRecognition(), []);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState(false);
  const recognition = data?.data;

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await update(() => foundingInitiativeAPI.publishName({
      publicName: form.get('publicName'), consent: form.has('consent'),
    }), 'namePublished');
  }

  async function update(action, nextNotice) {
    setWorking(true);
    setNotice('');
    setActionError(false);
    try {
      await action();
      await refetch();
      onChange();
      setNotice(nextNotice);
    } catch {
      setActionError(true);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">{t('recognitionTitle')}</h2>
      {error ? (
        <p className="text-sm text-slate-700">{t('loadError')}{' '}
          <button type="button" onClick={refetch} className="font-semibold text-teal-800 underline">{t('retry')}</button>
        </p>
      ) : loading ? <p role="status" className="text-sm text-slate-700">{t('loading')}</p> : (
        <>
          {recognition?.eligible ? (
            <form key={recognition.publicName || ''} onSubmit={save} className="space-y-3">
              <label className="block text-sm font-medium text-slate-900">{t('displayName')}
                <input name="publicName" defaultValue={recognition.publicName || ''} required maxLength={100}
                  className="mt-1 block w-full max-w-md rounded-lg border border-slate-300 px-3 py-2" />
              </label>
              <label className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-teal-800" />
                {t('publicationConsent')}
              </label>
              <button type="submit" disabled={working} className="min-h-11 rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50">{t('publishName')}</button>
            </form>
          ) : <p className="text-sm leading-6 text-slate-700">{t('recognitionEligibility')}</p>}
          {recognition?.publicName && (
            <button type="button" disabled={working} onClick={() => update(() => foundingInitiativeAPI.hideName(), 'nameHidden')}
              className="min-h-11 text-sm font-semibold text-teal-900 underline">{t('hideName')}</button>
          )}
        </>
      )}
      {notice && <p role="status" className="text-sm text-teal-900">{t(notice)}</p>}
      {actionError && <AlertMessage message={t('saveError')} />}
    </div>
  );
}

export default function FoundingRecognition() {
  const t = useTranslations('foundingInitiative.signatures');
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <FoundingSignatureProgress showNames refreshKey={refreshKey} />
      {user ? <RecognitionForm key={user.id} onChange={() => setRefreshKey(value => value + 1)} /> : !loading && (
        <LoginLink redirectTo="/founding-initiative/first-200" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-900 underline">
          {t('signInForRecognition')}
        </LoginLink>
      )}
    </>
  );
}
