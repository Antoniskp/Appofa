import { AuthProvider } from '@/lib/auth-context';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ToastProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/news default.png`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Απόφαση',
    template: '%s | Απόφαση',
  },
  description: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
  openGraph: {
    type: 'website',
    siteName: 'Απόφαση',
    title: 'Απόφαση',
    description: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Απόφαση',
    description: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="el">
      <body className="flex flex-col min-h-screen">
        <GoogleAnalytics />
        <AuthProvider>
          <ToastProvider>
            <TopNav />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
