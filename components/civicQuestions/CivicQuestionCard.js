'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { useLocale, useTranslations } from 'next-intl';
import { getCivicQuestionLifecycleStatus, getCivicQuestionStatusBadgeVariant } from './statusUtils';

export default function CivicQuestionCard({ civicQuestion }) {
  const t = useTranslations('civicQuestions');
  const locale = useLocale();
  const createdAt = new Date(civicQuestion.dateAsked || civicQuestion.createdAt).toLocaleDateString(locale);
  const lifecycleStatus = getCivicQuestionLifecycleStatus(civicQuestion);
  const deadlineDate = civicQuestion.deadline ? new Date(civicQuestion.deadline).toLocaleDateString(locale) : null;
  const locationName = locale === 'el' ? (civicQuestion.location?.name_local || civicQuestion.location?.name) : civicQuestion.location?.name;

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
      </div>
      <h2 className="text-lg font-semibold text-gray-900 leading-snug">{civicQuestion.title}</h2>
      {civicQuestion.simplified && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{civicQuestion.simplified}</p>
      )}
      {civicQuestion.category && <p className="mt-3 text-xs text-gray-500">{civicQuestion.category}</p>}
      {civicQuestion.sourceStatus && <p className="mt-2 text-sm text-gray-600">{t('detail.source_status')}: {civicQuestion.sourceStatus}</p>}
      <div className="mt-4 text-sm text-gray-600 flex flex-wrap gap-3">
        <span>{t('participation_count', { count: civicQuestion.totalVotes || 0 })}</span>
        {locationName && <span>📍 {locationName}</span>}
        {deadlineDate && <span>⏱ {t('card.deadline')}: {deadlineDate}</span>}
        {!deadlineDate && lifecycleStatus === 'open' && <span>{t('card.no_deadline')}</span>}
        <span>{t(civicQuestion.dateAsked ? 'detail.date_asked' : 'card.published')}: {createdAt}</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-blue-700">{t('card.read_question')} <span aria-hidden="true">→</span></p>
    </Link>
  );
}
