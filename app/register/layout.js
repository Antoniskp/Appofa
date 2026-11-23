import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('auth.submit_register');

export default function RegisterLayout({ children }) {
  return children;
}
