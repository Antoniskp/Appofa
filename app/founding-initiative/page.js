import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import FoundingInterestForm from '@/components/political/FoundingInterestForm';
import { publicPageMetadata } from '@/lib/route-metadata';

const namePollUrl = 'https://appofasi.gr/polls/78';
const foundingLawUrl = 'https://www.hellenicparliament.gr/UserFiles/67715b2c-ec81-4f0c-ad6a-476a34d732bd/13130509.pdf';

export const generateMetadata = publicPageMetadata('foundingInitiative.title', 'foundingInitiative.intro', '/founding-initiative');

export default async function FoundingInitiativePage() {
  const t = await getTranslations('foundingInitiative');

  return (
    <main className="bg-slate-50 py-8 sm:py-12">
      <div className="app-container max-w-5xl space-y-8">
        <header className="rounded-3xl bg-teal-950 px-6 py-8 text-white sm:px-10 sm:py-12">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-teal-50 sm:text-lg">{t('intro')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#get-involved" className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-teal-950 hover:bg-teal-50">{t('getInvolved')}</a>
            <Link href={namePollUrl} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-teal-300 px-4 text-sm font-semibold hover:bg-teal-900">{t('voteOnName')}<ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </header>

        <section aria-labelledby="founding-purpose" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="founding-purpose" className="text-2xl font-semibold text-slate-900">{t('purpose')}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('purposeIntro')}</p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {['beforeDecision', 'afterDecision', 'evaluateDecision'].map(step => <li key={step} className="border-l-2 border-teal-500 pl-4">
              <h3 className="font-semibold text-slate-900">{t(step)}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{t(`${step}Detail`)}</p>
            </li>)}
          </ol>
          <Link href="/parliamentary-consultations" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 hover:underline">{t('seeConsultations')} <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
        </section>

        <section id="get-involved" aria-labelledby="founding-interest" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 id="founding-interest" className="text-2xl font-semibold text-slate-900">{t('getInvolved')}</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">{t('signingIntro')}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t('signingLaw')}</p>
              <a href={foundingLawUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-teal-800 underline">{t('signingSource')}</a>
            </div>
            <FoundingInterestForm />
          </div>
        </section>

        <section aria-labelledby="founding-name" className="flex flex-col gap-4 rounded-2xl border border-teal-200 bg-teal-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 id="founding-name" className="text-2xl font-semibold text-slate-900">{t('nameHeading')}</h2>
            <p className="mt-2 max-w-xl leading-7 text-slate-700">{t('nameIntro')}</p>
          </div>
          <Link href={namePollUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900 sm:self-center">{t('voteOnName')} <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
      </div>
    </main>
  );
}
