'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/layout/CookieBanner';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import PushSubscriptionSync from '@/components/notifications/PushSubscriptionSync';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const r = useTranslations('redesign');
  const isEmbedRoute = pathname?.startsWith('/embed/');

  if (isEmbedRoute) {
    return <main className="min-h-screen bg-transparent">{children}</main>;
  }

  return (
    <>
      <PushSubscriptionSync />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4">{r('skip')}</a>
      <TopNav />
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
