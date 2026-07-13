'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { statsAPI, heroSettingsAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { idSlug } from '@/lib/utils/slugify';
import { 
  ChartBarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UsersIcon,
  LightBulbIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  NewspaperIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_BG_COLOR = '#1a2a3a';
const DEFAULT_TITLE = 'Δες τι συμβαίνει. Πάρε θέση. Πρότεινε λύσεις.';
const DEFAULT_SUBTITLE = 'Ανακάλυψε τι αφορά την περιοχή σου, συμμετείχε σε ανοιχτές ψηφοφορίες και δώσε ορατότητα σε ιδέες, προβλήματα και ανθρώπους.';
const SLIDE_INTERVAL_MS = 5000;

const journeyLinks = [
  { href: '/locations', label: 'Περιοχές', icon: MapPinIcon },
  { href: '/polls', label: 'Ψηφοφορίες', icon: ClipboardDocumentListIcon },
  { href: '/news', label: 'Ειδήσεις', icon: NewspaperIcon },
];

const activityRows = [
  {
    key: 'localAction',
    label: 'Τοπική δράση',
    title: 'Δες τι αλλάζει στην περιοχή σου',
    icon: MapPinIcon,
  },
  {
    key: 'publicOpinion',
    label: 'Δημόσια γνώμη',
    title: 'Πάρε θέση σε ανοιχτές ψηφοφορίες',
    icon: ClipboardDocumentListIcon,
  },
  {
    key: 'citizenSolutions',
    label: 'Λύσεις πολιτών',
    title: 'Ανάδειξε ιδέες και προτεραιότητες',
    icon: LightBulbIcon,
  },
];

function formatMetricValue(value) {
  return typeof value === 'number' ? value.toLocaleString('el-GR') : '—';
}

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 animate-pulse">
      <div className="h-7 w-16 bg-white/20 rounded-md" />
      <div className="h-4 w-14 bg-white/15 rounded" />
    </div>
  );
}

function FeaturedLivePoll({ poll, loading }) {
  if (loading) {
    return (
      <div className="my-4 rounded-lg border border-white/15 bg-white/10 p-4">
        <div className="h-3 w-32 animate-pulse rounded bg-white/20" />
        <div className="mt-3 h-5 w-full animate-pulse rounded bg-white/20" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-8 animate-pulse rounded bg-white/15" />
          <div className="h-8 animate-pulse rounded bg-white/15" />
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const pollHref = `/polls/${idSlug(poll.id, poll.title)}`;
  const options = Array.isArray(poll.options) ? poll.options.slice(0, 3) : [];
  const extraOptionsCount = Math.max((poll.options?.length || 0) - options.length, 0);
  const isPollActive = poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date());

  return (
    <div className="my-4 rounded-lg border border-emerald-200/25 bg-white/[0.16] p-4 shadow-lg shadow-black/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
        Δημόσια γνώμη
      </p>
      <Link
        href={pollHref}
        className="mt-2 block text-base font-bold leading-6 text-white transition hover:text-cyan-100"
      >
        {poll.title}
      </Link>
      {poll.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/70">
          {poll.description}
        </p>
      )}
      {options.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => (
            <span
              key={option.id}
              className="max-w-full truncate rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90"
            >
              {option.text || option.displayText}
            </span>
          ))}
          {extraOptionsCount > 0 && (
            <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/75">
              +{extraOptionsCount}
            </span>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-white/70">
          {(poll.totalVotes || 0).toLocaleString('el-GR')} ψήφοι
        </span>
        <Link
          href={pollHref}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-blue-900 shadow-sm transition hover:bg-cyan-50"
        >
          {isPollActive ? 'Ψήφισε τώρα' : 'Δες αποτελέσματα'}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function HomeHero({ featuredPoll = null, featuredPollLoading = false }) {
  const { user, loading: authLoading } = useAuth();
  const [heroBg, setHeroBg] = useState({ type: 'color', value: DEFAULT_BG_COLOR });
  const [counterEnabled, setCounterEnabled] = useState(true);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // Fetch community stats via useAsyncData
  const { data: stats, loading: statsLoading } = useAsyncData(
    () => statsAPI.getCommunityStats(),
    [],
    { transform: (res) => res?.success ? res.data : null }
  );

  // Fetch hero background settings (side-effect only — sets heroBg state)
  useAsyncData(
    () => heroSettingsAPI.get(),
    [],
    {
      onSuccess: (res) => {
        if (!res?.success) return;
        const { backgroundImageUrl, backgroundColor, counterEnabled: enabled } = res.data;
        if (typeof enabled === 'boolean') setCounterEnabled(enabled);
        const color = backgroundColor || DEFAULT_BG_COLOR;
        if (backgroundImageUrl && /^https?:\/\//.test(backgroundImageUrl)) {
          const img = new Image();
          img.onload = () => setHeroBg({ type: 'image', url: backgroundImageUrl, color });
          img.onerror = () => setHeroBg({ type: 'color', value: color });
          img.src = backgroundImageUrl;
        } else {
          setHeroBg({ type: 'color', value: color });
        }
      },
    }
  );

  // Fetch slides — public endpoint already returns only active slides in order
  const { data: activeSlides } = useAsyncData(
    () => heroSettingsAPI.getSlides(),
    [],
    {
      initialData: [],
      transform: (res) => (res?.success && Array.isArray(res.data)) ? res.data : [],
    }
  );

  const goToNext = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentSlideIdx((idx) => (idx + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const goToPrev = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentSlideIdx((idx) => (idx - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length === 0 && currentSlideIdx !== 0) {
      setCurrentSlideIdx(0);
      return;
    }
    if (currentSlideIdx >= activeSlides.length) {
      setCurrentSlideIdx(Math.max(0, activeSlides.length - 1));
    }
  }, [activeSlides.length, currentSlideIdx]);

  // Auto-rotation
  useEffect(() => {
    if (activeSlides.length <= 1 || isHovered) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(goToNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [activeSlides.length, isHovered, goToNext]);

  const metrics = stats ? [
    { label: 'Χρήστες',       value: stats.totalUsers,       icon: UsersIcon },
    { label: 'Προτάσεις',     value: stats.totalSuggestions, icon: LightBulbIcon },
    { label: 'Ψηφοφορίες',    value: stats.totalPolls,       icon: ChartBarIcon },
    { label: 'Ενεργοί',       value: stats.activeUsers,      icon: CheckBadgeIcon },
  ] : null;
  const visibleActivityRows = (featuredPoll || featuredPollLoading)
    ? activityRows.filter((row) => row.key !== 'publicOpinion')
    : activityRows;

  const heroStyle =
    heroBg.type === 'image'
      ? {
          backgroundImage: `url(${heroBg.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : { backgroundColor: heroBg.value };

  // Determine current slide for CTA
  const currentSlide = activeSlides.length > 0 ? activeSlides[currentSlideIdx] : null;
  // Normalize the slide linkUrl: if absolute but same-origin, strip to path
  const rawLinkUrl = currentSlide?.linkUrl || null;
  let normalizedLinkUrl = rawLinkUrl;
  if (rawLinkUrl && /^https?:\/\//.test(rawLinkUrl)) {
    try {
      const parsed = new URL(rawLinkUrl);
      if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
        normalizedLinkUrl = parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      // malformed URL — leave as-is
    }
  }

  const isExternalLink = !!(normalizedLinkUrl && /^https?:\/\//.test(normalizedLinkUrl));
  const isInternalLink = !!(normalizedLinkUrl && normalizedLinkUrl.startsWith('/'));
  const hasLink = !!(isExternalLink || isInternalLink);
  const linkText = (currentSlide && currentSlide.linkText) ? currentSlide.linkText : 'Δες περισσότερα';
  const slideTitle = currentSlide?.title?.trim() || DEFAULT_TITLE;
  const slideSubtitle = currentSlide?.subtitle?.trim() || DEFAULT_SUBTITLE;
  const showArrows = activeSlides.length >= 2;

  return (
    <>
      {/* Hero banner */}
      <section
        className="relative isolate overflow-hidden text-white"
        style={heroStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/65 via-slate-900/35 to-emerald-950/50 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />

        <div className="relative app-container py-12 md:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-center animate-fade-in">

            {/* Left – text & actions */}
            <div className="min-w-0 max-w-3xl">
              {!authLoading && user && (
                <p className="text-sm mb-2 text-cyan-100 font-medium">
                  Καλώς ήρθες, {user.firstNameNative || user.username}!
                </p>
              )}

              <div className="mb-5 flex items-center gap-3">
                <img
                  src="/images/branding/appofa-app-icon.png"
                  alt=""
                  className="h-11 w-11 rounded-lg border border-white/25 bg-white/90 p-1 shadow-lg"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Appofa</p>
                  <p className="text-sm text-white/75">Δημόσιος χώρος για καθαρές αποφάσεις</p>
                </div>
              </div>

              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-50 backdrop-blur">
                Ενημέρωση · Συμμετοχή · Αποφάσεις
              </p>

              <div
                key={currentSlide?.id || 'default-slide'}
                className="mt-4 h-[15rem] overflow-hidden animate-fade-in md:h-[16rem] lg:h-[17rem]"
                aria-live="polite"
                aria-atomic="true"
              >
                <h1 className="mb-4 line-clamp-2 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                  {slideTitle}
                </h1>
                <p className="mb-3 max-w-2xl line-clamp-3 text-base leading-7 text-white/85 md:text-lg">
                  {slideSubtitle}
                </p>
              </div>

              {/* CTA link – always rendered to reserve space; hidden when no link */}
              <div className={`mb-3 flex min-h-11 items-start transition-opacity duration-500 ${hasLink ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {!hasLink ? (
                  <span
                    aria-hidden="true"
                    className="inline-flex min-h-11 max-w-full items-center gap-2 border border-transparent px-5 py-2.5 font-semibold"
                  >
                    <span className="min-w-0 truncate">{linkText}</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </span>
                ) : isInternalLink ? (
                  <Link
                    href={normalizedLinkUrl}
                    tabIndex={hasLink ? 0 : -1}
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-white/30 bg-white px-5 py-2.5 font-semibold text-blue-900 shadow-lg shadow-black/10 transition hover:bg-cyan-50 focus:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <span className="min-w-0 truncate">{linkText}</span>
                    <ArrowRightIcon className="w-4 h-4 shrink-0" />
                  </Link>
                ) : (
                  <a
                    href={normalizedLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={hasLink ? 0 : -1}
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-white/30 bg-white px-5 py-2.5 font-semibold text-blue-900 shadow-lg shadow-black/10 transition hover:bg-cyan-50 focus:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <span className="min-w-0 truncate">{linkText}</span>
                    <ArrowRightIcon className="w-4 h-4 shrink-0" />
                  </a>
                )}
              </div>

              {/* Arrow navigation */}
              <div className={`flex items-center gap-3 mb-4 ${showArrows ? '' : 'invisible'}`}>
                <button
                  onClick={goToPrev}
                  aria-label="Προηγούμενο slide"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/20"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                {/* Dot indicators */}
                <div className="flex gap-1.5" role="tablist" aria-label="Slides">
                  {activeSlides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      role="tab"
                      aria-selected={idx === currentSlideIdx}
                      aria-label={`Slide ${idx + 1}`}
                      onClick={() => setCurrentSlideIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        idx === currentSlideIdx ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={goToNext}
                  aria-label="Επόμενο slide"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/20"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {journeyLinks.map(({ href, label, icon: Icon }) => (
                  <span
                    key={href}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur"
                  >
                    <Icon className="h-4 w-4 text-cyan-100" />
                    {label}
                  </span>
                ))}
              </div>

              {(featuredPoll || featuredPollLoading) && (
                <div className="lg:hidden">
                  <FeaturedLivePoll poll={featuredPoll} loading={featuredPollLoading} />
                </div>
              )}

            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-lg border border-white/20 bg-white/[0.14] p-4 shadow-2xl shadow-black/15 backdrop-blur-md">
                <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">Ζωντανή εικόνα</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Η συμμετοχή γίνεται πράξη</h2>
                  </div>
                  <span className="rounded-lg border border-emerald-200/30 bg-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-50">
                    Live
                  </span>
                </div>

                <FeaturedLivePoll poll={featuredPoll} loading={featuredPollLoading} />

                <div className="py-2">
                  {visibleActivityRows.map(({ label, title, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3 border-b border-white/10 py-4 last:border-b-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-cyan-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/85">{label}</p>
                        <p className="mt-1 text-sm font-semibold leading-5 text-white">{title}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {counterEnabled && (statsLoading || metrics) && (
                  <div className="border-t border-white/15 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">Η κοινότητα σε αριθμούς</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {statsLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                      ) : (
                        metrics.map(({ label, value, icon: Icon }) => (
                          <div key={label} className="flex items-center gap-2">
                            <Icon className="h-4 w-4 shrink-0 text-cyan-200" />
                            <div className="min-w-0">
                              <span className="block text-lg font-bold leading-none text-white">
                                {formatMetricValue(value)}
                              </span>
                              <span className="block truncate text-[11px] font-medium uppercase tracking-wider text-cyan-100/80">{label}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
