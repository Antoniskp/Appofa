'use client';

import { useState } from 'react';
import { civicQuestionAPI } from '@/lib/api';
import { useTranslations } from 'next-intl';
import ParticipationNotice from '@/components/ParticipationNotice';

const CHOICES = [
  { value: 'agree', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'disagree', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'present', color: 'bg-slate-600 hover:bg-slate-700' },
];

export default function CivicQuestionVoting({ civicQuestion, onVoteSuccess, compact = false, disabled = false, showCounts = false }) {
  const t = useTranslations('civicQuestions');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [justVoted, setJustVoted] = useState(null); // tracks the choice that triggered animation

  const handleVote = async (choice) => {
    if (submitting || disabled) return;
    setSubmitting(true);
    setError('');
    setSaved(false);

    // Fire animation immediately on click
    setJustVoted(choice);
    setTimeout(() => setJustVoted(null), 280);

    try {
      const response = await civicQuestionAPI.vote(civicQuestion.id, choice);
      if (!response.success) throw new Error(response.message || t('vote_error'));
      onVoteSuccess?.(response.data);
      setSaved(true);
    } catch (err) {
      setError(err.message || t('vote_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {!compact && <ParticipationNotice restriction={civicQuestion.voteRestriction} />}
      <div className={compact ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
        {CHOICES.map((choice) => {
          const active = civicQuestion.myVote === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              disabled={submitting || disabled}
              aria-pressed={active}
              onClick={() => handleVote(choice.value)}
              className={`${compact ? 'flex min-h-11 min-w-0 flex-wrap items-center justify-center gap-x-1.5 rounded-lg px-2 py-2 text-xs text-white font-semibold transition sm:text-sm' : 'rounded-lg px-4 py-3 text-white font-medium transition'} ${choice.color} ${active ? 'ring-2 ring-offset-2 ring-blue-500' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60${justVoted === choice.value ? ' animate-vote-pop' : ''}`}
            >
              {t(compact && choice.value === 'present' ? 'card.unsure' : `choices.${choice.value}`)}
              {compact && showCounts && <span>{civicQuestion.voteCounts?.[choice.value] || 0}</span>}
              {active && <span aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
      <p role="status" className="text-xs text-green-700 empty:hidden">{submitting ? t('form.saving') : saved ? t('card.vote_saved') : ''}</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
