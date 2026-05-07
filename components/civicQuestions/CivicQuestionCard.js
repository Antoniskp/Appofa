'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';

const sourceLabels = {
  parliament: 'Parliament',
  european_commission: 'European Commission',
  municipal_council: 'Municipal Council',
  regional_council: 'Regional Council',
  other: 'Other',
};

const statusLabels = {
  open: 'Open',
  closed: 'Closed',
  archived: 'Archived',
};

export default function CivicQuestionCard({ civicQuestion }) {
  const createdAt = new Date(civicQuestion.createdAt).toLocaleDateString('el-GR');

  return (
    <Link
      href={`/civic-questions/${civicQuestion.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="primary">{sourceLabels[civicQuestion.sourceType] || civicQuestion.sourceType}</Badge>
        <Badge variant={civicQuestion.status === 'open' ? 'success' : 'gray'}>{statusLabels[civicQuestion.status] || civicQuestion.status}</Badge>
        {civicQuestion.visibility === 'locals_only' && <Badge variant="orange">Local</Badge>}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{civicQuestion.title}</h3>
      {civicQuestion.simplified && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{civicQuestion.simplified}</p>
      )}
      <div className="mt-4 text-sm text-gray-500 flex flex-wrap gap-3">
        <span>{civicQuestion.totalVotes || 0} votes</span>
        {civicQuestion.location?.name && <span>📍 {civicQuestion.location.name}</span>}
        <span>{createdAt}</span>
      </div>
    </Link>
  );
}
