'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useHomepageData } from '@/hooks/useHomepageData';
import { useAsyncData } from '@/hooks/useAsyncData';
import { issueFollowAPI } from '@/lib/api/issueFollows';
import { buildAuthPath } from '@/lib/auth-redirect';
import LocationSelector from '@/components/ui/LocationSelector';
import OnboardingCard from '@/components/OnboardingCard';
import ProgressFeed from '@/components/ProgressFeed';

const sections = ['polls', 'suggestions', 'latestNews', 'latestArticles'];
const button = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold transition hover:bg-stone-100';

function FollowingFeed() {
  const t = useTranslations('communityHome');
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useAsyncData(() => issueFollowAPI.list(page), [page]);
  if (loading) return <p role="status">{t('loading')}</p>;
  if (error) return <div role="alert">{t('error')} <button className={button} onClick={refetch}>{t('retry')}</button></div>;
  return <div className="space-y-4">
    {!data?.data?.length && <p className="rounded-2xl border border-dashed p-8">{t('followingEmpty')}</p>}
    {data?.data?.map(item => <FeedCard key={`${item.entityType}-${item.id}`} item={{ ...item, kind: item.entityType }} reason={t('followed')} />)}
    <nav className="flex gap-3" aria-label={t('pagination')}><button className={button} disabled={page === 1} onClick={() => setPage(page - 1)}>{t('previous')}</button><button className={button} disabled={page >= (data?.pagination?.totalPages || 1)} onClick={() => setPage(page + 1)}>{t('next')}</button></nav>
  </div>;
}

function FeedCard({ item, reason }) {
  const t = useTranslations('communityHome');
  const locale = useLocale();
  const route = { poll: 'polls', suggestion: 'suggestions', news: 'news', article: 'articles' }[item.kind];
  const date = item.progress?.history?.at(-1)?.at || item.newsApprovedAt || item.updatedAt || item.createdAt;
  return <article className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600"><span className="rounded-full bg-stone-100 px-3 py-1">{t(item.kind)}</span><span>{reason}</span>{item.location?.name && <span>· {item.location.name}</span>}</div>
    <h3 className="mt-4 text-xl font-semibold leading-snug"><Link className="hover:text-copper" href={`/${route}/${item.id}`}>{item.title}</Link></h3>
    {item.progress?.note && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">{item.progress.note}</p>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      {date && !Number.isNaN(new Date(date).getTime()) && <time className="text-xs text-stone-500" dateTime={date}>{new Date(date).toLocaleDateString(locale)}</time>}
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-copper" href={`/${route}/${item.id}`}>{t(item.progress?.note ? 'readUpdate' : item.kind === 'poll' ? 'viewPoll' : 'readMore')} →</Link>
    </div>
  </article>;
}

function CommunityHome({ user, initialPayload }) {
  const t = useTranslations('communityHome');
  const [view, setView] = useState(user ? 'personal' : 'explore');
  const [selected, setSelected] = useState(undefined);
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('locationId');
    if (id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))) setSelected(Number(id));
  }, []);
  const locationId = selected !== undefined ? selected : view === 'personal' ? user?.homeLocationId || user?.homeLocation?.id : null;
  const { data, loading, error, retry } = useHomepageData(user, initialPayload, locationId || undefined);
  const chooseLocation = id => {
    setSelected(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('locationId', id); else url.searchParams.delete('locationId');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  };
  const proposalPath = `/suggestions/new${locationId ? `?locationId=${locationId}` : ''}`;
  const rows = [
    ...(data.polls || []).map(item => ({ ...item, kind: 'poll' })),
    ...(data.suggestions || []).map(item => ({ ...item, kind: 'suggestion' })),
    ...(data.latestNews || []).map(item => ({ ...item, kind: 'news' })),
    ...(data.latestArticles || []).map(item => ({ ...item, kind: 'article' })),
  ].sort((a, b) => new Date(b.newsApprovedAt || b.updatedAt || b.createdAt || 0) - new Date(a.newsApprovedAt || a.updatedAt || a.createdAt || 0));
  const visible = rows.filter(item => filter === 'all' || item.kind === filter);
  const failed = sections.filter(error);
  const busy = sections.some(loading);
  const featured = data.homepageSettings?.featuredPoll;
  const showFeatured = featured?.enabled && (featured.audience === 'all' || !featured.audience || featured.audience === (user ? 'registered' : 'guest')) && data.featuredPoll;
  return <div className="min-h-screen bg-ivory pb-16">
    <header className="border-b border-brand-border bg-white">
      <div className="app-container py-9 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-copper">{t('eyebrow')}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">{t(user ? 'memberTitle' : 'guestTitle')}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-stone-600">{t(user ? 'memberBody' : 'guestBody')}</p>
        <div className="mt-6 flex flex-wrap gap-3"><a className={`${button} bg-stone-900 text-white hover:bg-stone-700`} href="#home-area">{t('chooseLocation')}</a><Link className={button} href={user ? proposalPath : buildAuthPath('/register', proposalPath)}>{t('propose')}</Link></div>
      </div>
    </header>
    <div className="app-container grid items-start gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0">
        <section id="home-area" className="scroll-mt-24 rounded-2xl border border-brand-border bg-white p-5">
          <h2 className="mb-3 font-semibold">{t('location')}</h2>
          <LocationSelector allowClear={false} key={locationId || 'all'} value={locationId || null} onChange={chooseLocation} placeholder={t('allLocations')} labels={{ search: t('search'), empty: t('noLocations'), loading: t('loading'), clear: t('clear') }} />
          <button className="mt-2 min-h-11 text-sm font-semibold text-copper" onClick={() => chooseLocation(null)}>{t('browseAll')}</button>
          <p className="mt-3 text-xs leading-relaxed text-stone-500">{t('locationNote')}</p>
        </section>
        <nav className="mt-6 flex gap-2 border-b border-brand-border pb-3" aria-label={t('views')}>
          {(user ? ['personal', 'following', 'explore'] : ['explore']).map(tab => <button key={tab} aria-pressed={view === tab} className={`${button} ${view === tab ? 'bg-stone-900 text-white hover:bg-stone-700' : 'bg-white'}`} onClick={() => { setView(tab); setFilter('all'); chooseLocation(tab === 'personal' ? user?.homeLocationId || user?.homeLocation?.id || null : null); }}>{t(tab)}</button>)}
        </nav>
        {view === 'following' ? <div className="mt-5"><FollowingFeed /></div> : <>
          <div className="my-5 flex flex-wrap gap-2" aria-label={t('filters')}>{['all', 'suggestion', 'poll', 'news', 'article'].map(kind => <button key={kind} aria-pressed={filter === kind} className={`min-h-11 rounded-full px-4 text-sm ${filter === kind ? 'bg-white font-bold ring-1 ring-stone-400' : 'text-stone-600 hover:bg-white'}`} onClick={() => setFilter(kind)}>{t(kind)}</button>)}</div>
          {failed.length > 0 && <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">{t('error')} <button className={button} onClick={() => retry(failed)}>{t('retry')}</button></div>}
          {busy && <p role="status" className="py-5">{t('loading')}</p>}
          <div className="space-y-4">{showFeatured && !locationId && filter === 'all' && !visible.some(item => item.kind === 'poll' && item.id === data.featuredPoll.id) && <FeedCard item={{ ...data.featuredPoll, kind: 'poll' }} reason={t('general')} />}{visible.map(item => <FeedCard key={`${item.kind}-${item.id}`} item={item} reason={t(locationId ? 'local' : 'general')} />)}</div>
          {!busy && !failed.length && !visible.length && <div className="rounded-2xl border border-dashed border-brand-border bg-white p-8"><h2 className="text-xl font-semibold">{t('empty')}</h2><p className="mt-3 text-stone-600">{t('emptyBody')}</p><div className="mt-5 flex flex-wrap gap-3"><Link className={button} href={user ? proposalPath : buildAuthPath('/register', proposalPath)}>{t('propose')}</Link><button className={button} onClick={() => { chooseLocation(null); setFilter('all'); }}>{t('browseAll')}</button></div></div>}
          <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-copper"><Link className="min-h-11 py-3" href={`/suggestions${locationId ? `?locationId=${locationId}` : ''}`}>{t('moreProposals')} →</Link><Link className="min-h-11 py-3" href={`/polls${locationId ? `?locationId=${locationId}` : ''}`}>{t('morePolls')} →</Link></div>
        </>}
      </div>
      <aside className="space-y-5">
        {user && <OnboardingCard user={user} />}
        <section className="rounded-2xl bg-stone-900 p-6 text-white"><h2 className="text-xl font-semibold">{t('participate')}</h2><ol className="mt-5 space-y-5">{['step1', 'step2', 'step3'].map((step, index) => <li key={step} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 text-sm">{index + 1}</span><span className="text-sm leading-relaxed">{t(step)}</span></li>)}</ol><Link className="mt-6 inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href={user ? proposalPath : buildAuthPath('/register', proposalPath)}>{t(user ? 'propose' : 'join')} →</Link></section>
        <section className="rounded-2xl border border-brand-border bg-white p-6"><h2 className="font-semibold">{t('discover')}</h2><p className="mt-3 text-sm leading-relaxed text-stone-600">{t('discoverBody')}</p><Link className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-copper" href="/locations">{t('map')} →</Link><Link className="block min-h-11 py-3 text-sm font-semibold text-copper" href="/calendar">{t('events')} →</Link></section>
      </aside>
    </div>
    <section className="app-container mt-12 border-t border-brand-border pt-8"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold">{t('outcomes')}</h2><p className="mt-2 text-sm text-stone-600">{t('outcomesBody')}</p></div><Link className={button} href="/progress">{t('readMore')} →</Link></div><ProgressFeed preview /></section>
  </div>;
}

export default function HomePageClient({ initialPayload = null }) {
  const { user, loading } = useAuth();
  const t = useTranslations('communityHome');
  if (loading) return <p role="status" className="app-container py-12">{t('loading')}</p>;
  return <CommunityHome key={user?.id || 'guest'} user={user} initialPayload={initialPayload} />;
}
