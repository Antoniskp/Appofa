import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.claimProfile');

export default function ClaimPersonLayout({ children }) {
  return children;
}
