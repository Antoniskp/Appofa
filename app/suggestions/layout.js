import { pageMetadata } from '@/lib/seo';
import { sectionMetadata } from '@/lib/route-metadata';

export const generateMetadata = sectionMetadata(pageMetadata("Προτάσεις πολιτών", "Ανακαλύψτε προτάσεις πολιτών για την Ελλάδα και την κοινότητά σας. Συζητήστε λύσεις και παρακολουθήστε την εξέλιξή τους.", '/suggestions'));

export default function Layout({ children }) {
  return children;
}
