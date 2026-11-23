import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.requestRemoval');

export default function RequestRemovalLayout({ children }) {
  return children;
}
