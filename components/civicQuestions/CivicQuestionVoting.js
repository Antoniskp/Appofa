'use client';

import { useState } from 'react';
import { civicQuestionAPI } from '@/lib/api';
import { useTranslations } from 'next-intl';

const CHOICES = [
  { value: 'agree', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'disagree', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'present', color: 'bg-slate-600 hover:bg-slate-700' },
];

export default function CivicQuestionVoting({ civicQuestion, onVoteSuccess }) {
  const t = useTranslations('civicQuestions');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [justVoted, setJustVoted] = useState(null); // tracks the choice that triggered animation

  const handleVote = async (choice) => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    // Fire animation immediately on click
    setJustVoted(choice);
    setTimeout(() => setJustVoted(null), 280);

    try {
      const response = await civicQuestionAPI.vote(civicQuestion.id, choice);
      if (response.success) {
        onVoteSuccess?.(response.data);
      }
    } catch (err) {
      setError(err.message || t('vote_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CHOICES.map((choice) => {
          const active = civicQuestion.myVote === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              disabled={submitting}
              onClick={() => handleVote(choice.value)}
              className={`rounded-lg px-4 py-3 text-white font-medium transition ${choice.color} ${active ? 'ring-2 ring-offset-2 ring-blue-500' : ''} disabled:opacity-60${justVoted === choice.value ? ' animate-vote-pop' : ''}`}
            >
              {t(`choices.${choice.value}`)}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
