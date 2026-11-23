import { pageMetadata } from '@/lib/seo';
import { sectionMetadata } from '@/lib/route-metadata';

export const generateMetadata = sectionMetadata(pageMetadata("Ειδήσεις", "Ειδήσεις και ενημέρωση για την Ελλάδα και τις τοπικές κοινότητες. Παρακολουθήστε θέματα που επηρεάζουν την καθημερινότητά σας.", '/news'));

export default function Layout({ children }) {
  return children;
}
