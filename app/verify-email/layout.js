import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.verifyEmail');

export default function VerifyEmailLayout({ children }) {
  return children;
}
