import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('organizations.create_suggestion');

export default function NewSuggestionLayout({ children }) {
  return children;
}
