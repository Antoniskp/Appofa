'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { getCivicQuestionLifecycleStatus, getCivicQuestionStatusBadgeVariant } from './statusUtils';

export default function CivicQuestionCard({ civicQuestion }) {
  const t = useTranslations('civicQuestions');
  const createdAt = new Date(civicQuestion.createdAt).toLocaleDateString('el-GR');
  const lifecycleStatus = getCivicQuestionLifecycleStatus(civicQuestion);
  const deadlineDate = civicQuestion.deadline ? new Date(civicQuestion.deadline).toLocaleDateString('el-GR') : null;

  return (
    <Link
      href={`/civic-questions/${civicQuestion.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="primary">{t(`source_types.${civicQuestion.sourceType}`)}</Badge>
        <Badge variant={getCivicQuestionStatusBadgeVariant(lifecycleStatus)}>{t(`status.${lifecycleStatus}`)}</Badge>
        {civicQuestion.status === 'archived' && lifecycleStatus !== 'archived' && (
          <Badge variant="danger">{t('status.archived')}</Badge>
        )}
        {civicQuestion.visibility === 'locals_only' && <Badge variant="orange">{t('local_badge')}</Badge>}
        {civicQuestion.category && <Badge variant="purple">{civicQuestion.category}</Badge>}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{civicQuestion.title}</h3>
      {civicQuestion.simplified && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{civicQuestion.simplified}</p>
      )}
      <div className="mt-4 text-sm text-gray-500 flex flex-wrap gap-3">
        <span>{civicQuestion.totalVotes || 0} {t('votes_label')}</span>
        {civicQuestion.location?.name && <span>📍 {civicQuestion.location.name}</span>}
        {deadlineDate && <span>⏱ {t('card.deadline')}: {deadlineDate}</span>}
        <span>{createdAt}</span>
      </div>
    </Link>
  );
}
