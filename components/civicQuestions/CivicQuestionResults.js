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

  const totalVotes = civicQuestion.totalVotes || 0;
  const choices = ['agree', 'disagree', 'present'];

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold text-gray-900">{t('participation_count', { count: totalVotes })}</p>
      <p className="text-sm text-gray-600">{t('results.sample_note')}</p>
      {totalVotes > 0 && totalVotes < 30 && <p className="text-sm text-gray-600">{t('results.small_sample')}</p>}
      {choices.map((choice) => {
        const percent = civicQuestion.percentages[choice] || 0;
        const count = civicQuestion.voteCounts[choice] || 0;
        return (
          <div key={choice} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">
                {t(`choices.${choice}`)}
              </span>
              <span className="text-gray-700 font-medium">{t('vote_count', { count })} <span className="text-gray-500">({percent}%)</span></span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${COLORS[choice]}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
