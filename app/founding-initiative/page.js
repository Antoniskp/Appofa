import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import FoundingSigningPanel from '@/components/political/FoundingSigningPanel';
import FoundingCandidateDistrictPicker from '@/components/political/FoundingCandidateDistrictPicker';
import { publicPageMetadata } from '@/lib/route-metadata';
import { SITE_URL } from '@/lib/seo';

const namePollUrl = 'https://appofasi.gr/polls/78';
const foundingLawUrl = 'https://www.hellenicparliament.gr/UserFiles/67715b2c-ec81-4f0c-ad6a-476a34d732bd/13130509.pdf';
const ministerialAppointmentsUrl = 'https://www.hellenicparliament.gr/Vouli-ton-Ellinon/To-Politevma/Syntagma/article-39/';
const founderName = 'Αντώνιος Παναγιωτόπουλος';
const proclamationReviewUrl = '/documents/founding-proclamation-review.el.pdf';

const ogImage = `${SITE_URL}/images/branding/founding-initiative-og.png?v=2`;
const baseMetadata = publicPageMetadata('foundingInitiative.title', 'foundingInitiative.intro', '/founding-initiative');

export async function generateMetadata() {
  const metadata = await baseMetadata();
  const image = { url: ogImage, width: 1200, height: 630, alt: metadata.openGraph.title };
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: [image] },
    twitter: { ...metadata.twitter, images: [ogImage] },
  };
}

export default async function FoundingInitiativePage() {
  const t = await getTranslations('foundingInitiative');

  return (
    <main className="bg-ivory py-8 sm:py-12">
      <div className="app-container max-w-5xl space-y-8">
        <header className="rounded-3xl bg-charcoal px-6 py-8 text-white sm:px-10 sm:py-12">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ivory sm:text-lg">{t('intro')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#get-involved" aria-describedby="founding-join-note" className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-charcoal hover:bg-ivory focus-visible:outline-sand">{t('joinAction')}</a>
            <a href="#proclamation" className="inline-flex min-h-11 items-center rounded-lg border border-white/50 px-4 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-sand">{t('proclamation.heroAction')}</a>
          </div>
          <p id="founding-join-note" className="mt-3 max-w-xl text-sm leading-6 text-ivory">{t('joinNote')}</p>
        </header>

        <section aria-labelledby="founding-about" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="founding-about" className="text-2xl font-semibold text-slate-900">{t('about.title')}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{t('about.founder', { name: founderName })}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">{t('about.fundingTitle')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('about.funding')}</p>
            </div>
            <div className="flex flex-col items-start rounded-xl bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">{t('about.contactTitle')}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{t('about.contact')}</p>
              <Link href="/contact" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:underline">
                {t('about.contactAction')} <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section id="proclamation" aria-labelledby="founding-proclamation" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 id="founding-proclamation" className="text-2xl font-semibold text-slate-900">{t('digitalSigning.proclamationTitle')}</h2>
              <p className="mt-2 max-w-xl leading-7 text-slate-700">{t('proclamation.what')}</p>
              <p className="mt-2 max-w-xl leading-7 text-slate-700">{t('digitalSigning.proclamationIntro')}</p>
            </div>
            <a href={proclamationReviewUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-[var(--brand-hover)] hover:bg-ivory">
              {t('digitalSigning.readDraft')} <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          </div>
          <h3 className="mt-6 font-semibold text-slate-900">{t('proclamation.summaryTitle')}</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {['purpose', 'ask', 'explain', 'members'].map(point => (
              <li key={point} className="border-l-2 border-copper pl-4 text-sm leading-6 text-slate-700">{t(`proclamation.${point}`)}</li>
            ))}
          </ul>
        </section>

        <section id="get-involved" aria-labelledby="founding-interest" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="founding-interest" className="text-2xl font-semibold text-slate-900">{t('getInvolved')}</h2>
          <FoundingSigningPanel>
            <div>
              <h3 className="font-semibold text-slate-900">{t('signingNext')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{t('signingIntro')}</p>
              <details className="mt-3 border-t border-slate-200 pt-2">
                <summary className="w-fit cursor-pointer rounded py-2 text-sm font-semibold text-[var(--brand)]">{t('signingRequirements')}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t('signingLaw')}</p>
                <a href={foundingLawUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-[var(--brand)] underline">{t('signingSource')}</a>
              </details>
            </div>
          </FoundingSigningPanel>
        </section>

        <section id="candidates" aria-labelledby="founding-candidates" className="scroll-mt-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div>
            <h2 id="founding-candidates" className="text-2xl font-semibold text-slate-900">{t('candidates.title')}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-700">{t('candidates.intro')}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{t('candidates.pledge')}</p>
          </div>
          <FoundingCandidateDistrictPicker />
          <p className="text-sm leading-6 text-slate-600">{t('candidates.followUp')}</p>
        </section>

        <section aria-labelledby="founding-name" className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-ivory p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 id="founding-name" className="text-2xl font-semibold text-slate-900">{t('nameHeading')}</h2>
            <p className="mt-2 max-w-xl leading-7 text-slate-700">{t('nameIntro')}</p>
          </div>
          <Link href={namePollUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] sm:self-center">{t('voteOnName')} <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
        </section>

        <section aria-labelledby="founding-purpose" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="founding-purpose" className="text-2xl font-semibold text-slate-900">{t('purpose')}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('purposeIntro')}</p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {['beforeDecision', 'afterDecision', 'evaluateDecision'].map(step => <li key={step} className="border-l-2 border-copper pl-4">
              <h3 className="font-semibold text-slate-900">{t(step)}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{t(`${step}Detail`)}</p>
            </li>)}
          </ol>
          <Link href="/parliamentary-consultations" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:underline">{t('seeConsultations')} <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
        </section>

        <section id="government-choices" aria-labelledby="founding-government-choices" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 id="founding-government-choices" className="text-2xl font-semibold text-slate-900">{t('governmentChoices.title')}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{t('governmentChoices.intro')}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-start rounded-xl bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">{t('governmentChoices.exploreTitle')}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{t('governmentChoices.exploreDetail')}</p>
              <Link href="/users" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:underline">
                {t('governmentChoices.exploreAction')} <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </div>
            <div className="flex flex-col items-start rounded-xl bg-ivory p-5">
              <h3 className="font-semibold text-slate-900">{t('governmentChoices.voteTitle')}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{t('governmentChoices.voteDetail')}</p>
              <Link href="/dream-team/gr" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                {t('governmentChoices.voteAction')} <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-700">{t('governmentChoices.followUp')}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t('governmentChoices.appointments')}{' '}
            <a href={ministerialAppointmentsUrl} className="font-medium text-[var(--brand)] underline">{t('governmentChoices.appointmentsSource')}</a>
          </p>
        </section>
      </div>
    </main>
  );
}
