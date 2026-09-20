'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRightIcon, MapPinIcon, ChatBubbleLeftRightIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { homepageAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import HomepageSection from '@/components/HomepageSection';
import PollCard from '@/components/polls/PollCard';
import SuggestionCard from '@/components/SuggestionCard';
import OnboardingCard from '@/components/OnboardingCard';
import ProgressFeed from '@/components/ProgressFeed';
import AlertMessage from '@/components/ui/AlertMessage';
import CountryEntryPopup from '@/components/geo/CountryEntryPopup';

export default function HomePage() {
  const t = useTranslations('democracy');
  const { user } = useAuth();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const response = await homepageAPI.get();
    if (!response.success) throw new Error(response.message);
    return response.data;
  }, [user?.id], { initialData: {} });
  const community = user?.homeLocation?.slug ? `/locations/${user.homeLocation.slug}` : '/locations';
  const featured = data?.homepageSettings?.featuredPoll;
  const showFeatured = featured?.enabled && (featured.audience === 'all' || featured.audience === (user ? 'registered' : 'guest')) && data?.featuredPoll;
  const actions = [
    { title: 'community', body: 'communityBody', href: community, icon: MapPinIcon },
    { title: 'proposals', body: 'proposalsBody', href: '/suggestions', icon: ChatBubbleLeftRightIcon },
    { title: 'progress', body: 'progressBody', href: '/progress', icon: ClipboardDocumentCheckIcon },
  ];

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <CountryEntryPopup isAuthenticated={Boolean(user)} />
    <section className="relative overflow-hidden bg-[#123c38] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-48 h-[36rem] w-[36rem] rounded-full border-[70px] border-white/5" />
      <div className="app-container relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">{t('eyebrow')}</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t('heroTitle')}</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-teal-50/90 sm:text-lg">{t('heroBody')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/suggestions/new" className="inline-flex items-center gap-3 rounded-xl bg-[#e3ef9e] px-5 py-3 font-semibold text-[#123c38] hover:bg-white">{t('submit')}<ArrowRightIcon className="h-4 w-4" /></Link>
            <Link href={community} className="rounded-xl border border-white/40 px-5 py-3 font-semibold hover:bg-white/10">{t('findCommunity')}</Link>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-teal-100">{t('heroTrust')}</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/5 p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-teal-200">{t('journey')}</h2>
          <ol className="mt-6 space-y-6">{['propose', 'deliberate', 'decide', 'deliver'].map((step, index) => <li key={step} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-200/40 text-xs text-teal-100">0{index + 1}</span><div><h3 className="font-semibold">{t(step)}</h3><p className="mt-1 text-sm leading-relaxed text-teal-50/80">{t(`${step}Body`)}</p></div></li>)}</ol>
        </div>
      </div>
    </section>
    <nav aria-label={t('participate')} className="app-container grid gap-4 py-8 md:grid-cols-3">{actions.map(({ title, body, href, icon: Icon }) => <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-sm"><Icon className="h-6 w-6 text-teal-800" /><h2 className="mt-4 flex items-center justify-between text-lg font-semibold">{t(title)}<ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" /></h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{t(body)}</p></Link>)}</nav>
    {user && <div className="app-container pb-6"><OnboardingCard user={user} /></div>}
    {error && <div className="app-container pb-6"><AlertMessage message={error} /><button onClick={refetch} className="mt-3 font-semibold underline">{t('retry')}</button></div>}
    {showFeatured && <section className="app-container pb-8"><h2 className="mb-4 text-xl font-semibold">{t('featured')}</h2><div className="max-w-xl"><PollCard poll={data.featuredPoll} /></div></section>}
    <HomepageSection title={t('proposalHeading')} subtitle={t('proposalSubheading')} linkHref="/suggestions" items={data?.suggestions || []} loading={loading} error={error} emptyTitle={t('emptyProposals')} emptyDescription={t('emptyProposalsBody')} skeletonCount={3} bgColor="bg-white" renderItem={proposal => <SuggestionCard key={proposal.id} suggestion={proposal} />} />
    <HomepageSection title={t('consultations')} subtitle={t('consultationsBody')} linkHref="/polls" items={data?.polls || []} loading={loading} error={error} emptyTitle={t('emptyPolls')} emptyDescription={t('emptyPollsBody')} skeletonCount={3} bgColor="bg-slate-50" renderItem={poll => <PollCard key={poll.id} poll={poll} />} />
    <section className="border-y border-slate-200 bg-[#eef3ed] py-12"><div className="app-container"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-teal-800">{t('accountability')}</p><h2 className="mt-2 text-2xl font-semibold">{t('progressHeading')}</h2><p className="mt-2 text-sm text-slate-600">{t('reported')}</p></div><Link href="/progress" className="text-sm font-semibold text-teal-800">{t('allProgress')} →</Link></div><ProgressFeed preview /></div></section>
    <section className="app-container py-12"><h2 className="text-xl font-semibold">{t('resources')}</h2><div className="mt-5 flex flex-wrap gap-3">{[['/news', 'news'], ['/civic-questions', 'civicQuestions'], ['/organizations', 'organizations'], ['/manifest-supporters', 'commitments'], ['/platform', 'platform']].map(([href, label]) => <Link key={href} href={href} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm hover:border-teal-700">{t(label)}</Link>)}</div></section>
  </div>;
}
