'use client';

import { useTranslations } from 'next-intl';

const COLORS = {
  agree: 'bg-green-600',
  disagree: 'bg-red-600',
  present: 'bg-slate-600',
};

export default function CivicQuestionResults({ civicQuestion }) {
  const t = useTranslations('civicQuestions');
  if (!civicQuestion?.voteCounts || !civicQuestion?.percentages) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        {t('results_unavailable')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {['agree', 'disagree', 'present'].map((choice) => {
        const percent = civicQuestion.percentages[choice] || 0;
        const count = civicQuestion.voteCounts[choice] || 0;
        return (
          <div key={choice}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{t(`choices.${choice}`)}</span>
              <span className="text-gray-600">{count} ({percent}%)</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${COLORS[choice]}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
      <div className="text-sm text-gray-600 pt-1">{t('total_votes')}: <strong>{civicQuestion.totalVotes || 0}</strong></div>
    </div>
  );
}
