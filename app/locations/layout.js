import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata("Τόποι και κοινότητες", "Εξερευνήστε περιοχές και τοπικές κοινότητες, με ειδήσεις, προτάσεις και δημόσια ζητήματα για κάθε τόπο.", '/locations');

export default function Layout({ children }) {
  return children;
}
