import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('civicQuestions.create.title');

export default function CreateCivicQuestionLayout({ children }) {
  return children;
}
