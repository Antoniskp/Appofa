import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('nav.my_polls');

export default function MyPollsLayout({ children }) {
  return children;
}
