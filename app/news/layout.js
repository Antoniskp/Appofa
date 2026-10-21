import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata("Ειδήσεις", "Ειδήσεις και ενημέρωση για την Ελλάδα και τις τοπικές κοινότητες. Παρακολουθήστε θέματα που επηρεάζουν την καθημερινότητά σας.", '/news');

export default function Layout({ children }) {
  return children;
}
