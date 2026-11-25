'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { candidateRegistrationAPI } from '@/lib/api/candidateRegistrations';
import { buildAuthPath } from '@/lib/auth-redirect';
import { foundingCandidateDistricts, foundingCandidateRegistrationPath } from '@/lib/founding-candidate-districts';
import FoundingDistrictSelect from './FoundingDistrictSelect';

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700';

export default function FoundingCandidateForm({ district }) {
  const t = useTranslations('foundingInitiative.candidates');
  const { user, loading } = useAuth();
  const [districtSlug, setDistrictSlug] = useState(
    foundingCandidateDistricts.find(option => option.slug === district)?.slug || '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const returnPath = foundingCandidateRegistrationPath(districtSlug);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const fields = new FormData(event.currentTarget);
    const consultationCommitment = fields.get('commitment').trim();
    if (!consultationCommitment) {
      setError(t('commitmentRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await candidateRegistrationAPI.create({
        source: 'founding_initiative',
        districtSlug,
        consultationCommitment,
        acceptCommitment: fields.has('pledge'),
        contactEmail: fields.get('email').trim(),
      });
      setApplication(result.data.registration);
    } catch (error) {
      setError(t(error.status === 409 ? 'alreadyApplied' : 'submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="app-container max-w-2xl">
        <Link href="/founding-initiative#candidates" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 hover:underline">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> {t('back')}
        </Link>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t('formTitle')}</h1>
          <p className="mt-3 leading-7 text-slate-600">{t('followUp')}</p>
          {loading ? (
            <p className="mt-5 text-sm text-slate-600" role="status">{t('authLoading')}</p>
          ) : application ? (
            <div className="mt-5 rounded-lg bg-teal-50 p-4 text-sm text-teal-950">
              <p role="status" className="font-semibold">{t('submitted', { district: application.location.name_local || application.location.name })}</p>
              <Link href={`/candidate-registrations/${application.id}`} className="mt-2 inline-flex min-h-11 items-center font-medium underline">{t('viewApplication')}</Link>
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <FoundingDistrictSelect id="founding-registration-district" value={districtSlug} onChange={setDistrictSlug} required />
              {user ? (
                <>
                  <div>
                    <label htmlFor="founding-candidate-email" className="block text-sm font-semibold text-slate-900">{t('contactLabel')}</label>
                    <input id="founding-candidate-email" name="email" type="email" autoComplete="email" defaultValue={user.email}
                      className={inputClass} required maxLength={255} />
                  </div>
                  <div>
                    <label htmlFor="founding-candidate-commitment" className="block text-sm font-semibold text-slate-900">{t('commitmentLabel')}</label>
                    <p id="founding-candidate-help" className="mt-1 text-sm leading-6 text-slate-600">{t('commitmentHelp')}</p>
                    <textarea id="founding-candidate-commitment" name="commitment" aria-describedby="founding-candidate-help"
                      className={inputClass} maxLength={1500} rows={5} required />
                  </div>
                  <label className="flex items-start gap-3 rounded-lg bg-teal-50 p-4 text-sm leading-6 text-teal-950">
                    <input type="checkbox" name="pledge" required className="mt-1 h-4 w-4 shrink-0 accent-teal-800" />
                    {t('acceptPledge')}
                  </label>
                  {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                  <Button type="submit" loading={submitting}>{t('submitAction')}</Button>
                </>
              ) : (
                <>
                  <p className="text-sm leading-6 text-slate-600">{t('authRequired')}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={buildAuthPath('/login', returnPath)} className="inline-flex min-h-11 items-center rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900">{t('logIn')}</Link>
                    <Link href={buildAuthPath('/register', returnPath)} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">{t('createAccount')}</Link>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
