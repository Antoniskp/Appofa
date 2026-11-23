import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('editor.title');

export default function EditorLayout({ children }) {
  return children;
}
