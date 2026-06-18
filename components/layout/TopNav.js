'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AcademicCapIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  FlagIcon,
  LifebuoyIcon,
  LightBulbIcon,
  MapPinIcon,
  NewspaperIcon,
  PencilSquareIcon,
  ServerIcon,
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
import Tooltip from '@/components/ui/Tooltip';
import LoginLink from '@/components/ui/LoginLink';
import NotificationBell from '@/components/notifications/NotificationBell';
import CountrySwitcher from '@/components/geo/CountrySwitcher';

export default function TopNav() {
  const tNav = useTranslations('nav');
  const { user, loading, logout } = useAuth();
  const { isAdmin, canAccessAdmin } = usePermissions();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopUserMenuOpen, setIsDesktopUserMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);

  const isPathActive = (path) => pathname === path || pathname.startsWith(path + '/');
  const isActive = (path) => (isPathActive(path) ? 'text-blue-600 border-b-2 border-blue-600' : '');
  const isMobileActive = (path) => (isPathActive(path) ? 'text-blue-700 bg-blue-50 font-semibold' : '');

  useEffect(() => {
    // Close all menus when pathname changes (navigation occurs)
    setIsMenuOpen(false);
    setIsDesktopUserMenuOpen(false);
    setIsMobileUserMenuOpen(false);
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
        }
      ]
    }
  ];

  // Build user menu items for DropdownMenu (desktop - smaller icons)
  const userMenuItems = [
    {
      id: 'profile',
      label: tNav('my_profile'),
      href: '/profile',
      icon: <UserCircleIcon className="h-4 w-4" />,
      className: isActive('/profile')
    },
    {
      id: 'my-articles',
      label: tNav('my_articles'),
      href: '/editor',
      icon: <PencilSquareIcon className="h-4 w-4" />,
      className: isActive('/editor')
    },
    {
      id: 'my-news',
      label: tNav('my_news'),
      href: '/my-news',
      icon: <NewspaperIcon className="h-4 w-4" />,
      className: isActive('/my-news')
    },
    {
      id: 'my-polls',
      label: tNav('my_polls'),
      href: '/my-polls',
      icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
      className: isActive('/my-polls')
    },
    {
      id: 'my-votes',
      label: tNav('my_votes'),
      href: '/my-votes',
      icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
      className: isActive('/my-votes')
    },
    {
      id: 'my-location',
      label: tNav('my_location'),
      href: myLocationHref,
      icon: <MapPinIcon className="h-4 w-4" />,
      className: isActive(myLocationHref)
    },
    {
      id: 'suggest',
      label: tNav('my_suggestions'),
      href: '/suggestions?mine=true',
      icon: <LightBulbIcon className="h-4 w-4" />,
      className: isActive('/suggestions')
    },
    {
      id: 'my-organizations',
      label: tNav('my_organizations'),
      href: '/organizations?mine=true',
      icon: <BuildingOffice2Icon className="h-4 w-4" />,
      className: isActive('/organizations')
    },
    ...(canAccessAdmin() ? [
      { divider: true },
      {
        id: 'admin',
        label: tNav('admin'),
        href: '/admin',
        icon: <ShieldCheckIcon className="h-4 w-4" />,
        className: isActive('/admin')
      },
      ...(isAdmin ? [{
        id: 'admin-status',
          label: tNav('admin_diagnostics'),
        href: '/admin/status',
        icon: <ServerIcon className="h-4 w-4" />,
        className: isActive('/admin/status')
      }] : [])
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

  // Build mobile menu items (larger icons and font)
  const mobileMenuItems = [
    {
      id: 'profile',
      label: tNav('my_profile'),
      href: '/profile',
      icon: <UserCircleIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive('/profile')}`
    },
    {
      id: 'my-articles',
      label: tNav('my_articles'),
      href: '/editor',
      icon: <PencilSquareIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive('/editor')}`
    },
    {
      id: 'my-news',
      label: tNav('my_news'),
      href: '/my-news',
      icon: <NewspaperIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive('/my-news')}`
    },
    {
      id: 'my-polls',
      label: tNav('my_polls'),
      href: '/my-polls',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive('/my-polls')}`
    },
    {
      id: 'my-votes',
      label: tNav('my_votes'),
      href: '/my-votes',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive('/my-votes')}`
    },
    {
      id: 'my-location',
      label: tNav('my_location'),
      href: myLocationHref,
      icon: <MapPinIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive(myLocationHref)}`
    },
    {
      id: 'suggest',
      label: tNav('my_suggestions'),
      href: '/suggestions?mine=true',
      icon: <LightBulbIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive('/suggestions')}`
    },
    {
      id: 'my-organizations',
      label: tNav('my_organizations'),
      href: '/organizations?mine=true',
      icon: <BuildingOffice2Icon className="h-5 w-5" />,
      className: `text-base font-medium ${isMobileActive('/organizations')}`
    },
    ...(canAccessAdmin() ? [
      { divider: true },
      {
        id: 'admin',
        label: tNav('admin'),
        href: '/admin',
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isMobileActive('/admin')}`
      },
      ...(isAdmin ? [{
        id: 'admin-status',
          label: tNav('admin_diagnostics'),
        href: '/admin/status',
        icon: <ServerIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isMobileActive('/admin/status')}`
      }] : [])
    ] : []),
    { divider: true },
    {
      id: 'logout',
      label: tNav('logout'),
      icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />,
      onClick: handleLogout,
      variant: 'danger',
      className: 'text-base font-medium'
    }
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
              {navSections.map((section) => {
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
              })}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 ml-auto">
            {loading ? (
              <div className="flex items-center gap-4">
                <SkeletonLoader type="button" count={2} className="flex gap-4" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <CountrySwitcher />
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
                <CountrySwitcher />
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
          <Tooltip content={isMenuOpen ? tNav('close_menu') : tNav('open_menu')} position="bottom">
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
          </Tooltip>
        </div>
      </div>
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} max-h-[calc(100dvh-4rem)] overflow-y-auto`} id="mobile-menu">
        <div className="border-t border-seafoam px-4 py-4 space-y-4">
          {navSections.map((section) => (
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
          <CountrySwitcher className="text-base" />
          {loading ? (
            <div className="space-y-2">
              <SkeletonLoader type="button" count={2} className="space-y-2" />
            </div>
          ) : user ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <NotificationBell />
                 <span className="text-sm text-gray-500">{tNav('notifications')}</span>
              </div>
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="flex w-full min-w-0 items-center justify-between rounded-md border border-seafoam bg-white px-3 py-2 text-sm font-medium text-blue-900 shadow-sm"
                  >
                    <span className="truncate min-w-0">{tNav('greeting')} {user.username}</span>
                    <ChevronDownIcon
                      className={`ml-2 h-4 w-4 flex-shrink-0 transition-transform ${isMobileUserMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                }
                items={mobileMenuItems}
                align="left"
                menuId="mobile-user-menu"
                menuClassName="w-full max-h-[55vh] overflow-y-auto"
                open={isMobileUserMenuOpen}
                onOpenChange={setIsMobileUserMenuOpen}
              />
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
