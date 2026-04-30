import { AuthProvider } from '@/lib/auth-context';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ToastProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import GeoTracker from '@/components/GeoTracker';
import CookieBanner from '@/components/layout/CookieBanner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://appofasi.gr';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/appofa-app-icon.png`;
const APP_ICON = '/images/branding/appofa-app-icon.png';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Απόφαση',
    template: '%s | Απόφαση',
  },
  description: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
  manifest: '/manifest.webmanifest',
  icons: {
    apple: [{ url: APP_ICON, sizes: '512x512', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Απόφαση',
    startupImage: APP_ICON,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    type: 'website',
    siteName: 'Απόφαση',
    title: 'Απόφαση',
    description: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: 'summary',
    title: 'Απόφαση',
    description: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      el: SITE_URL,
      en: SITE_URL,
    },
  },
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="flex flex-col min-h-screen">
        <GoogleAnalytics />
        <GeoTracker />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ToastProvider>
              <TopNav />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <CookieBanner />
            </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
