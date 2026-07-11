'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import LoginLink from '@/components/ui/LoginLink';
import {
  HomeIcon,
  NewspaperIcon,
  PlusCircleIcon,
  MapPinIcon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Route groups that belong to the "Explore" tab
const EXPLORE_ROOTS = ['/news', '/articles', '/videos', '/topics'];

// Route groups that belong to the "Participate" tab (used for active-state only)
const PARTICIPATE_ROOTS = ['/polls', '/civic-questions', '/suggestions', '/dream-team'];

export default function MobileBottomNav() {
  const t = useTranslations('nav');
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const participateButtonRef = useRef(null);

  // My area destination
  const myAreaHref = user?.homeLocation?.slug
    ? `/locations/${user.homeLocation.slug}`
    : '/locations';

  // Active-state helpers
  const isPathActive = useCallback(
    (root) => pathname === root || pathname.startsWith(root + '/'),
    [pathname]
  );
  const isHomeActive = pathname === '/';
  const isExploreActive = EXPLORE_ROOTS.some(isPathActive);
  const isParticipateActive = PARTICIPATE_ROOTS.some(isPathActive);
  const isMyAreaActive = isPathActive(myAreaHref);
  const isYouActive = isPathActive('/profile');

  // Close action sheet on navigation
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Focus first element when sheet opens; restore focus when it closes
  useEffect(() => {
    if (sheetOpen) {
      // Defer to let the DOM render
      const raf = requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [sheetOpen]);

  // Escape key closes the sheet
  useEffect(() => {
    if (!sheetOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSheetOpen(false);
        participateButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sheetOpen]);

  // Body scroll-lock while action sheet is open
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    participateButtonRef.current?.focus();
  }, []);

  // ── Shared styles ──────────────────────────────────────────────────────────
  const tabClass = (active) =>
    [
      'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-1 text-[11px] font-medium transition-colors',
      active ? 'text-blue-700' : 'text-gray-500 hover:text-blue-600',
    ].join(' ');

  const iconClass = (active) =>
    ['h-6 w-6 transition-colors', active ? 'text-blue-700' : 'text-gray-500'].join(' ');

  return (
    <>
      {/* ── Fixed bottom bar ─────────────────────────────────────────────── */}
      <nav
        aria-label={t('bottom_nav_aria')}
        className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-seafoam"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-16">
          {/* Home */}
          <Link href="/" aria-label={t('bottom_home')} className={tabClass(isHomeActive)}>
            <HomeIcon className={iconClass(isHomeActive)} aria-hidden="true" />
            <span aria-hidden="true">{t('bottom_home')}</span>
          </Link>

          {/* Explore */}
          <Link href="/news" aria-label={t('bottom_explore')} className={tabClass(isExploreActive)}>
            <NewspaperIcon className={iconClass(isExploreActive)} aria-hidden="true" />
            <span aria-hidden="true">{t('bottom_explore')}</span>
          </Link>

          {/* Participate – centre action */}
          <button
            ref={participateButtonRef}
            type="button"
            aria-label={t('bottom_participate')}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-1 transition-colors focus-visible:outline-none"
          >
            <span
              className={[
                'flex items-center justify-center rounded-full p-1.5 -mt-3 transition-colors shadow-md',
                isParticipateActive
                  ? 'bg-blue-700 ring-2 ring-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700',
              ].join(' ')}
            >
              <PlusCircleIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </span>
            <span
              className={[
                'text-[11px] font-semibold transition-colors',
                isParticipateActive ? 'text-blue-700' : 'text-blue-600',
              ].join(' ')}
              aria-hidden="true"
            >
              {t('bottom_participate')}
            </span>
          </button>

          {/* My area */}
          {loading ? (
            <div className={tabClass(false)} aria-hidden="true">
              <MapPinIcon className="h-6 w-6 text-gray-300" />
              <span>{t('bottom_my_area')}</span>
            </div>
          ) : (
            <Link href={myAreaHref} aria-label={t('bottom_my_area')} className={tabClass(isMyAreaActive)}>
              <MapPinIcon className={iconClass(isMyAreaActive)} aria-hidden="true" />
              <span aria-hidden="true">{t('bottom_my_area')}</span>
            </Link>
          )}

          {/* You */}
          {loading ? (
            <div className={tabClass(false)} aria-hidden="true">
              <UserCircleIcon className="h-6 w-6 text-gray-300" />
              <span>{t('bottom_you')}</span>
            </div>
          ) : user ? (
            <Link href="/profile" aria-label={t('bottom_you')} className={tabClass(isYouActive)}>
              <UserCircleIcon className={iconClass(isYouActive)} aria-hidden="true" />
              <span aria-hidden="true">{t('bottom_you')}</span>
            </Link>
          ) : (
            <LoginLink aria-label={t('bottom_you')} className={tabClass(false)}>
              <UserCircleIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
              <span aria-hidden="true">{t('bottom_you')}</span>
            </LoginLink>
          )}
        </div>
      </nav>

      {/* ── Participate action sheet ──────────────────────────────────────── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            aria-hidden="true"
            onClick={handleCloseSheet}
          />

          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="participate-sheet-title"
            className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl"
            style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" aria-hidden="true" />
            </div>

            <div className="px-4 pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="participate-sheet-title"
                  className="text-base font-semibold text-blue-900"
                >
                  {t('bottom_participate_sheet_title')}
                </h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={handleCloseSheet}
                  className="p-1.5 rounded-full hover:bg-seafoam/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                  aria-label={t('bottom_participate_close')}
                >
                  <XMarkIcon className="h-5 w-5 text-gray-600" aria-hidden="true" />
                </button>
              </div>

              {/* Action items */}
              <div className="space-y-2">
                <Link
                  href="/polls"
                  onClick={handleCloseSheet}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-blue-900">
                    {t('bottom_participate_vote')}
                  </span>
                </Link>

                <Link
                  href="/civic-questions"
                  onClick={handleCloseSheet}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-blue-900">
                    {t('bottom_participate_civic')}
                  </span>
                </Link>

                <Link
                  href="/suggestions"
                  onClick={handleCloseSheet}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <LightBulbIcon className="h-5 w-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-blue-900">
                    {t('bottom_participate_ideas')}
                  </span>
                </Link>

                {user && (
                  <Link
                    href="/suggestions/new"
                    onClick={handleCloseSheet}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-seafoam/30 hover:bg-seafoam/50 transition-colors min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <LightBulbIcon className="h-5 w-5 text-blue-700 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium text-blue-900">
                      {t('bottom_participate_suggest')}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
