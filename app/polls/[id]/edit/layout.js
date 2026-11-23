import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.editPoll');

export default function EditPollLayout({ children }) {
  return children;
}
