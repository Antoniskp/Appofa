'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
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
import EditorialImage from '@/components/EditorialImage';
import { idSlug } from '@/lib/utils/slugify';

export default function HomePage() {
  const t = useTranslations('democracy');
  const r = useTranslations('redesign');
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [chosenArea, setChosenArea] = useState(null);
  const locationId = chosenArea ?? String(user?.homeLocation?.id || user?.homeLocationId || '');
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const response = await homepageAPI.get(locationId);
    if (!response.success) throw new Error(response.message);
    return response.data;
  }, [user?.id, locationId], { initialData: {} });
  const community = user?.homeLocation?.slug ? `/locations/${user.homeLocation.slug}` : '/locations';
  const areas = [...(user?.homeLocation?.id ? [user.homeLocation] : []), ...(data?.prefectures || [])]
    .filter((area, index, list) => list.findIndex(item => item.id === area.id) === index);
  const selectedArea = areas.find(area => String(area.id) === locationId);
  const scopeLabel = selectedArea?.name || (locationId ? r('communityNav') : r('allAreas'));
  const featured = data?.homepageSettings?.featuredPoll;
  const showFeatured = featured?.enabled && (featured.audience === 'all' || featured.audience === (user ? 'registered' : 'guest')) && data?.featuredPoll;
  const proposal = !loading && !error ? data?.suggestions?.[0] : null;
  const news = data?.latestNews || [];

  return <div className="min-h-screen bg-ivory text-charcoal">
    <section className="border-b border-brand-border">
      <div className={`app-container ${user || authLoading ? 'py-10 sm:py-14' : 'grid gap-10 py-12 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16'}`}>
        <div>
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-copper"><span aria-hidden="true" className="h-px w-8 bg-copper" />{t('eyebrow')}</p>
          <h1 className={user || authLoading ? 'text-3xl font-semibold tracking-tight sm:text-4xl' : 'max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl'}>{user ? r('welcome', { name: user.firstNameNative || user.username }) : t('heroTitle')}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#62666A]">{user ? r('welcomeBody') : t('heroBody')}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href={community} className="btn-primary min-h-12">{user ? r('communityNav') : t('findCommunity')} →</Link><Link href={user ? '/suggestions/new' : '#community-activity'} className="btn-secondary min-h-12">{user ? t('submit') : t('proposals')}</Link></div>
          {!user && <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#62666A]">{t('heroTrust')}</p>}
        </div>
        {!user && !authLoading && <aside className="overflow-hidden rounded-2xl border border-brand-border bg-white">
          {proposal?.location?.imageUrl && <EditorialImage src={proposal.location.imageUrl} alt={proposal.location.name} className="aspect-[16/9] w-full object-cover" />}
          <div className="p-6 sm:p-8"><p className="text-sm font-semibold text-copper">{r('featuredProposal')}</p>
            {loading ? <div aria-busy="true" className="mt-6 space-y-4"><div className="h-8 animate-pulse rounded bg-sand" /><div className="h-20 animate-pulse rounded bg-ivory" /></div> : <><h2 className="mt-5 text-2xl font-semibold leading-snug sm:text-3xl">{proposal?.title || r('heroEmpty')}</h2><p className="mt-4 text-sm text-[#62666A]">{proposal ? proposal.location?.name || r('allAreas') : r('heroEmptyBody')}</p>{proposal?.progress?.stage && <p className="mt-4 text-sm font-semibold">{t(`stage_${proposal.progress.stage}`)}</p>}<Link href={proposal ? `/suggestions/${proposal.id}` : '/locations'} className="mt-7 inline-flex min-h-11 items-center gap-3 font-semibold text-copper">{proposal ? r('readProposal') : t('findCommunity')} →</Link></>}
          </div>
        </aside>}
      </div>
    </section>
    <CountryEntryPopup isAuthenticated={Boolean(user)} />
    <section id="community-activity" className="app-container py-10 sm:py-14" aria-labelledby="community-heading">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-copper">{scopeLabel}</p><h2 id="community-heading" className="mt-3 text-3xl font-semibold">{r('activity')}</h2><p className="mt-3 max-w-xl text-[#62666A]">{r(locationId ? 'scopeNote' : 'allNote')}</p></div>
        <div className="w-full lg:max-w-xs"><label htmlFor="home-area" className="mb-2 block text-sm font-semibold">{r('scope')}</label><select id="home-area" value={locationId} onChange={event => setChosenArea(event.target.value)} className="min-h-12 w-full rounded-xl border border-brand-border bg-white px-4 text-base"><option value="">{r('allAreas')}</option>{locationId && !selectedArea && <option value={locationId}>{r('communityNav')}</option>}{areas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select><Link href="/locations" className="mt-2 inline-block min-h-11 py-2 text-sm text-copper underline underline-offset-4">{r('changeArea')}</Link></div>
      </div>
      {user && <div className="mt-6"><OnboardingCard user={user} /></div>}
      {error && <div className="mt-6"><AlertMessage message={error} /><button onClick={refetch} className="mt-3 min-h-11 font-semibold underline">{t('retry')}</button></div>}
    </section>
    <HomepageSection title={t('proposalHeading')} subtitle={scopeLabel} linkHref={locationId ? `/suggestions?locationId=${locationId}` : '/suggestions'} items={loading || error ? [] : data?.suggestions || []} loading={loading} emptyTitle={error ? null : r('localEmpty')} emptyDescription={r('localEmptyBody')} bgColor="bg-white" renderItem={item => <SuggestionCard key={item.id} suggestion={item} />} />
    <HomepageSection title={t('consultations')} subtitle={r('consultationNote')} linkHref={locationId ? `/polls?locationId=${locationId}` : '/polls'} items={loading || error ? [] : data?.polls || []} loading={loading} emptyTitle={error ? null : t('emptyPolls')} emptyDescription={t('emptyPollsBody')} bgColor="bg-ivory" renderItem={poll => <PollCard key={poll.id} poll={poll} />} />
    {showFeatured && !loading && !error && <section className="app-container pb-12"><h2 className="mb-4 text-2xl font-semibold">{t('featured')}</h2><p className="mb-4 text-sm text-[#62666A]">{data.featuredPoll.location?.name || r('allAreas')}</p><div className="max-w-xl"><PollCard poll={data.featuredPoll} /></div></section>}
    <section className="border-y border-brand-border bg-sand py-14 sm:py-20"><div className="app-container"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-copper">{t('accountability')}</p><h2 className="mt-3 text-3xl font-semibold">{t('progressHeading')}</h2><p className="mt-3 max-w-2xl text-[#62666A]">{t('reported')}</p><p className="mt-2 text-sm text-[#62666A]">{r('progressScope')}</p></div><Link href="/progress" className="min-h-11 py-2 font-semibold text-copper">{t('allProgress')} →</Link></div><ProgressFeed preview /></div></section>
    <section className="app-container py-14 sm:py-20" aria-labelledby="news-heading"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><h2 id="news-heading" className="text-3xl font-semibold">{r('latest')}</h2><p className="mt-3 text-[#62666A]">{r('latestBody')}</p></div><Link href="/news" className="min-h-11 py-2 font-semibold text-copper">{r('viewAll')} →</Link></div>
      {!loading && !error && news.length === 0 && <p className="border-t border-brand-border py-6 text-[#62666A]">{r('newsEmpty')}</p>}
      <div className="divide-y divide-brand-border">{!loading && !error && news.map((article, index) => <article key={article.id} className="py-6 first:pt-0"><Link href={`/news/${idSlug(article.id, article.title)}`} className="group grid gap-5 sm:grid-cols-[3rem_1fr_12rem] sm:items-center"><span aria-hidden="true" className="hidden text-2xl text-copper sm:block">{String(index + 1).padStart(2, '0')}</span><div><h3 className="text-xl font-semibold leading-snug group-hover:text-copper sm:text-2xl">{article.title}</h3>{article.createdAt && <time dateTime={article.createdAt} className="mt-3 block text-sm text-[#62666A]">{new Date(article.createdAt).toLocaleDateString(locale)}</time>}<span className="mt-3 inline-block text-sm font-semibold text-copper">{r('readStory')} →</span></div><EditorialImage src={article.coverImage?.variants?.thumbnail?.url || article.bannerImageUrl} alt={article.bannerImageAltText || ''} className="aspect-[3/2] w-full rounded-xl object-cover" /></Link></article>)}</div>
    </section>
    <section className="border-y border-brand-border bg-white py-14 sm:py-20"><div className="app-container"><h2 className="max-w-2xl text-3xl font-semibold">{r('how')}</h2><p className="mt-3 text-[#62666A]">{r('howBody')}</p><ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{['propose', 'deliberate', 'decide', 'deliver'].map((step, index) => <li key={step} className="border-t border-brand-border pt-5"><span aria-hidden="true" className="text-sm font-semibold text-copper">0{index + 1}</span><h3 className="mt-4 text-xl font-semibold">{t(step)}</h3><p className="mt-3 leading-relaxed text-[#62666A]">{t(`${step}Body`)}</p></li>)}</ol><div className="mt-8 flex flex-wrap gap-6"><Link href="/rules" className="min-h-11 py-2 font-semibold text-copper">{r('rules')} →</Link><Link href="/transparency" className="min-h-11 py-2 font-semibold text-copper">{r('transparency')} →</Link></div></div></section>
    <section className="app-container flex flex-col gap-6 py-14 sm:flex-row sm:items-center sm:justify-between sm:py-20"><div><h2 className="text-2xl font-semibold">{r('guidesNav')}</h2><p className="mt-3 text-[#62666A]">{r('guidesBody')}</p></div><Link href="/citizen-help" className="btn-secondary shrink-0">{r('viewAll')} →</Link></section>
  </div>;
}
