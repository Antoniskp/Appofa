import { pageMetadata } from '@/lib/seo';
import { sectionMetadata } from '@/lib/route-metadata';

export const generateMetadata = sectionMetadata(pageMetadata("Ψηφοφορίες", "Συμμετέχετε σε δημόσιες δημοσκοπήσεις, εκφράστε τη γνώμη σας και δείτε τα αποτελέσματα για θέματα της κοινότητάς σας.", '/polls'));

export default function Layout({ children }) {
  return children;
}
