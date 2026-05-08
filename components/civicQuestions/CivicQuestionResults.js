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
  const leadingVotes = Math.max(...choices.map((choice) => civicQuestion.voteCounts[choice] || 0), 0);
  const isTie = choices.filter((choice) => (civicQuestion.voteCounts[choice] || 0) === leadingVotes).length > 1;
  const effectivePopulation = civicQuestion.location?.population_override ?? civicQuestion.location?.population;
  const participationPct = effectivePopulation > 0 && totalVotes > 0
    ? Math.round((totalVotes / effectivePopulation) * 100)
    : null;

  return (
    <div className="space-y-4">
      {choices.map((choice) => {
        const percent = civicQuestion.percentages[choice] || 0;
        const count = civicQuestion.voteCounts[choice] || 0;
        const isLeading = leadingVotes > 0 && count === leadingVotes && !isTie;
        return (
          <div key={choice} className={`rounded-lg border p-3 ${isLeading ? 'border-blue-300 bg-blue-50' : 'border-transparent bg-gray-50'}`}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">
                {t(`choices.${choice}`)}
                {isLeading && <span className="ml-2 text-xs text-blue-700 font-semibold">{t('results.leading')}</span>}
              </span>
              <span className="text-gray-700 font-medium">{percent}% · {count}</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${COLORS[choice]}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
      <div className="text-sm text-gray-600 pt-1">{t('total_votes')}: <strong>{totalVotes}</strong></div>
      {participationPct !== null && (
        <p className="text-sm text-gray-600 border-t border-gray-200 pt-2">
          <span className="font-semibold text-gray-800">{participationPct}%</span> {t('results.participation_of_population')}
        </p>
      )}
    </div>
  );
}
