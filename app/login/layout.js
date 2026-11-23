import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('auth.submit_login');

export default function LoginLayout({ children }) {
  return children;
}
