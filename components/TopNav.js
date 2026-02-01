'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ChevronDownIcon,
  PlusIcon,
  UserCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

export default function TopNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const mobileUserMenuRef = useRef(null);

  const isActive = (path) => pathname === path ? 'text-blue-600' : '';

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      setIsUserMenuOpen(false);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      const isDesktopMenu = userMenuRef.current?.contains(event.target);
      const isMobileMenu = mobileUserMenuRef.current?.contains(event.target);
      if (!isDesktopMenu && !isMobileMenu) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleUserMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsUserMenuOpen(false);
    }
  };

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
            </div>
          </div>
          <div className="hidden sm:flex flex-wrap items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-4 animate-pulse">
                <div className="h-9 w-20 bg-gray-200 rounded"></div>
                <div className="h-9 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                  onKeyDown={handleUserMenuKeyDown}
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                  aria-controls="desktop-user-menu"
                  id="desktop-user-menu-button"
                >
                  Hello {user.username}
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isUserMenuOpen && (
                  <div
                    id="desktop-user-menu"
                    role="menu"
                    aria-labelledby="desktop-user-menu-button"
                    onKeyDown={handleUserMenuKeyDown}
                    className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-seafoam bg-white py-1 shadow-lg"
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      className={`flex items-center gap-2 px-4 py-2 text-sm text-blue-900 hover:bg-seafoam/40 ${isActive('/profile')}`}
                    >
                      <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                      Προφίλ
                    </Link>
                    <Link
                      href="/editor"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-900 hover:bg-seafoam/40"
                    >
                      <PlusIcon className="h-4 w-4" aria-hidden="true" />
                      Τα άρθρα μου
                    </Link>
                    <Link
                      href="/polls/my-polls"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-900 hover:bg-seafoam/40"
                    >
                      <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
                      Οι ψηφοφορίες μου
                    </Link>
                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-seafoam/40"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                      Έξοδος
                    </button>
                  </div>
                )}
              </div>
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
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-blue-900 hover:bg-seafoam/40 sm:hidden"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="sr-only">Άνοιγμα κύριου μενού</span>
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
      <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="border-t border-seafoam px-4 py-3 space-y-2">
          <Link
            href="/articles"
            className={`block text-base font-medium text-blue-900 ${isActive('/articles')}`}
          >
            Άρθρα
          </Link>
          <Link
            href="/news"
            className={`block text-base font-medium text-blue-900 ${isActive('/news')}`}
          >
            Ειδήσεις
          </Link>
          <Link
            href="/polls"
            className={`block text-base font-medium text-blue-900 ${isActive('/polls')}`}
          >
            Ψηφοφορίες
          </Link>
        </div>
        <div className="border-t border-seafoam px-4 py-3 space-y-3">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : user ? (
            <div ref={mobileUserMenuRef}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-seafoam bg-white px-3 py-2 text-sm font-medium text-blue-900 shadow-sm"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                onKeyDown={handleUserMenuKeyDown}
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen}
                aria-controls="mobile-user-menu"
                id="mobile-user-menu-button"
              >
                <span>Hello {user.username}</span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="mobile-user-menu"
                role="menu"
                aria-labelledby="mobile-user-menu-button"
                onKeyDown={handleUserMenuKeyDown}
                className={`${isUserMenuOpen ? 'space-y-2' : 'hidden'} pt-1`}
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  className={`flex items-center gap-2 text-base font-medium text-blue-900 ${isActive('/profile')}`}
                >
                  <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
                  Προφίλ
                </Link>
                <Link
                  href="/editor"
                  role="menuitem"
                  className="inline-flex w-full items-center justify-center gap-2 text-base font-medium bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                  Τα άρθρα μου
                </Link>
                <Link
                  href="/polls/my-polls"
                  role="menuitem"
                  className="inline-flex w-full items-center justify-center gap-2 text-base font-medium border border-blue-600 text-blue-600 px-3 py-2 rounded hover:bg-blue-50"
                >
                  <ChartBarIcon className="h-5 w-5" aria-hidden="true" />
                  Οι ψηφοφορίες μου
                </Link>
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="inline-flex w-full items-center gap-2 text-left text-base font-medium text-red-600 hover:text-red-800"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                  Έξοδος
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-base font-medium text-blue-900 hover:text-blue-700"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                Είσοδος
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
