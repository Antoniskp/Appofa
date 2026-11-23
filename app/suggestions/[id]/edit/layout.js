import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.editSuggestion');

export default function EditSuggestionLayout({ children }) {
  return children;
}
