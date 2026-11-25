'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { foundingInitiativeAPI } from '@/lib/api/foundingInitiative';
import LoginLink from '@/components/ui/LoginLink';
import AlertMessage from '@/components/ui/AlertMessage';

function InterestForm({ initialInterest }) {
  const t = useTranslations('foundingInitiative');
  const [interest, setInterest] = useState(initialInterest);
  const [wantsToSign, setWantsToSign] = useState(Boolean(initialInterest?.wantsToSign));
  const [wantsToVolunteer, setWantsToVolunteer] = useState(Boolean(initialInterest?.wantsToVolunteer));
  const [signingPreference, setSigningPreference] = useState(initialInterest?.signingPreference || '');
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState(false);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError(false);
    setNotice('');
    try {
      const result = await foundingInitiativeAPI.saveInterest({
        wantsToSign, wantsToVolunteer, signingPreference: wantsToSign ? signingPreference || null : null, consent,
      });
      setInterest(result.data);
      setSigningPreference(result.data.signingPreference || '');
      setConsent(false);
      setNotice('interestSaved');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function withdraw() {
    setSaving(true);
    setError(false);
    setNotice('');
    try {
      await foundingInitiativeAPI.withdrawInterest();
      setInterest(null);
      setWantsToSign(false);
      setWantsToVolunteer(false);
      setSigningPreference('');
      setConsent(false);
      setNotice('interestWithdrawn');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-4 sm:p-5">
      <fieldset disabled={saving} className="space-y-3">
        <legend className="mb-2 font-semibold text-slate-900">{t('chooseInvolvement')}</legend>
        <label className="flex items-start gap-3 text-sm font-medium text-slate-900">
          <input type="checkbox" checked={wantsToSign} onChange={event => setWantsToSign(event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-800" />{t('wantToSign')}
        </label>
        {wantsToSign && <div className="pl-7 text-sm text-slate-900">
          <label htmlFor="founding-signing-preference" className="font-medium">{t('signingPreference')}</label>
          <select id="founding-signing-preference" aria-describedby="founding-signing-preference-note" value={signingPreference} onChange={event => setSigningPreference(event.target.value)} className="mt-1 block w-full rounded-lg border border-teal-300 bg-white px-3 py-2">
            <option value="">{t('method_either')}</option>
            <option value="in_person">{t('method_in_person')}</option>
            <option value="remote">{t('method_remote')}</option>
          </select>
          <p id="founding-signing-preference-note" className="mt-1 text-xs leading-5 text-slate-600">{t('signingPreferenceNote')}</p>
        </div>}
        <label className="flex items-start gap-3 text-sm font-medium text-slate-900">
          <input type="checkbox" checked={wantsToVolunteer} onChange={event => setWantsToVolunteer(event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-800" />{t('wantToVolunteer')}
        </label>
        <label className="flex items-start gap-3 border-t border-teal-200 pt-3 text-sm leading-6 text-slate-700">
          <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-teal-800" />{t('consent')}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={!consent || (!wantsToSign && !wantsToVolunteer)} className="min-h-11 rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60">{t(interest ? 'updateInterest' : 'submitInterest')}</button>
          {interest && <button type="button" onClick={withdraw} className="min-h-11 text-sm font-semibold text-teal-900 underline">{t('withdrawInterest')}</button>}
        </div>
      </fieldset>
      {interest?.signingStatus && <p className="text-sm text-slate-700">{t('mySigningStatus', { status: t(`status_${interest.signingStatus}`) })}</p>}
      {notice && <p role="status" className="text-sm font-medium text-teal-900">{t(notice)}</p>}
      {error && <AlertMessage message={t('saveError')} />}
    </form>
  );
}

function SavedInterest({ userId }) {
  const t = useTranslations('foundingInitiative');
  const { data, loading, error, refetch } = useAsyncData(() => foundingInitiativeAPI.getMyInterest(), [userId]);

  if (loading) return <p role="status" className="text-sm text-slate-600">{t('loading')}</p>;
  if (error) return <div><AlertMessage message={t('loadError')} /><button type="button" onClick={refetch} className="mt-2 min-h-11 text-sm font-semibold text-teal-800 underline">{t('retry')}</button></div>;
  return <InterestForm initialInterest={data?.data ?? null} />;
}

export default function FoundingInterestForm() {
  const t = useTranslations('foundingInitiative');
  const { user, loading } = useAuth();

  if (loading) return <p role="status" className="text-sm text-slate-600">{t('loading')}</p>;
  if (user) return <SavedInterest key={user.id} userId={user.id} />;

  return <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 sm:p-5">
    <p className="text-sm leading-6 text-slate-700">{t('privateInterest')}</p>
    <LoginLink redirectTo="/founding-initiative#get-involved" className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900">{t('signInToHelp')}</LoginLink>
  </div>;
}
