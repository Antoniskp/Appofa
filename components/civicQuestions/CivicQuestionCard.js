'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { useLocale, useTranslations } from 'next-intl';
import { getCivicQuestionLifecycleStatus, getCivicQuestionStatusBadgeVariant } from './statusUtils';

export default function CivicQuestionCard({ civicQuestion }) {
  const t = useTranslations('civicQuestions');
  const locale = useLocale();
  const lifecycleStatus = getCivicQuestionLifecycleStatus(civicQuestion);
  const locationName = (locale === 'el' && civicQuestion.location?.name_local) || civicQuestion.location?.name;
  // The complete status, including dates and references after a dash, remains on the detail page.
  const sourceStage = civicQuestion.sourceStatus?.split(/\s[—–]\s/)[0];
  const titleId = `civic-question-${civicQuestion.id}-title`;

  return (
    <Link
      href={`/civic-questions/${civicQuestion.id}`}
      aria-labelledby={titleId}
      className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="primary">{t(`source_types.${civicQuestion.sourceType}`)}</Badge>
        <Badge variant={getCivicQuestionStatusBadgeVariant(lifecycleStatus)}>{t('card.participation_status', { status: t(`status.${lifecycleStatus}`) })}</Badge>
        {civicQuestion.visibility === 'locals_only' && <Badge variant="warning">{t('local_badge')}</Badge>}
      </div>
      <h3 id={titleId} className="text-lg font-semibold text-gray-900 leading-snug">{civicQuestion.title}</h3>
      {civicQuestion.simplified && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{civicQuestion.simplified}</p>
      )}
      {civicQuestion.category && <p className="mt-3 text-sm text-gray-600">{civicQuestion.category}</p>}
      {sourceStage && <p className="mt-3 text-sm text-gray-700"><span className="font-medium">{t(civicQuestion.sourceType === 'parliament' ? 'detail.parliament_stage' : 'detail.source_status')}:</span> {sourceStage}</p>}
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
          <span>{t('participation_count', { count: civicQuestion.totalVotes || 0 })}</span>
          {civicQuestion.deadline && <span>{t('card.deadline')}: {new Date(civicQuestion.deadline).toLocaleDateString(locale)}</span>}
          {locationName && civicQuestion.sourceType !== 'parliament' && <span>{locationName}</span>}
        </div>
        <p className="mt-4 text-sm font-semibold text-blue-700">{t('card.read_question')} <span aria-hidden="true">→</span></p>
      </div>
    </Link>
  );
}
