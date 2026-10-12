import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('civicQuestions.list');
  return { title: t('title'), description: t('intro'), alternates: { canonical: '/civic-questions' } };
}

export default function CivicQuestionsLayout({ children }) {
  return children;
}
