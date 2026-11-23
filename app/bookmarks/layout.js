import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.bookmarks');

export default function BookmarksLayout({ children }) {
  return children;
}
