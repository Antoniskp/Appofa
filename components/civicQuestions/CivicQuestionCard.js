'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import LoginLink from '@/components/ui/LoginLink';
import CivicQuestionVoting from './CivicQuestionVoting';
import { useLocale, useTranslations } from 'next-intl';
import { getCivicQuestionLifecycleStatus, getCivicQuestionStatusBadgeVariant } from './statusUtils';

export default function CivicQuestionCard({ civicQuestion, user, onVoteSuccess }) {
  const t = useTranslations('civicQuestions');
  const locale = useLocale();
  const lifecycleStatus = getCivicQuestionLifecycleStatus(civicQuestion);
  const locationName = (locale === 'el' && civicQuestion.location?.name_local) || civicQuestion.location?.name;
  // The complete status, including dates and references after a dash, remains on the detail page.
  const sourceStage = civicQuestion.sourceStatus?.split(/\s[—–]\s/)[0];
  const titleId = `civic-question-${civicQuestion.id}-title`;
  const participationOpen = lifecycleStatus === 'open' || lifecycleStatus === 'closing_soon';
  const resultsAllowed = civicQuestion.canViewResults !== false && (
    user?.role === 'admin' || (user && user.id === civicQuestion.creatorId)
    || civicQuestion.resultsVisibility === 'always'
    || (civicQuestion.resultsVisibility === 'after_vote' && Boolean(user && civicQuestion.myVote))
    || (civicQuestion.resultsVisibility === 'after_deadline' && !participationOpen)
  );
  const hasResults = resultsAllowed && Boolean(civicQuestion.voteCounts && civicQuestion.percentages);
  const totalVotes = hasResults ? civicQuestion.totalVotes || 0 : 0;
  const choices = ['agree', 'disagree', 'present'];
  const colors = { agree: 'bg-green-600', disagree: 'bg-red-600', present: 'bg-slate-400' };
  const choiceLabel = choice => t(choice === 'present' ? 'card.unsure' : `choices.${choice}`);
  // Calculate widths from counts so rounded percentages cannot overflow the bar.
  const countedVotes = hasResults ? choices.reduce((sum, choice) => sum + (civicQuestion.voteCounts[choice] || 0), 0) : 0;
  const share = choice => countedVotes ? (civicQuestion.voteCounts[choice] || 0) / countedVotes * 100 : 0;
  const resultLabel = choices.map(choice => `${choiceLabel(choice)}: ${Math.round(share(choice))}%`).join(', ');

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="primary">{t(`source_types.${civicQuestion.sourceType}`)}</Badge>
        <Badge variant={getCivicQuestionStatusBadgeVariant(lifecycleStatus)}>{t('card.participation_status', { status: t(`status.${lifecycleStatus}`) })}</Badge>
        {civicQuestion.visibility === 'locals_only' && <Badge variant="warning">{t('local_badge')}</Badge>}
      </div>
      <h3 id={titleId} className="text-lg font-semibold text-gray-900 leading-snug"><Link href={`/civic-questions/${civicQuestion.id}`} aria-labelledby={titleId} className="rounded hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">{civicQuestion.title}</Link></h3>
      {civicQuestion.simplified && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{civicQuestion.simplified}</p>
      )}
      {civicQuestion.category && <p className="mt-3 text-sm text-gray-600">{civicQuestion.category}</p>}
      {sourceStage && <p className="mt-3 text-sm text-gray-700"><span className="font-medium">{t(civicQuestion.sourceType === 'parliament' ? 'detail.parliament_stage' : 'detail.source_status')}:</span> {sourceStage}</p>}
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
          {hasResults && <span>{t('participation_count', { count: totalVotes })}</span>}
          {civicQuestion.deadline && <span>{t('card.deadline')}: {new Date(civicQuestion.deadline).toLocaleDateString(locale)}</span>}
          {locationName && civicQuestion.sourceType !== 'parliament' && <span>{locationName}</span>}
        </div>
        <div className="mt-3 space-y-3">
          {hasResults ? <>
            <div role="img" aria-label={countedVotes ? resultLabel : t('card.no_votes')} className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
              {choices.map(choice => <span key={choice} className={colors[choice]} style={{ width: `${share(choice)}%` }} />)}
            </div>
            {countedVotes ? <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-gray-600" aria-hidden="true">
              {choices.map(choice => <span key={choice} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${colors[choice]}`} />{choiceLabel(choice)} {Math.round(share(choice))}%</span>)}
            </div> : <p className="text-xs text-gray-500">{t('card.no_votes')}</p>}
          </> : <p className="text-xs text-gray-500">{t('results_unavailable')}</p>}
          {participationOpen && <CivicQuestionVoting civicQuestion={civicQuestion} onVoteSuccess={onVoteSuccess} compact disabled={!user} showCounts={hasResults} />}
          {!user && participationOpen && <LoginLink className="block text-sm font-medium text-blue-700 hover:underline">{t('detail.login_vote')}</LoginLink>}
          {user && participationOpen && civicQuestion.voteRestriction === 'locals_only' && <p className="text-xs text-gray-500">{t('card.local_voting')}</p>}
        </div>
        <Link href={`/civic-questions/${civicQuestion.id}`} className="mt-4 inline-block rounded text-sm font-semibold text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{t('card.read_question')} <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}
