import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata("Οργανισμοί και φορείς", "Γνωρίστε δημόσιους οργανισμούς και φορείς, τις επίσημες δημοσιεύσεις τους και τα ζητήματα που τους αφορούν.", '/organizations');

export default function Layout({ children }) {
  return children;
}
