import { pageMetadata } from '@/lib/seo';
import { sectionMetadata } from '@/lib/route-metadata';

export const generateMetadata = sectionMetadata(pageMetadata("Οργανισμοί και φορείς", "Γνωρίστε δημόσιους οργανισμούς και φορείς, τις επίσημες δημοσιεύσεις τους και τα ζητήματα που τους αφορούν.", '/organizations'));

export default function Layout({ children }) {
  return children;
}
