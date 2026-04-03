'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import InlineSuggestionVote from '@/components/InlineSuggestionVote';

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

export default function SuggestionCard({ suggestion }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
      <Link href={`/suggestions/${suggestion.id}`} className="block">
        <div className="mb-3">
          <Badge variant={TYPE_VARIANTS[suggestion.type] || 'default'}>
            {TYPE_LABELS[suggestion.type] || suggestion.type}
          </Badge>
        </div>
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-3">
          {suggestion.title}
        </h3>
      </Link>
      <div className="flex items-center justify-between text-sm text-gray-500">
        {suggestion.author && (
          <span>@{suggestion.author.username}</span>
        )}
        <InlineSuggestionVote
          suggestionId={suggestion.id}
          type={suggestion.type}
          initialUpvotes={suggestion.upvotes ?? 0}
          initialDownvotes={suggestion.downvotes ?? 0}
          initialMyVote={suggestion.myVote ?? null}
        />
      </div>
    </div>
  );
}
