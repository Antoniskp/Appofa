import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('nav.my_votes');

export default function MyVotesLayout({ children }) {
  return children;
}
