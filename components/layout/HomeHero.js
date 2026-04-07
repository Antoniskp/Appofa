'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { statsAPI, heroSettingsAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { 
  MapPinIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  NewspaperIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  FlagIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_BG_COLOR = '#1a2a3a';
const DEFAULT_TITLE = 'Αποφάσεις που ξεκινούν από εσένα.';
const DEFAULT_SUBTITLE = 'Συμμετείχε σε ανοιχτές ψηφοφορίες, κατέθεσε προτάσεις και επηρέασε τις εξελίξεις στην περιοχή σου με διαφάνεια και πραγματικό αντίκτυπο.';
const SLIDE_INTERVAL_MS = 5000;

const NAV_CARDS = [
  {
    icon: NewspaperIcon,
    title: 'Ειδήσεις',
    description: 'Όλα τα media σε ένα σημείο',
    href: '/news',
  },
  {
    icon: ChartBarIcon,
    title: 'Ψηφοφορίες',
    description: 'Ψηφίστε & δείτε τάσεις',
    href: '/polls',
  },
  {
    icon: DocumentTextIcon,
    title: 'Άρθρα',
    description: 'Αναλύσεις & απόψεις πολιτών',
    href: '/articles',
  },
  {
    icon: AcademicCapIcon,
    title: 'Εκπαίδευση',
    description: 'Μάθε πώς λειτουργεί η εκπαίδευση στο κράτος',
    href: '/education',
  },
  {
    icon: FlagIcon,
    title: 'Αποστολή',
    description: 'Τι επιδιώκουμε',
    href: '/mission',
  },
  {
    icon: UsersIcon,
    title: 'Dream Team',
    description: 'Ψήφισε για την ιδανική κυβέρνηση',
    href: '/dream-team',
  },
  {
    icon: HandRaisedIcon,
    title: 'Συνεισφορά',
    description: 'Βοήθησε το project',
    href: '/contribute',
  },
];

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

  const metrics = stats ? [
    { label: 'Χρήστες',       value: stats.totalUsers,    icon: UsersIcon },
    { label: 'Ψηφοφορίες',    value: stats.totalPolls,    icon: ChartBarIcon },
    { label: 'Ψήφοι',         value: stats.totalVotes,    icon: CheckBadgeIcon },
    { label: 'Σχόλια',        value: stats.totalComments, icon: ChatBubbleLeftRightIcon },
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
  const hasLink = currentSlide && currentSlide.linkUrl && /^https?:\/\//.test(currentSlide.linkUrl);
  const linkText = (currentSlide && currentSlide.linkText) ? currentSlide.linkText : 'Μάθε περισσότερα';
  const showArrows = activeSlides.length >= 2;

  return (
    <>
      {/* Hero banner */}
      <section
        className="relative overflow-hidden text-white"
        style={heroStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Dark overlay for image backgrounds */}
        {heroBg.type === 'image' && (
          <div className="absolute inset-0 bg-black/55 pointer-events-none" />
        )}

        <div className="relative app-container py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 animate-fade-in">

            {/* Left – text & actions */}
            <div className="flex-1 min-w-0">
              {!authLoading && user && (
                <p className="text-sm mb-1 text-cyan-100 font-medium">
                  Καλώς ήρθες, {user.firstNameNative || user.username}!
                </p>
              )}

              {/* Slide title/subtitle – all slides stacked absolutely to prevent reflow */}
              <div className="relative min-h-[11rem] md:min-h-[7rem]">
                {activeSlides.length > 0 ? (
                  activeSlides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        idx === currentSlideIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    >
                      <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight tracking-tight">
                        {slide.title}
                      </h1>
                      <p className="text-base text-white/80 mb-3">
                        {slide.subtitle}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="absolute inset-0">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight tracking-tight">
                      {DEFAULT_TITLE}
                    </h1>
                    <p className="text-base text-white/80 mb-3">
                      {DEFAULT_SUBTITLE}
                    </p>
                  </div>
                )}
              </div>

              {/* CTA link – always rendered to reserve space; hidden when no link */}
              <div className={`mb-3 transition-opacity duration-500 ${hasLink ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <a
                  href={currentSlide?.linkUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={hasLink ? 0 : -1}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/30 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/30"
                >
                  {linkText}
                  <ArrowRightIcon className="w-4 h-4" />
                </a>
              </div>

              {/* Arrow navigation */}
              {showArrows && (
                <div className="flex items-center gap-3 mb-4">
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
              )}

              <div className="flex flex-wrap gap-3">
                <Link 
                  href={!authLoading && user?.homeLocation ? `/locations/${user.homeLocation.slug}` : '/locations'} 
                  className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-600 focus:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-white/50 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:-translate-y-0.5 transform"
                >
                  <MapPinIcon className="w-4 h-4" />
                  {!authLoading && user?.homeLocation ? 'Δες την Περιοχή σου' : 'Βρες την Περιοχή σου'}
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>

                <Link 
                  href="/polls" 
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/30"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  Δες Ψηφοφορίες
                </Link>

                {!authLoading && user && (
                  (user.role === 'admin' || user.role === 'moderator') ? (
                    <Link 
                      href="/admin" 
                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/30"
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                      Admin / Moderator
                    </Link>
                  ) : (
                    <Link 
                      href="/become-moderator" 
                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/30"
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                      Γίνε Moderator
                    </Link>
                  )
                )}

                {!authLoading && !user && (
                  <Link 
                    href="/register" 
                    className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-cyan-50 focus:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:-translate-y-0.5 transform"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Εγγραφή
                  </Link>
                )}
              </div>
            </div>

            {/* Right – community stats */}
            {(statsLoading || metrics) && (
              <div className="md:w-64 lg:w-72 shrink-0">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-4 grid grid-cols-2 gap-4 animate-fade-in">
                  {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                  ) : (
                    metrics.map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex flex-col items-center gap-0.5">
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
            )}

          </div>
        </div>

        {/* Icon navigation cards */}
        <div className="relative app-container pb-8">
          <div className="flex flex-wrap justify-center gap-4">
            {NAV_CARDS.map(({ icon: Icon, title, description, href }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-3 p-5 bg-white border border-gray-200 rounded-2xl text-center hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 group w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.75rem)] lg:w-40"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
