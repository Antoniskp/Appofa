import { pageMetadata } from '@/lib/seo';
import { sectionMetadata } from '@/lib/route-metadata';

export const generateMetadata = sectionMetadata(pageMetadata("Άρθρα", "Άρθρα, απόψεις και τεκμηριωμένες προτάσεις για την κοινωνία, την οικονομία και τα δημόσια ζητήματα.", '/articles'));

export default function Layout({ children }) {
  return children;
}
