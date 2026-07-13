'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { heroSettingsAPI, pollAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { 
  ArrowRightIcon,
  ArrowLeftIcon,
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

function FeaturedLivePoll({ poll, loading, user }) {
  const [currentPoll, setCurrentPoll] = useState(poll);
  const [selectedOptionId, setSelectedOptionId] = useState(poll?.userVote?.optionId || null);
  const [submittingOptionId, setSubmittingOptionId] = useState(null);
  const [voteError, setVoteError] = useState(null);

  useEffect(() => {
    setCurrentPoll(poll);
    setSelectedOptionId(poll?.userVote?.optionId || null);
    setSubmittingOptionId(null);
    setVoteError(null);
  }, [poll]);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/15 backdrop-blur-md">
        <div className="h-3 w-32 animate-pulse rounded bg-white/20" />
        <div className="mt-3 h-5 w-full animate-pulse rounded bg-white/20" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-8 animate-pulse rounded bg-white/15" />
          <div className="h-8 animate-pulse rounded bg-white/15" />
        </div>
      </div>
    );
  }

  if (!currentPoll) return null;

  const options = Array.isArray(currentPoll.options) ? currentPoll.options : [];
  const isPollActive = currentPoll.status === 'active' && (!currentPoll.deadline || new Date(currentPoll.deadline) > new Date());
  const canVote = isPollActive && (user || currentPoll.voteRestriction === 'anyone');
  const totalVotes = options.reduce((sum, option) => sum + (option.voteCount || 0), 0);

  const handleVote = async (optionId) => {
    if (!canVote || submittingOptionId) return;

    setSubmittingOptionId(optionId);
    setVoteError(null);

    try {
      const response = await pollAPI.vote(currentPoll.id, optionId);
      const voteCounts = response?.data?.voteCounts || {};
      setSelectedOptionId(optionId);
      setCurrentPoll((prev) => ({
        ...prev,
        userVote: { optionId, createdAt: new Date().toISOString() },
        options: (prev.options || []).map((option) => ({
          ...option,
          voteCount: voteCounts[String(option.id)] ?? voteCounts[option.id] ?? option.voteCount ?? 0,
        })),
      }));
    } catch (error) {
      setVoteError(error?.message || 'Η ψήφος δεν καταχωρίστηκε.');
    } finally {
      setSubmittingOptionId(null);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-200/25 bg-white/[0.16] p-5 shadow-2xl shadow-black/15 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
        Δημόσια γνώμη
      </p>
      <h2 className="mt-2 text-xl font-bold leading-7 text-white">
        {currentPoll.title}
      </h2>
      {currentPoll.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/75">
          {currentPoll.description}
        </p>
      )}

      <div className="mt-5 space-y-2">
        {options.map((option) => {
          const count = option.voteCount || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = selectedOptionId === option.id;
          const isSubmitting = submittingOptionId === option.id;

          if (selectedOptionId) {
            return (
              <button
                key={option.id}
                type="button"
                disabled={!canVote || Boolean(submittingOptionId)}
                onClick={() => handleVote(option.id)}
                className="group w-full rounded-lg border border-white/15 bg-white/10 p-3 text-left transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-75"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className={`font-semibold ${isSelected ? 'text-emerald-100' : 'text-white/85'}`}>
                    {option.text || option.displayText}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-white">
                    {percentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-emerald-300' : 'bg-cyan-200/70'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-white/55">
                  {count.toLocaleString('el-GR')} {count === 1 ? 'ψήφος' : 'ψήφοι'}
                </p>
              </button>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={!canVote || Boolean(submittingOptionId)}
              onClick={() => handleVote(option.id)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-left text-sm font-semibold text-white transition hover:border-emerald-200/60 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-200/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{option.text || option.displayText}</span>
              <span className="text-xs text-white/65">
                {isSubmitting ? '...' : 'Ψήφος'}
              </span>
            </button>
          );
        })}
      </div>

      {voteError && (
        <p className="mt-3 rounded-lg border border-red-200/25 bg-red-500/15 px-3 py-2 text-xs font-medium text-red-50">
          {voteError}
        </p>
      )}
      {!canVote && isPollActive && (
        <p className="mt-3 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/75">
          Συνδέσου για να ψηφίσεις σε αυτή τη ψηφοφορία.
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-white/70">
          {totalVotes.toLocaleString('el-GR')} {totalVotes === 1 ? 'ψήφος' : 'ψήφοι'}
        </span>
        {!isPollActive && (
          <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
            Η ψηφοφορία έληξε
          </span>
        )}
      </div>
    </div>
  );
}

export default function HomeHero({ featuredPoll = null, featuredPollLoading = false }) {
  const { user, loading: authLoading } = useAuth();
  const [heroBg, setHeroBg] = useState({ type: 'color', value: DEFAULT_BG_COLOR });
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // Fetch hero background settings (side-effect only — sets heroBg state)
  useAsyncData(
    () => heroSettingsAPI.get(),
    [],
    {
      onSuccess: (res) => {
        if (!res?.success) return;
        const { backgroundImageUrl, backgroundColor } = res.data;
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
                  <FeaturedLivePoll poll={featuredPoll} loading={featuredPollLoading} user={user} />
                </div>
              )}

            </div>

            {(featuredPoll || featuredPollLoading) && (
              <div className="relative hidden lg:block">
                <FeaturedLivePoll poll={featuredPoll} loading={featuredPollLoading} user={user} />
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
}
