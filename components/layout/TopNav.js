'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AcademicCapIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  FlagIcon,
  LifebuoyIcon,
  LightBulbIcon,
  MapPinIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserCircleIcon,
  UserPlusIcon,
  UsersIcon,
  VideoCameraIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import DropdownMenu from '@/components/ui/DropdownMenu';
import LoginLink from '@/components/ui/LoginLink';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function TopNav() {
  const tNav = useTranslations('nav');
  const { user, loading, logout } = useAuth();
  const { canAccessAdmin } = usePermissions();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopUserMenuOpen, setIsDesktopUserMenuOpen] = useState(false);

  const isPathActive = (path) => pathname === path || pathname.startsWith(path + '/');
  const isActive = (path) => (isPathActive(path) ? 'text-blue-600 border-b-2 border-blue-600' : '');
  const isMobileActive = (path) => (isPathActive(path) ? 'text-blue-700 bg-blue-50 font-semibold' : '');

  useEffect(() => {
    // Close all menus when pathname changes (navigation occurs)
    setIsMenuOpen(false);
    setIsDesktopUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const myLocationHref = user?.homeLocation?.slug
    ? `/locations/${user.homeLocation.slug}`
    : '/profile';

  const navSections = [
    {
      id: 'information',
      label: tNav('information'),
      menuId: 'desktop-nav-information-menu',
      items: [
        {
          id: 'articles',
          label: tNav('articles'),
          href: '/articles',
          icon: <DocumentTextIcon className="h-4 w-4" />,
          mobileIcon: <DocumentTextIcon className="h-5 w-5" />
        },
        {
          id: 'news',
          label: tNav('news'),
          href: '/news',
          icon: <NewspaperIcon className="h-4 w-4" />,
          mobileIcon: <NewspaperIcon className="h-5 w-5" />
        },
        {
          id: 'videos',
          label: tNav('videos'),
          href: '/videos',
          icon: <VideoCameraIcon className="h-4 w-4" />,
          mobileIcon: <VideoCameraIcon className="h-5 w-5" />
        }
      ]
    },
    {
      id: 'participation',
      label: tNav('participation'),
      menuId: 'desktop-nav-participation-menu',
      items: [
        {
          id: 'polls',
          label: tNav('polls'),
          href: '/polls',
          icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
          mobileIcon: <ClipboardDocumentListIcon className="h-5 w-5" />
        },
        {
          id: 'civic-questions',
          label: tNav('civic_polls'),
          href: '/civic-questions',
          icon: <ChatBubbleLeftRightIcon className="h-4 w-4" />,
          mobileIcon: <ChatBubbleLeftRightIcon className="h-5 w-5" />
        },
        {
          id: 'suggestions',
          label: tNav('suggestions'),
          href: '/suggestions',
          icon: <LightBulbIcon className="h-4 w-4" />,
          mobileIcon: <LightBulbIcon className="h-5 w-5" />
        },
        {
          id: 'dream-team',
          label: tNav('dream_team'),
          href: '/dream-team',
          icon: <TrophyIcon className="h-4 w-4" />,
          mobileIcon: <TrophyIcon className="h-5 w-5" />
        }
      ]
    },
    {
      id: 'community',
      label: tNav('community'),
      menuId: 'desktop-nav-community-menu',
      items: [
        {
          id: 'locations',
          label: tNav('locations'),
          href: '/locations',
          icon: <MapPinIcon className="h-4 w-4" />,
          mobileIcon: <MapPinIcon className="h-5 w-5" />
        },
        {
          id: 'cameras',
          label: tNav('cameras'),
          href: '/cameras',
          icon: <VideoCameraIcon className="h-4 w-4" />,
          mobileIcon: <VideoCameraIcon className="h-5 w-5" />
        },
        {
          id: 'users',
          label: tNav('users'),
          href: '/users',
          icon: <UsersIcon className="h-4 w-4" />,
          mobileIcon: <UsersIcon className="h-5 w-5" />
        },
        {
          id: 'independents',
          label: tNav('independents'),
          href: '/independents',
          icon: <FlagIcon className="h-4 w-4" />,
          mobileIcon: <FlagIcon className="h-5 w-5" />
        }
      ]
    },
    {
      id: 'pages',
      label: tNav('pages'),
      menuId: 'desktop-nav-pages-menu',
      items: [
        {
          id: 'platform',
          label: tNav('platform'),
          href: '/platform',
          icon: <WrenchScrewdriverIcon className="h-4 w-4" />,
          mobileIcon: <WrenchScrewdriverIcon className="h-5 w-5" />
        },
        {
          id: 'government',
          label: tNav('government'),
          href: '/elections',
          icon: <FlagIcon className="h-4 w-4" />,
          mobileIcon: <FlagIcon className="h-5 w-5" />
        },
        {
          id: 'citizen-help',
          label: tNav('citizen_help'),
          href: '/citizen-help',
          icon: <LifebuoyIcon className="h-4 w-4" />,
          mobileIcon: <LifebuoyIcon className="h-5 w-5" />
        },
        {
          id: 'education',
          label: tNav('education'),
          href: '/education',
          icon: <AcademicCapIcon className="h-4 w-4" />,
          mobileIcon: <AcademicCapIcon className="h-5 w-5" />
        },
      ]
    }
  ];

  // Keep the authenticated menu focused on account-level destinations.
  const userMenuItems = [
    {
      id: 'profile',
      label: tNav('my_profile'),
      href: '/profile',
      icon: <UserCircleIcon className="h-4 w-4" />,
      className: isActive('/profile')
    },
    {
      id: 'my-location',
      label: tNav('my_location'),
      href: myLocationHref,
      icon: <MapPinIcon className="h-4 w-4" />,
      className: isActive(myLocationHref)
    },
    ...(canAccessAdmin() ? [
      { divider: true },
      {
        id: 'admin',
        label: tNav('admin'),
        href: '/admin',
        icon: <ShieldCheckIcon className="h-4 w-4" />,
        className: isActive('/admin')
      }
    ] : []),
    { divider: true },
    {
      id: 'logout',
      label: tNav('logout'),
      icon: <ArrowRightOnRectangleIcon className="h-4 w-4" />,
      onClick: handleLogout,
      variant: 'danger'
    }
  ];

  const guestPrimaryItems = [
    {
      id: 'locations',
      label: tNav('locations'),
      href: '/locations',
      icon: <MapPinIcon className="h-4 w-4" />,
      mobileIcon: <MapPinIcon className="h-5 w-5" />,
    },
    {
      id: 'polls',
      label: tNav('polls'),
      href: '/polls',
      icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
      mobileIcon: <ClipboardDocumentListIcon className="h-5 w-5" />,
    },
    {
      id: 'suggestions',
      label: tNav('suggestions'),
      href: '/suggestions',
      icon: <LightBulbIcon className="h-4 w-4" />,
      mobileIcon: <LightBulbIcon className="h-5 w-5" />,
    },
    {
      id: 'news',
      label: tNav('news'),
      href: '/news',
      icon: <NewspaperIcon className="h-4 w-4" />,
      mobileIcon: <NewspaperIcon className="h-5 w-5" />,
    },
  ];

  const guestMoreItems = [
    {
      id: 'articles',
      label: tNav('articles'),
      href: '/articles',
      icon: <DocumentTextIcon className="h-4 w-4" />,
      mobileIcon: <DocumentTextIcon className="h-5 w-5" />,
    },
    {
      id: 'videos',
      label: tNav('videos'),
      href: '/videos',
      icon: <VideoCameraIcon className="h-4 w-4" />,
      mobileIcon: <VideoCameraIcon className="h-5 w-5" />,
    },
    {
      id: 'civic-questions',
      label: tNav('civic_polls'),
      href: '/civic-questions',
      icon: <ChatBubbleLeftRightIcon className="h-4 w-4" />,
      mobileIcon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
    },
    {
      id: 'dream-team',
      label: tNav('dream_team'),
      href: '/dream-team',
      icon: <TrophyIcon className="h-4 w-4" />,
      mobileIcon: <TrophyIcon className="h-5 w-5" />,
    },
    {
      id: 'users',
      label: tNav('users'),
      href: '/users',
      icon: <UsersIcon className="h-4 w-4" />,
      mobileIcon: <UsersIcon className="h-5 w-5" />,
    },
    {
      id: 'cameras',
      label: tNav('cameras'),
      href: '/cameras',
      icon: <VideoCameraIcon className="h-4 w-4" />,
      mobileIcon: <VideoCameraIcon className="h-5 w-5" />,
    },
    {
      id: 'platform',
      label: tNav('platform'),
      href: '/platform',
      icon: <WrenchScrewdriverIcon className="h-4 w-4" />,
      mobileIcon: <WrenchScrewdriverIcon className="h-5 w-5" />,
    },
    {
      id: 'government',
      label: tNav('government'),
      href: '/elections',
      icon: <FlagIcon className="h-4 w-4" />,
      mobileIcon: <FlagIcon className="h-5 w-5" />,
    },
    {
      id: 'citizen-help',
      label: tNav('citizen_help'),
      href: '/citizen-help',
      icon: <LifebuoyIcon className="h-4 w-4" />,
      mobileIcon: <LifebuoyIcon className="h-5 w-5" />,
    },
    {
      id: 'education',
      label: tNav('education'),
      href: '/education',
      icon: <AcademicCapIcon className="h-4 w-4" />,
      mobileIcon: <AcademicCapIcon className="h-5 w-5" />,
    },
  ];

  const guestNavSections = [
    {
      id: 'start',
      label: tNav('start_here'),
      menuId: 'desktop-nav-start-menu',
      items: guestPrimaryItems,
    },
    {
      id: 'more',
      label: tNav('more'),
      menuId: 'desktop-nav-more-menu',
      items: guestMoreItems,
    },
  ];

  const activeNavSections = user ? navSections : guestNavSections;

  const mobileAccountLinks = [
    {
      id: 'profile',
      label: tNav('my_profile'),
      href: '/profile',
      icon: <UserCircleIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive('/profile')}`
    },
    {
      id: 'my-location',
      label: tNav('my_location'),
      href: myLocationHref,
      icon: <MapPinIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive(myLocationHref)}`
    },
    ...(canAccessAdmin() ? [
      {
        id: 'admin',
        label: tNav('admin'),
        href: '/admin',
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isMobileActive('/admin')}`
      }
    ] : [])
  ];

  return (
    <nav
      className={[
        'relative z-20',
        'bg-sand border-b border-seafoam/70',
        'shadow-sm',
      ].join(' ')}
    >
      <div className="app-container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center" aria-label={tNav('home_aria')}>
              <Image
                src="/images/branding/appofasi-high-resolution-logo-transparent.png"
                alt={tNav('brand_alt')}
                width={312}
                height={72}
                className="h-9 w-auto"
                priority
              />
            </Link>
            <div className="hidden md:ml-6 md:flex md:items-center md:gap-2">
              {user ? navSections.map((section) => {
                const sectionActive = section.items.some((item) => isPathActive(item.href));

                return (
                  <DropdownMenu
                    key={section.id}
                    triggerText={section.label}
                    triggerClassName={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      sectionActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-blue-900 hover:bg-seafoam/40'
                    }`}
                    items={section.items.map((item) => ({
                      ...item,
                      className: isPathActive(item.href) ? 'bg-blue-50 text-blue-700 font-semibold' : '',
                    }))}
                    align="left"
                    menuId={section.menuId}
                  />
                );
              }) : (
                <>
                  {guestPrimaryItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isPathActive(item.href)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-blue-900 hover:bg-seafoam/40'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                  <DropdownMenu
                    triggerText={tNav('more')}
                    triggerClassName={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      guestMoreItems.some((item) => isPathActive(item.href))
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-blue-900 hover:bg-seafoam/40'
                    }`}
                    items={guestMoreItems.map((item) => ({
                      ...item,
                      className: isPathActive(item.href) ? 'bg-blue-50 text-blue-700 font-semibold' : '',
                    }))}
                    align="left"
                    menuId="desktop-nav-more-menu"
                  />
                </>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 ml-auto">
            {loading ? (
              <div className="flex items-center gap-4">
                <SkeletonLoader type="button" count={2} className="flex gap-4" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <DropdownMenu
                   triggerText={`${tNav('greeting')} ${user.username}`}
                  items={userMenuItems}
                  align="right"
                  showChevron={true}
                  menuId="desktop-user-menu"
                  open={isDesktopUserMenuOpen}
                  onOpenChange={setIsDesktopUserMenuOpen}
                />
              </div>
            ) : (
              <>
                <LoginLink
                  className="inline-flex items-center gap-2 rounded-md border border-blue-300 px-3 py-2 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <ArrowLeftOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                  {tNav('login')}
                </LoginLink>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                  {tNav('register')}
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-blue-900 hover:bg-seafoam/40 md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="sr-only">{isMenuOpen ? tNav('close_menu') : tNav('open_menu')}</span>
            {isMenuOpen ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} max-h-[calc(100dvh-4rem)] overflow-y-auto`} id="mobile-menu">
        <div className="border-t border-seafoam px-4 py-4 space-y-4">
          {activeNavSections.map((section) => (
            <section key={section.id} aria-labelledby={`mobile-nav-section-${section.id}`}>
              <p
                id={`mobile-nav-section-${section.id}`}
                className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-blue-700"
              >
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-blue-900 transition-colors hover:bg-seafoam/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${isMobileActive(item.href)}`}
                  >
                    <span aria-hidden="true">{item.mobileIcon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="border-t border-seafoam px-4 py-3 space-y-3">
          {loading ? (
            <div className="space-y-2">
              <SkeletonLoader type="button" count={2} className="space-y-2" />
            </div>
          ) : user ? (
            <>
              <div className="flex items-center justify-between gap-3 rounded-md border border-seafoam bg-white px-3 py-2 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-blue-900">
                    {tNav('greeting')} {user.username}
                  </p>
                  <p className="text-xs text-gray-500">{tNav('notifications')}</p>
                </div>
                <NotificationBell />
              </div>
              <div className="space-y-1">
                {mobileAccountLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-blue-900 transition-colors hover:bg-seafoam/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${item.className}`}
                  >
                    <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                    <span className="min-w-0 break-words">{item.label}</span>
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full min-h-11 items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-red-600 transition-colors hover:bg-seafoam/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {tNav('logout')}
              </button>
            </>
          ) : (
            <>
              <LoginLink
                onClick={() => setIsMenuOpen(false)}
                className="flex w-full min-h-11 items-center justify-center gap-2 rounded-md border border-blue-300 px-4 py-2 text-base font-medium text-blue-900 transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                {tNav('login')}
              </LoginLink>
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="flex w-full min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
                {tNav('register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
