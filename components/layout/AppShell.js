'use client';

import { usePathname } from 'next/navigation';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/layout/CookieBanner';
import PushSubscriptionSync from '@/components/notifications/PushSubscriptionSync';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isEmbedRoute = pathname?.startsWith('/embed/');

  if (isEmbedRoute) {
    return <main className="min-h-screen bg-transparent">{children}</main>;
  }

  return (
    <>
      <PushSubscriptionSync />
      <TopNav />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
