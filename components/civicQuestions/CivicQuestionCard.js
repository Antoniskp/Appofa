'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';

export default function CivicQuestionCard({ civicQuestion }) {
  const t = useTranslations('civicQuestions');
  const createdAt = new Date(civicQuestion.createdAt).toLocaleDateString('el-GR');

  return (
    <Link
      href={`/civic-questions/${civicQuestion.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="primary">{t(`source_types.${civicQuestion.sourceType}`)}</Badge>
        <Badge variant={civicQuestion.status === 'open' ? 'success' : 'gray'}>{t(`status.${civicQuestion.status}`)}</Badge>
        {civicQuestion.visibility === 'locals_only' && <Badge variant="orange">{t('local_badge')}</Badge>}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{civicQuestion.title}</h3>
      {civicQuestion.simplified && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{civicQuestion.simplified}</p>
      )}
      <div className="mt-4 text-sm text-gray-500 flex flex-wrap gap-3">
        <span>{civicQuestion.totalVotes || 0} {t('votes_label')}</span>
        {civicQuestion.location?.name && <span>📍 {civicQuestion.location.name}</span>}
        <span>{createdAt}</span>
      </div>
    </Link>
  );
}
