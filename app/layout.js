import { AuthProvider } from '@/lib/auth-context';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata = {
  title: 'Εφαρμογή Ειδήσεων',
  description: 'Η αξιόπιστη πηγή σας για τα τελευταία νέα',
};

export default function RootLayout({ children }) {
  return (
    <html lang="el">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <TopNav />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
