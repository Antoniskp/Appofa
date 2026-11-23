import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('civicQuestions.edit.title');

export default function EditCivicQuestionLayout({ children }) {
  return children;
}
