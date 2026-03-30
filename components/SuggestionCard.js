import Link from 'next/link';
import Badge from '@/components/Badge';

const TYPE_LABELS = {
  idea: 'Ιδέα',
  problem: 'Πρόβλημα',
  problem_request: 'Ερώτημα',
  location_suggestion: 'Τοποθεσία',
};

const TYPE_VARIANTS = {
  idea: 'primary',
  problem: 'warning',
  problem_request: 'danger',
  location_suggestion: 'success',
};

function VoteScore({ score }) {
  const colorClass =
    score > 0 ? 'text-green-600' : score < 0 ? 'text-red-500' : 'text-gray-500';
  return (
    <span className={`font-semibold ${colorClass}`}>
      {score > 0 ? `+${score}` : score}
    </span>
  );
}

export default function SuggestionCard({ suggestion }) {
  return (
    <Link
      href={`/suggestions/${suggestion.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200"
    >
      <div className="mb-3">
        <Badge variant={TYPE_VARIANTS[suggestion.type] || 'default'}>
          {TYPE_LABELS[suggestion.type] || suggestion.type}
        </Badge>
      </div>
      <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-3">
        {suggestion.title}
      </h3>
      <div className="flex items-center justify-between text-sm text-gray-500">
        {suggestion.author && (
          <span>@{suggestion.author.username}</span>
        )}
        <VoteScore score={suggestion.score ?? 0} />
      </div>
    </Link>
  );
}
