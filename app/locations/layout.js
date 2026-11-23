import { pageMetadata } from '@/lib/seo';
import { sectionMetadata } from '@/lib/route-metadata';

export const generateMetadata = sectionMetadata(pageMetadata("Τόποι και κοινότητες", "Εξερευνήστε περιοχές και τοπικές κοινότητες, με ειδήσεις, προτάσεις και δημόσια ζητήματα για κάθε τόπο.", '/locations'));

export default function Layout({ children }) {
  return children;
}
