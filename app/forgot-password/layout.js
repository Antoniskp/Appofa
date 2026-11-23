import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('auth.forgot_password_title');

export default function ForgotPasswordLayout({ children }) {
  return children;
}
