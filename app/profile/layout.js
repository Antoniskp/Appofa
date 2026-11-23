import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('nav.my_profile');

export default function ProfileLayout({ children }) {
  return children;
}
