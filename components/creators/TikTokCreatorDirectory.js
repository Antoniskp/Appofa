'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChartBarIcon, MagnifyingGlassIcon, MapPinIcon, PlusIcon, UserPlusIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import CreatorLocationPicker from '@/components/creators/CreatorLocationPicker';
import Pagination from '@/components/ui/Pagination';
import { useAsyncData } from '@/hooks/useAsyncData';
import { tiktokCreatorAPI } from '@/lib/api/tiktokCreators';
import { useAuth } from '@/lib/auth-context';
import { buildAuthPath } from '@/lib/auth-redirect';
import { getTikTokProfileHandle, TIKTOK_CREATOR_CATEGORIES, tikTokProfileUrl } from '@/config/tiktokCreators';

const fieldClass = 'min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold';
const benefits = [
  { key: 'discover', icon: MagnifyingGlassIcon },
  { key: 'locations', icon: MapPinIcon, href: '/profile#location-politics' },
  { key: 'polls', icon: ChartBarIcon, href: '/polls/create' },
  { key: 'live', icon: VideoCameraIcon, href: '/live' },
];

export default function TikTokCreatorDirectory({ initialCategory, initialLocationId, initialSearch }) {
  const t = useTranslations('tiktokCreators');
  const { user } = useAuth();
  const [draft, setDraft] = useState({ q: initialSearch, category: initialCategory, locationId: initialLocationId });
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [suggesting, setSuggesting] = useState(false);
  const [submissionLocationId, setSubmissionLocationId] = useState(initialLocationId);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const { data, loading, error, refetch } = useAsyncData(
    async () => (await tiktokCreatorAPI.getAll({ ...filters, page })).data,
    [filters, page, user?.id]
  );

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draft, q: draft.q.trim() });
  };

  const clearFilters = () => {
    const empty = { q: '', category: '', locationId: null };
    setDraft(empty);
    setFilters(empty);
    setPage(1);
  };

  const submitCreator = async (event) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const profile = fields.get('profile');
    if (!getTikTokProfileHandle(profile)) {
      setNotice({ error: true, text: t('invalidProfile') });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      await tiktokCreatorAPI.submit({ profile, displayName: fields.get('displayName'), category: fields.get('category'), locationId: submissionLocationId });
      setNotice({ error: false, text: t('submitted') });
      setSuggesting(false);
    } catch (err) {
      setNotice({ error: true, text: t(err.status === 409 ? 'duplicate' : err.status === 429 ? 'rateLimited' : 'submitError') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-container py-8 sm:py-12">
      <header className="mb-5 grid overflow-hidden rounded-3xl bg-[#273b34] text-white lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-10">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{t('invitationTitle')}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#e0e9df] sm:text-base">{t('invitationIntro')}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={user ? '/polls/create' : buildAuthPath('/register', '/creators')}
              className={`${buttonClass} bg-[#faf1df] text-[#273b34] hover:bg-white`}>
              {user ? <ChartBarIcon className="h-5 w-5 shrink-0" aria-hidden="true" /> : <UserPlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />}
              {t(user ? 'createPoll' : 'signUp')}
            </Link>
            <a href="#creator-directory" className={`${buttonClass} border border-white/40 text-white hover:bg-white/10`}>{t('browseCreators')}</a>
          </div>
        </div>
        <div className="relative min-h-48 sm:min-h-60 lg:min-h-[23rem]">
          <Image src="/images/branding/tiktok-creator-invitation.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover" preload />
        </div>
      </header>

      <ul className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map(({ key, icon: Icon, href }) => (
          <li key={key} className="rounded-2xl border border-brand-border bg-white p-5">
            <Icon className="h-6 w-6 text-copper" aria-hidden="true" />
            <h2 className="mt-2 font-semibold text-charcoal">
              {href && (user || key === 'live') ? <Link href={href} className="hover:text-copper hover:underline">{t(`benefits.${key}.title`)}</Link> : t(`benefits.${key}.title`)}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">{t(`benefits.${key}.description`)}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="tiktok-listing-benefits" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white p-5">
        <div className="max-w-2xl">
          <h2 id="tiktok-listing-benefits" className="text-lg font-bold text-charcoal">{t('listingTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">{t('listingBenefit')}</p>
        </div>
        <button type="button" aria-expanded={suggesting} aria-controls="suggest-tiktok-creator" disabled={submitting}
          className={`${buttonClass} border border-brand-border text-copper hover:bg-ivory`} onClick={() => {
            setNotice(null);
            setSuggesting(!suggesting);
            setSubmissionLocationId(draft.locationId);
          }}>
          <PlusIcon className="h-5 w-5" aria-hidden="true" />{t(suggesting ? 'close' : 'suggest')}
        </button>
      </section>

      {suggesting && (
        <section id="suggest-tiktok-creator" aria-labelledby="suggest-tiktok-title" className="mb-6 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <h2 id="suggest-tiktok-title" className="text-lg font-bold text-charcoal">{t('suggest')}</h2>
          <form onSubmit={submitCreator} className="mt-4">
            <fieldset disabled={submitting} className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">{t('profile')}
                <input name="profile" required maxLength={2048} placeholder="@username" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={fieldClass} />
              </label>
              <label className="grid gap-1 text-sm font-medium">{t('displayName')}
                <input name="displayName" maxLength={100} className={fieldClass} />
              </label>
              <div className="grid gap-1 text-sm font-medium">
                <label htmlFor="suggest-tiktok-category">{t('optionalCategory')}</label>
                <select id="suggest-tiktok-category" name="category" defaultValue="" aria-describedby="suggest-tiktok-discovery" className={fieldClass}>
                  <option value="">{t('chooseCategory')}</option>
                  {TIKTOK_CREATOR_CATEGORIES.map((category) => <option key={category} value={category}>{t(`categories.${category}`)}</option>)}
                </select>
              </div>
              <CreatorLocationPicker value={submissionLocationId} onChange={setSubmissionLocationId} label={t('publicLocation')} rootLabel={t('clearLocation')} />
              <p className="text-sm text-gray-600 sm:col-span-2">{t('hierarchyHint')}</p>
              <p id="suggest-tiktok-discovery" className="text-sm text-gray-600 sm:col-span-2">{t('discoveryHint')}</p>
              <div className="sm:col-span-2">
                <button type="submit" className={`${buttonClass} bg-copper text-white hover:bg-[#693a28] disabled:opacity-60`}>
                  {t(submitting ? 'submitting' : 'submit')}
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}

      {notice && <p role={notice.error ? 'alert' : 'status'} className={`mb-5 rounded-lg border px-4 py-3 text-sm ${notice.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>{notice.text}</p>}

      <h2 id="creator-directory" className="mb-3 scroll-mt-24 text-2xl font-bold text-charcoal">{t('title')}</h2>
      <form onSubmit={applyFilters} className="mb-6 rounded-2xl border border-brand-border bg-white p-4 sm:p-5">
        <div className="grid items-start gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium">{t('search')}
            <input type="search" value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })}
              maxLength={100} placeholder={t('searchPlaceholder')} className={fieldClass} />
          </label>
          <div className="grid gap-1 text-sm font-medium">
            <label htmlFor="filter-tiktok-category">{t('category')}</label>
            <select id="filter-tiktok-category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className={fieldClass}>
              <option value="">{t('allCategories')}</option>
              {TIKTOK_CREATOR_CATEGORIES.map((category) => <option key={category} value={category}>{t(`categories.${category}`)}</option>)}
            </select>
          </div>
          <CreatorLocationPicker value={draft.locationId} onChange={(locationId) => setDraft({ ...draft, locationId })}
            label={t('location')} rootLabel={t('allLocations')} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className={`${buttonClass} bg-copper text-white hover:bg-[#693a28]`}>
            <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />{t('search')}
          </button>
          <button type="button" onClick={clearFilters} className={`${buttonClass} text-gray-700 hover:bg-ivory`}>{t('clearFilters')}</button>
        </div>
      </form>

      {loading ? <p role="status" className="text-sm text-gray-600">{t('loading')}</p>
        : error ? <p role="alert" className="text-sm text-red-800">{t('loadError')} <button type="button" onClick={refetch} className="font-semibold underline">{t('retry')}</button></p>
          : !data?.creators.length ? <p className="rounded-2xl border border-dashed border-brand-border bg-white px-5 py-12 text-center text-gray-600">{t('empty')}</p>
            : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.creators.map((creator) => (
                <li key={creator.id} className="flex min-w-0 flex-col rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                  {creator.category && <span className="mb-3 self-start rounded-full bg-ivory px-2.5 py-1 text-xs font-semibold text-copper">{t(`categories.${creator.category}`)}</span>}
                  <h2 className="break-words text-lg font-bold text-charcoal">{creator.displayName || `@${creator.handle}`}</h2>
                  {creator.displayName && <p className="break-words text-sm text-gray-600">@{creator.handle}</p>}
                  {creator.location && <Link href={`/locations/${creator.location.slug || creator.location.id}`} className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline">
                    <MapPinIcon className="h-4 w-4 shrink-0 text-copper" aria-hidden="true" />{creator.location.name_local || creator.location.name}
                  </Link>}
                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-5 text-sm font-semibold text-copper">
                    {creator.username && <Link href={`/users/${encodeURIComponent(creator.username)}`} className="hover:underline">{t('openAppofasiProfile')}</Link>}
                    <a href={tikTokProfileUrl(creator.handle)} target="_blank" rel="noreferrer" className="hover:underline">{t('openTikTok')}</a>
                    <Link href={`/live?creator=${encodeURIComponent(creator.handle)}`} className="hover:underline">{t('streamsOnMap')}</Link>
                  </div>
                </li>
              ))}
            </ul>}
      {!loading && !error && <Pagination currentPage={page} totalPages={data?.totalPages ?? 0} onPageChange={setPage}
        onPrevious={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    </main>
  );
}
