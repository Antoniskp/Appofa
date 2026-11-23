import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('articles.edit_article');

export default function EditArticleLayout({ children }) {
  return children;
}
