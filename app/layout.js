import { AuthProvider } from '@/lib/auth-context';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ToastProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

export const metadata = {
  title: 'Απόφαση',
  description: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
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
