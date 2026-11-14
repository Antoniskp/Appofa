'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import LoginLink from '@/components/ui/LoginLink';
import {
  HomeIcon,
  BuildingOffice2Icon,
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
const EXPLORE_ROOTS = ['/news', '/articles', '/videos', '/topics', '/live'];

// Route groups that belong to the "Participate" tab (used for active-state only)
const PARTICIPATE_ROOTS = ['/polls', '/civic-questions', '/suggestions', '/dream-team', '/organizations', '/positions'];
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(element => (
    element.tabIndex >= 0 && !element.closest('[hidden], [aria-hidden="true"]')
  ));
}

export default function MobileBottomNav() {
  const t = useTranslations('nav');
  const tOrganizations = useTranslations('organizations');
  const tPositions = useTranslations('positions');
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const dialogRef = useRef(null);
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
        return;
      }
      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusableElements = getFocusableElements(dialog);
      if (!focusableElements.length) {
        e.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const focusIsOutsideDialog = !dialog.contains(document.activeElement);
      if (e.shiftKey && (focusIsOutsideDialog || document.activeElement === firstElement)) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && (focusIsOutsideDialog || document.activeElement === lastElement)) {
        e.preventDefault();
        firstElement.focus();
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

  // â”€â”€ Shared styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tabClass = (active) =>
    [
      'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl py-1 text-[10px] font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600',
      active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600',
    ].join(' ');

  const iconClass = (active) =>
    ['h-5 w-5 transition-colors', active ? 'text-blue-700' : 'text-gray-600'].join(' ');

  const tabLabelClass = 'max-w-full whitespace-nowrap leading-tight';

  return (
    <>
      {/* â”€â”€ Fixed bottom bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <nav
        aria-label={t('bottom_nav_aria')}
        className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-seafoam bg-white/95 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-16">
          {/* Home */}
          <Link href="/" aria-label={t('bottom_home')} aria-current={isHomeActive ? 'page' : undefined} className={tabClass(isHomeActive)}>
            <HomeIcon className={iconClass(isHomeActive)} aria-hidden="true" />
            <span className={tabLabelClass} aria-hidden="true">{t('bottom_home')}</span>
          </Link>

          {/* Explore */}
          <Link href="/news" aria-label={t('bottom_explore')} aria-current={isExploreActive ? 'page' : undefined} className={tabClass(isExploreActive)}>
            <NewspaperIcon className={iconClass(isExploreActive)} aria-hidden="true" />
            <span className={tabLabelClass} aria-hidden="true">{t('bottom_explore')}</span>
          </Link>

          {/* Participate â€“ centre action */}
          <button
            ref={participateButtonRef}
            type="button"
            aria-label={t('bottom_participate')}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
            onClick={() => setSheetOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700"
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
                'text-[10px] font-semibold leading-tight transition-colors',
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
              <span className={tabLabelClass}>{t('bottom_my_area')}</span>
            </div>
          ) : (
            <Link href={myAreaHref} aria-label={t('bottom_my_area')} aria-current={isMyAreaActive ? 'page' : undefined} className={tabClass(isMyAreaActive)}>
              <MapPinIcon className={iconClass(isMyAreaActive)} aria-hidden="true" />
              <span className={tabLabelClass} aria-hidden="true">{t('bottom_my_area')}</span>
            </Link>
          )}

          {/* You */}
          {loading ? (
            <div className={tabClass(false)} aria-hidden="true">
              <UserCircleIcon className="h-6 w-6 text-gray-300" />
              <span className={tabLabelClass}>{t('bottom_you')}</span>
            </div>
          ) : user ? (
            <Link href="/profile" aria-label={t('bottom_you')} aria-current={isYouActive ? 'page' : undefined} className={tabClass(isYouActive)}>
              <UserCircleIcon className={iconClass(isYouActive)} aria-hidden="true" />
              <span className={tabLabelClass} aria-hidden="true">{t('bottom_you')}</span>
            </Link>
          ) : (
            <LoginLink aria-label={t('bottom_you')} className={tabClass(false)}>
              <UserCircleIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
              <span aria-hidden="true">{t('bottom_you')}</span>
            </LoginLink>
          )}
        </div>
      </nav>

      {/* â”€â”€ Participate action sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="participate-sheet-title"
            tabIndex={-1}
            className="md:hidden fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-white shadow-xl"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
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
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors hover:bg-seafoam/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
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

                <Link href="/positions" onClick={handleCloseSheet} className="flex min-h-[44px] items-center gap-3 rounded-xl bg-ivory px-4 py-3 text-sm font-medium text-charcoal hover:bg-sand">
                  <ClipboardDocumentListIcon className="h-5 w-5" aria-hidden="true" />
                  {tPositions('heading')}
                </Link>
                <Link href="/elections/political-parties" onClick={handleCloseSheet} className="flex min-h-[44px] items-center gap-3 rounded-xl bg-ivory px-4 py-3 text-sm font-medium text-charcoal hover:bg-sand">
                  <BuildingOffice2Icon className="h-5 w-5" aria-hidden="true" />
                  {tOrganizations('parties')}
                </Link>
                <Link href="/organizations" onClick={handleCloseSheet} className="flex min-h-[44px] items-center gap-3 rounded-xl bg-ivory px-4 py-3 text-sm font-medium text-charcoal hover:bg-sand">
                  <BuildingOffice2Icon className="h-5 w-5" aria-hidden="true" />
                  {tOrganizations('title')}
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
