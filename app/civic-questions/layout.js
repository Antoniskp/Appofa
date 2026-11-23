import { publicPageMetadata } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('civicQuestions.list.title', 'civicQuestions.list.intro', '/civic-questions');

export default function CivicQuestionsLayout({ children }) {
  return children;
}
