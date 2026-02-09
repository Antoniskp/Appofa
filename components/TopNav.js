'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import SkeletonLoader from '@/components/SkeletonLoader';
import DropdownMenu from '@/components/DropdownMenu';
import Tooltip from '@/components/Tooltip';

export default function TopNav() {
  const { user, loading, logout } = useAuth();
  const { isAdmin, isEditor } = usePermissions();
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

  // Build user menu items for DropdownMenu (desktop - smaller icons)
  const userMenuItems = [
    {
      id: 'profile',
      label: 'Προφίλ',
      href: '/profile',
      icon: <UserCircleIcon className="h-4 w-4" />,
      className: isActive('/profile')
    },
    ...(isAdmin ? [
      {
        id: 'admin',
        label: 'Διαχείριση',
        href: '/admin',
        icon: <ShieldCheckIcon className="h-4 w-4" />,
        className: isActive('/admin')
      },
      {
        id: 'admin-status',
        label: 'Διαγνωστικά',
        href: '/admin/status',
        icon: <ServerIcon className="h-4 w-4" />,
        className: isActive('/admin/status')
      }
    ] : []),
    ...((isAdmin || isEditor) ? [
      {
        id: 'editor',
        label: 'Τα άρθρα μου',
        href: '/editor',
        icon: <PencilSquareIcon className="h-4 w-4" />,
        className: isActive('/editor')
      },
      {
        id: 'create-poll',
        label: 'Δημιουργία Δημοσκόπησης',
        href: '/polls/create',
        icon: <PlusCircleIcon className="h-4 w-4" />,
        className: isActive('/polls/create')
      }
    ] : []),
    { divider: true },
    {
      id: 'logout',
      label: 'Έξοδος',
      icon: <ArrowRightOnRectangleIcon className="h-4 w-4" />,
      onClick: handleLogout,
      variant: 'danger'
    }
  ];

  // Build mobile menu items (larger icons and font)
  const mobileMenuItems = [
    {
      id: 'profile',
      label: 'Προφίλ',
      href: '/profile',
      icon: <UserCircleIcon className="h-5 w-5" />,
      className: `text-base font-medium ${isActive('/profile')}`
    },
    ...(isAdmin ? [
      {
        id: 'admin',
        label: 'Διαχείριση',
        href: '/admin',
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isActive('/admin')}`
      },
      {
        id: 'admin-status',
        label: 'Διαγνωστικά',
        href: '/admin/status',
        icon: <ServerIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isActive('/admin/status')}`
      }
    ] : []),
    ...((isAdmin || isEditor) ? [
      {
        id: 'editor',
        label: 'Τα άρθρα μου',
        href: '/editor',
        icon: <PencilSquareIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isActive('/editor')}`
      },
      {
        id: 'create-poll',
        label: 'Δημιουργία Δημοσκόπησης',
        href: '/polls/create',
        icon: <PlusCircleIcon className="h-5 w-5" />,
        className: `text-base font-medium ${isActive('/polls/create')}`
      }
    ] : []),
    { divider: true },
    {
      id: 'logout',
      label: 'Έξοδος',
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
            <Link href="/" className="flex items-center" aria-label="Appofasi home">
              <Image
                src="/images/branding/appofasi-high-resolution-logo-transparent.png"
                alt="Appofasi"
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
                Άρθρα
              </Link>
              <Link
                href="/news"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/news')}`}
              >
                Ειδήσεις
              </Link>
              <Link
                href="/polls"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/polls')}`}
              >
                Ψηφοφορίες
              </Link>
              <Link
                href="/locations"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/locations')}`}
              >
                Τοποθεσίες
              </Link>
              <Link
                href="/users"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-900 ${isActive('/users')}`}
              >
                Χρήστες
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 ml-auto">
            {loading ? (
              <div className="flex items-center gap-4">
                <SkeletonLoader type="button" count={2} className="flex gap-4" />
              </div>
            ) : user ? (
              <DropdownMenu
                triggerText={`Γεια σου ${user.username}`}
                items={userMenuItems}
                align="right"
                showChevron={true}
                menuId="desktop-user-menu"
                open={isDesktopUserMenuOpen}
                onOpenChange={setIsDesktopUserMenuOpen}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-700"
                >
                  <ArrowLeftOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                  Είσοδος
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                  Εγγραφή
                </Link>
              </>
            )}
          </div>
          <Tooltip content={isMenuOpen ? "Κλείσιμο μενού" : "Άνοιγμα μενού"} position="bottom">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-blue-900 hover:bg-seafoam/40 sm:hidden"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="sr-only">Open main menu</span>
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
            Άρθρα
          </Link>
          <Link
            href="/news"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/news')}`}
          >
            Ειδήσεις
          </Link>
          <Link
            href="/polls"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/polls')}`}
          >
            Ψηφοφορίες
          </Link>
          <Link
            href="/locations"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/locations')}`}
          >
            Τοποθεσίες
          </Link>
          <Link
            href="/users"
            className={`block px-3 py-2 rounded-md text-base font-medium text-blue-900 ${isMobileActive('/users')}`}
          >
            Χρήστες
          </Link>
        </div>
        <div className="border-t border-seafoam px-4 py-3 space-y-3">
          {loading ? (
            <div className="space-y-2">
              <SkeletonLoader type="button" count={2} className="space-y-2" />
            </div>
          ) : user ? (
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-seafoam bg-white px-3 py-2 text-sm font-medium text-blue-900 shadow-sm"
                >
                  <span>Γεια σου {user.username}</span>
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
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-base font-medium text-blue-900 hover:text-blue-700"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                Έισοδος
              </Link>
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 text-base font-medium bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
                Εγγραφή
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
