import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.candidateClaim');

export default function ClaimCandidateLayout({ children }) {
  return children;
}
