import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata("Άρθρα", "Άρθρα, απόψεις και τεκμηριωμένες προτάσεις για την κοινωνία, την οικονομία και τα δημόσια ζητήματα.", '/articles');

export default function Layout({ children }) {
  return children;
}
