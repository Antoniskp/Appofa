import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.newVideo');

export default function NewVideoLayout({ children }) {
  return children;
}
