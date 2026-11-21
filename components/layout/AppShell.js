'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/layout/CookieBanner';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import PushSubscriptionSync from '@/components/notifications/PushSubscriptionSync';
import BrowsingLimitNotice from '@/components/ui/BrowsingLimitNotice';
import EmailVerificationNotice from '@/components/onboarding/EmailVerificationNotice';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const r = useTranslations('redesign');
  const t = useTranslations('signupJourney');
  const isEmbedRoute = pathname?.startsWith('/embed/');
  const isAccountRoute = ['/register', '/login', '/onboarding', '/verify-email', '/forgot-password', '/reset-password'].includes(pathname);

  if (isEmbedRoute) {
    return <main className="min-h-screen bg-transparent">{children}</main>;
  }

  if (isAccountRoute) {
    return <>
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-charcoal">Appofasi</Link>
          <Link href="/" className="text-sm font-medium text-gray-600 underline">{t('back_home')}</Link>
        </div>
      </header>
      {pathname !== '/verify-email' && pathname !== '/onboarding' && <EmailVerificationNotice />}
      <main id="main-content" tabIndex={-1} className="flex-grow bg-gray-50">{children}</main>
      <footer className="flex justify-center gap-6 bg-gray-50 px-4 py-6 text-sm text-gray-600">
        <Link href="/terms" className="underline">{t('terms')}</Link>
        <Link href="/privacy" className="underline">{t('privacy')}</Link>
      </footer>
      <CookieBanner />
    </>;
  }

  return (
    <>
      <PushSubscriptionSync />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4">{r('skip')}</a>
      <TopNav />
      <EmailVerificationNotice />
      <BrowsingLimitNotice />
      {/* mobile-safe-bottom adds padding-bottom on mobile only to prevent content
          from being hidden behind the fixed MobileBottomNav bar */}
      <main id="main-content" tabIndex={-1} className="flex-grow mobile-safe-bottom">
        {children}
      </main>
      <Footer />
      <CookieBanner />
      <MobileBottomNav />
    </>
  );
}
