'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { foundingInitiativeAPI } from '@/lib/api/foundingInitiative';
import Link from 'next/link';
import LoginLink from '@/components/ui/LoginLink';
import { buildAuthPath } from '@/lib/auth-redirect';
import AlertMessage from '@/components/ui/AlertMessage';

function InterestForm({ initialInterest }) {
  const t = useTranslations('foundingInitiative');
  const [interest, setInterest] = useState(initialInterest);
  const [wantsToSign, setWantsToSign] = useState(Boolean(initialInterest?.wantsToSign));
  const [wantsToVolunteer, setWantsToVolunteer] = useState(Boolean(initialInterest?.wantsToVolunteer));
  const [signingPreference, setSigningPreference] = useState(initialInterest?.signingPreference || '');
  const [contactPhone, setContactPhone] = useState(initialInterest?.contactPhone || '');
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await foundingInitiativeAPI.saveInterest({
        wantsToSign, wantsToVolunteer, signingPreference: wantsToSign ? signingPreference || null : null,
        contactPhone: wantsToSign ? contactPhone : null, consent,
      });
      setInterest(result.data);
      setSigningPreference(result.data.signingPreference || '');
      setContactPhone(result.data.contactPhone || '');
      setConsent(false);
      setNotice('interestSaved');
    } catch (err) {
      setError(err.status === 400 ? 'signatures.phoneError' : 'saveError');
    } finally {
      setSaving(false);
    }
  }

  async function withdraw() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await foundingInitiativeAPI.withdrawInterest();
      setInterest(null);
      setWantsToSign(false);
      setWantsToVolunteer(false);
      setSigningPreference('');
      setContactPhone('');
      setConsent(false);
      setNotice('interestWithdrawn');
    } catch {
      setError('saveError');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-brand-border bg-ivory p-4 sm:p-5">
      <fieldset disabled={saving} className="space-y-3">
        <legend className="mb-2 font-semibold text-slate-900">{t('chooseInvolvement')}</legend>
        <label className="flex items-start gap-3 text-sm font-medium text-slate-900">
          <input type="checkbox" checked={wantsToSign} onChange={event => setWantsToSign(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />{t('wantToSign')}
        </label>
        {wantsToSign && <div className="pl-7 text-sm text-slate-900">
          <label htmlFor="founding-signing-preference" className="font-medium">{t('signingPreference')}</label>
          <select id="founding-signing-preference" aria-describedby="founding-signing-preference-note" value={signingPreference} onChange={event => setSigningPreference(event.target.value)} className="mt-1 block w-full rounded-lg border border-brand-border bg-white px-3 py-2">
            <option value="">{t('method_either')}</option>
            <option value="in_person">{t('method_in_person')}</option>
            <option value="remote">{t('method_remote')}</option>
          </select>
          <p id="founding-signing-preference-note" className="mt-1 text-xs leading-5 text-slate-600">{t('signingPreferenceNote')}</p>
          <label htmlFor="founding-contact-phone" className="mt-3 block font-medium">{t('signatures.phone')}</label>
          <input id="founding-contact-phone" type="tel" autoComplete="tel" maxLength={32} value={contactPhone}
            onChange={event => setContactPhone(event.target.value)} className="mt-1 block w-full rounded-lg border border-brand-border bg-white px-3 py-2" />
        </div>}
        <label className="flex items-start gap-3 text-sm font-medium text-slate-900">
          <input type="checkbox" checked={wantsToVolunteer} onChange={event => setWantsToVolunteer(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />{t('wantToVolunteer')}
        </label>
        <label className="flex items-start gap-3 border-t border-brand-border pt-3 text-sm leading-6 text-slate-700">
          <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]" />{t('consent')}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={!consent || (!wantsToSign && !wantsToVolunteer)} className="min-h-11 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">{t(interest ? 'updateInterest' : 'submitInterest')}</button>
          {interest && <button type="button" onClick={withdraw} className="min-h-11 text-sm font-semibold text-[var(--brand-hover)] underline">{t('withdrawInterest')}</button>}
        </div>
      </fieldset>
      {interest?.signingStatus && <p className="text-sm text-slate-700">{t('mySigningStatus', { status: t(`status_${interest.signingStatus}`) })}</p>}
      {notice && <p role="status" className="text-sm font-medium text-[var(--brand-hover)]">{t(notice)}</p>}
        {error && <AlertMessage message={t(error)} />}
    </form>
  );
}

function SavedInterest({ userId }) {
  const t = useTranslations('foundingInitiative');
  const { data, loading, error, refetch } = useAsyncData(() => foundingInitiativeAPI.getMyInterest(), [userId]);

  if (loading) return <p role="status" className="text-sm text-slate-600">{t('loading')}</p>;
  if (error) return <div><AlertMessage message={t('loadError')} /><button type="button" onClick={refetch} className="mt-2 min-h-11 text-sm font-semibold text-[var(--brand)] underline">{t('retry')}</button></div>;
  return <InterestForm initialInterest={data?.data ?? null} />;
}

export default function FoundingInterestForm() {
  const t = useTranslations('foundingInitiative');
  const { user, loading } = useAuth();

  if (loading) return <p role="status" className="text-sm text-slate-600">{t('loading')}</p>;
  if (user) return <SavedInterest key={user.id} userId={user.id} />;

  return <div className="rounded-xl border border-brand-border bg-ivory p-4 sm:p-5">
    <p className="text-sm leading-6 text-slate-700">{t('privateInterest')}</p>
    <div className="mt-3 flex flex-wrap gap-3">
      <LoginLink redirectTo="/founding-initiative#get-involved" className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">{t('signInToHelp')}</LoginLink>
      <Link href={buildAuthPath('/register', '/founding-initiative#get-involved')} className="inline-flex min-h-11 items-center rounded-lg border border-brand-border bg-white px-4 text-sm font-semibold text-[var(--brand-hover)] hover:bg-ivory">{t('createAccount')}</Link>
    </div>
  </div>;
}
