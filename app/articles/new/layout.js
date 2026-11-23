import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('articles.create');

export default function NewArticleLayout({ children }) {
  return children;
}
