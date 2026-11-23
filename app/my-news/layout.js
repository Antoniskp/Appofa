import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('nav.my_news');

export default function MyNewsLayout({ children }) {
  return children;
}
