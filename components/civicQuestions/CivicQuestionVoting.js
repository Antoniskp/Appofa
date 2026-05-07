'use client';

import { useState } from 'react';
import { civicQuestionAPI } from '@/lib/api';

const CHOICES = [
  { value: 'agree', label: 'Agree', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'disagree', label: 'Disagree', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'present', label: 'Present', color: 'bg-slate-600 hover:bg-slate-700' },
];

export default function CivicQuestionVoting({ civicQuestion, onVoteSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async (choice) => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await civicQuestionAPI.vote(civicQuestion.id, choice);
      if (response.success) {
        onVoteSuccess?.(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit vote.');
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
              className={`rounded-lg px-4 py-3 text-white font-medium transition ${choice.color} ${active ? 'ring-2 ring-offset-2 ring-blue-500' : ''} disabled:opacity-60`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
