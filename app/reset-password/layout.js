import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('auth.reset_password_title');

export default function ResetPasswordLayout({ children }) {
  return children;
}
