'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  LightBulbIcon,
  MapPinIcon,
  NewspaperIcon,
  PencilSquareIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import DropdownMenu from '@/components/ui/DropdownMenu';
import Tooltip from '@/components/ui/Tooltip';
import LoginLink from '@/components/ui/LoginLink';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function TopNav() {
  const tNav = useTranslations('nav');
  const { user, loading, logout } = useAuth();
  const { isAdmin, canAccessAdmin } = usePermissions();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopUserMenuOpen, setIsDesktopUserMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);

  const isActive = (path) => {
    // Check if current path starts with the given path
    const isCurrentPath = pathname === path || pathname.startsWith(path + '/');
    return isCurrentPath ? 'text-blue-600 border-b-2 border-blue-600' : '';
  };

  const isMobileActive = (path) => {
    // Check if current path starts with the given path for mobile menu
    const isCurrentPath = pathname === path || pathname.startsWith(path + '/');
    return isCurrentPath ? 'text-blue-600 bg-blue-50 font-semibold' : '';
  };

  useEffect(() => {
    // Close all menus when pathname changes (navigation occurs)
    setIsMenuOpen(false);
    setIsDesktopUserMenuOpen(false);
    setIsMobileUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const myLocationHref = user?.homeLocation?.slug
    ? `/locations/${user.homeLocation.slug}`
    : '/profile';

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
      className: `text-base font-medium ${isActive('/profile')}`
    },
    {
      id: 'my-articles',
      label: tNav('my_articles'),
      href: '/editor',
      icon: <PencilSquareIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isActive('/editor')}`
    },
    {
      id: 'my-news',
      label: tNav('my_news'),
      href: '/my-news',
      icon: <NewspaperIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isActive('/my-news')}`
    },
    {
      id: 'my-polls',
      label: tNav('my_polls'),
      href: '/my-polls',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isActive('/my-polls')}`
    },
    {
      id: 'my-votes',
      label: tNav('my_votes'),
      href: '/my-votes',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isActive('/my-votes')}`
    },
    {
      id: 'my-location',
      label: tNav('my_location'),
      href: myLocationHref,
      icon: <MapPinIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isActive(myLocationHref)}`
    },
    {
      id: 'suggest',
      label: tNav('my_suggestions'),
      href: '/suggestions?mine=true',
      icon: <LightBulbIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isActive('/suggestions')}`
    },
    ...(canAccessAdmin() ? [
      { divider: true },
      {
        id: 'admin',
        label: tNav('admin'),
        href: '/admin',
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isActive('/admin')}`
      },
      ...(isAdmin ? [{
        id: 'admin-status',
          label: tNav('admin_diagnostics'),
        href: '/admin/status',
        icon: <ServerIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isActive('/admin/status')}`
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
    <nav className="bg-sand shadow-md border-b border-seafoam/70">
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
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/articles"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/articles')}`}
              >
                {tNav('articles')}
              </Link>
              <Link
                href="/news"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/news')}`}
              >
                {tNav('news')}
              </Link>
              <Link
                href="/videos"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/videos')}`}
              >
                {tNav('videos')}
              </Link>
              <Link
                href="/polls"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/polls')}`}
              >
                {tNav('polls')}
              </Link>
              <Link
                href="/suggestions"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/suggestions')}`}
              >
                {tNav('suggestions')}
              </Link>
              <Link
                href="/locations"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/locations')}`}
              >
                {tNav('locations')}
              </Link>
              <Link
                href="/users"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/users')}`}
              >
                {tNav('users')}
              </Link>
              <Link
                href="/pages"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/pages')}`}
              >
                {tNav('pages')}
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 ml-auto">
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
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-700"
                >
                  <ArrowLeftOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                  {tNav('login')}
                </LoginLink>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
              className="inline-flex items-center justify-center rounded-md p-2 text-blue-900 hover:bg-seafoam/40 sm:hidden"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="sr-only">{tNav('open_menu')}</span>
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
      <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="border-t border-seafoam px-4 py-3 space-y-2">
          <Link
            href="/articles"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/articles')}`}
          >
            {tNav('articles')}
          </Link>
          <Link
            href="/news"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/news')}`}
          >
            {tNav('news')}
          </Link>
          <Link
            href="/videos"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/videos')}`}
          >
            {tNav('videos')}
          </Link>
          <Link
            href="/polls"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/polls')}`}
          >
            {tNav('polls')}
          </Link>
          <Link
            href="/suggestions"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/suggestions')}`}
          >
            {tNav('suggestions')}
          </Link>
          <Link
            href="/locations"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/locations')}`}
          >
            {tNav('locations')}
          </Link>
          <Link
            href="/users"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/users')}`}
          >
            {tNav('users')}
          </Link>
          <Link
            href="/pages"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/pages')}`}
          >
            {tNav('pages')}
          </Link>
        </div>
        <div className="border-t border-seafoam px-4 py-3 space-y-3">
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
                    className="flex w-full items-center justify-between rounded-md border border-seafoam bg-white px-3 py-2 text-sm font-medium text-blue-900 shadow-sm"
                  >
                     <span>{tNav('greeting')} {user.username}</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${isMobileUserMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                }
                items={mobileMenuItems}
                align="left"
                menuId="mobile-user-menu"
                menuClassName="w-full"
                open={isMobileUserMenuOpen}
                onOpenChange={setIsMobileUserMenuOpen}
              />
            </>
          ) : (
            <>
              <LoginLink
                className="inline-flex items-center gap-2 text-base font-medium text-blue-900 hover:text-blue-700"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                {tNav('login')}
              </LoginLink>
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 text-base font-medium bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
