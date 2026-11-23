import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('nav.notifications');

export default function NotificationsLayout({ children }) {
  return children;
}
