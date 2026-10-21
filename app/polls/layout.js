import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata("Δημοσκοπήσεις", "Συμμετέχετε σε δημόσιες δημοσκοπήσεις, εκφράστε τη γνώμη σας και δείτε τα αποτελέσματα για θέματα της κοινότητάς σας.", '/polls');

export default function Layout({ children }) {
  return children;
}
