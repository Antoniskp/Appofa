import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ToastProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import GeoTracker from '@/components/GeoTracker';
import AppShell from '@/components/layout/AppShell';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import localFont from 'next/font/local';

const notoSans = localFont({
  src: [
    { path: '../public/fonts/NotoSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/NotoSans-SemiBold.ttf', weight: '600', style: 'normal' },
  ],
  variable: '--font-noto-sans',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://appofasi.gr';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/news default.png`;
const APP_ICON = '/images/branding/appofa-app-icon.png';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Απόφαση',
    template: '%s | Απόφαση',
  },
  description: 'Προτάσεις πολιτών, δημόσιες διαβουλεύσεις και παρακολούθηση της υλοποίησης στην κοινότητά σας',
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
    description: 'Προτάσεις πολιτών, δημόσιες διαβουλεύσεις και παρακολούθηση της υλοποίησης στην κοινότητά σας',
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1536, height: 1024, alt: 'Απόφαση' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Απόφαση',
    description: 'Προτάσεις πολιτών, δημόσιες διαβουλεύσεις και παρακολούθηση της υλοποίησης στην κοινότητά σας',
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      el: SITE_URL,
      en: SITE_URL,
      ro: SITE_URL,
    },
  },
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${notoSans.variable} flex flex-col min-h-screen`}>
        <GoogleAnalytics />
        <GeoTracker />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
