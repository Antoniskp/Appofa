import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { defaultLocale } from '@/lib/i18n-config';
import { AuthProvider } from '@/lib/auth-context';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ToastProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import '../globals.css';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/news default.png`;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const resolvedLocale = locale || defaultLocale;
  const titles = { el: 'Απόφαση', en: 'Appofa' };
  const descriptions = {
    el: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
    en: 'Your portal for the latest news, polls and local content'
  };
  const title = titles[resolvedLocale] || titles[defaultLocale];
  const description = descriptions[resolvedLocale] || descriptions[defaultLocale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${title}` },
    description,
    openGraph: { type: 'website', siteName: title, title, description, url: SITE_URL, images: [{ url: DEFAULT_OG_IMAGE }] },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_OG_IMAGE] },
    alternates: { canonical: SITE_URL }
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const resolvedLocale = locale || defaultLocale;
  const messages = await getMessages();

  return (
    <html lang={resolvedLocale}>
      <body className="flex flex-col min-h-screen">
        <GoogleAnalytics />
        <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
          <AuthProvider>
            <ToastProvider>
              <TopNav />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
