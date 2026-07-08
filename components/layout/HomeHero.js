'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { statsAPI, heroSettingsAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { 
  ChartBarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UsersIcon,
  LightBulbIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_BG_COLOR = '#1a2a3a';
const DEFAULT_TITLE = 'Η φωνή των ανεξάρτητων, οι αποφάσεις της κοινότητας.';
const DEFAULT_SUBTITLE = 'Δίνουμε ορατότητα σε ανεξάρτητους υποψηφίους και ενεργούς πολίτες με εργαλεία για κοινές αποφάσεις, ενώ κόμματα και οργανώσεις συμμετέχουν ισότιμα στον δημόσιο διάλογο.';
const SLIDE_INTERVAL_MS = 5000;

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 animate-pulse">
      <div className="h-7 w-16 bg-white/20 rounded-md" />
      <div className="h-4 w-14 bg-white/15 rounded" />
    </div>
  );
}

export default function HomeHero() {
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
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-slate-950/35 to-cyan-950/55 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />

        <div className="relative app-container py-12 md:py-16 lg:py-20">
          <div className="flex flex-col md:flex-row md:items-center gap-7 md:gap-10 animate-fade-in">

            {/* Left – text & actions */}
            <div className="flex-1 min-w-0 max-w-3xl">
              {!authLoading && user && (
                <p className="text-sm mb-2 text-cyan-100 font-medium">
                  Καλώς ήρθες, {user.firstNameNative || user.username}!
                </p>
              )}

              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-50 backdrop-blur">
                Χώρος ανεξάρτητων φωνών · Εργαλείο αποφάσεων
              </p>

              <div
                key={currentSlide?.id || 'default-slide'}
                className="mt-4 min-h-[11.5rem] overflow-hidden animate-fade-in md:min-h-[14rem]"
                aria-live="polite"
                aria-atomic="true"
              >
                <h1 className="mb-3 line-clamp-2 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
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
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-5 py-2.5 font-semibold text-white backdrop-blur-md transition hover:bg-white/30 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
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
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-5 py-2.5 font-semibold text-white backdrop-blur-md transition hover:bg-white/30 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
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

            </div>

            {/* Right – community stats */}
            {counterEnabled && (statsLoading || metrics) && (
              <div className="md:w-72 lg:w-80 shrink-0">
                <div className="rounded-lg border border-white/20 bg-white/[0.12] p-4 shadow-2xl shadow-black/10 backdrop-blur-md animate-fade-in">
                  <div className="mb-4 border-b border-white/15 pb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">Η κοινότητα σε αριθμούς</p>
                    <p className="mt-1 text-sm text-white/75">Ψηφοφορίες, προτάσεις και συμμετοχή που μεγαλώνουν καθημερινά.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                  ) : (
                    metrics.map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex min-h-20 flex-col items-center justify-center gap-0.5 rounded-lg bg-white/10 px-2 py-3">
                        <Icon className="w-4 h-4 text-cyan-200 mb-0.5" />
                        <span className="text-xl font-bold leading-none">
                          {typeof value === 'number' ? value.toLocaleString('el-GR') : '—'}
                        </span>
                        <span className="text-xs font-medium text-cyan-100/80 uppercase tracking-wider">{label}</span>
                      </div>
                    ))
                  )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
}
