import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('polls.new_poll');

export default function CreatePollLayout({ children }) {
  return children;
}
