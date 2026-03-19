'use client';

import { useState } from 'react';
import { endorsementAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import Badge from '@/components/Badge';
import Link from 'next/link';

const TOPICS = [
  'Education',
  'Economy',
  'Health',
  'Environment',
  'Local Governance',
  'Technology',
];

const PAGE_SIZE = 20;

const TOPIC_LABELS = {
  Education: 'Παιδεία',
  Economy: 'Οικονομία',
  Health: 'Υγεία',
  Environment: 'Περιβάλλον',
  'Local Governance': 'Τοπική Αυτοδιοίκηση',
  Technology: 'Τεχνολογία',
};

const DEFAULT_AVATAR_COLOR = '#64748b';

function UserLeaderboardCard({ user, rank }) {
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || '';

  return (
    <Link
      href={`/users/${user.username}`}
      className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <span className="text-2xl font-bold text-gray-400 w-8 text-center">{rank}</span>
      <div
        className="h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold"
        style={{ backgroundColor: user.avatarColor || DEFAULT_AVATAR_COLOR }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span>{(user.username || 'U').charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{user.username}</span>
          {user.role && user.role !== 'viewer' && (
            <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">
              {user.role}
            </Badge>
          )}
        </div>
        {displayName && (
          <p className="text-sm text-gray-500 truncate">{displayName}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-2xl font-bold text-blue-600">{user.endorsementCount}</p>
        <p className="text-xs text-gray-500">εγκρίσεις</p>
      </div>
    </Link>
  );
}

export default function WorthyCitizensPage() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error } = useAsyncData(
    async () => {
      const params = { page };
      if (selectedTopic) params.topic = selectedTopic;
      return endorsementAPI.getLeaderboard(params);
    },
    [selectedTopic, page],
    { initialData: null }
  );

  const users = data?.data?.users ?? [];
  const pagination = data?.data?.pagination ?? { currentPage: 1, totalPages: 1, totalItems: 0 };

  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
    setPage(1);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Άξιοι Πολίτες</h1>
          <p className="text-gray-600">
            Πολίτες αναγνωρισμένοι από την κοινότητα για τη γνώση και την εμπειρία τους.
          </p>
        </div>

        {/* Topic filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleTopicChange('')}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              selectedTopic === ''
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            Όλα
          </button>
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicChange(topic)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                selectedTopic === topic
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {TOPIC_LABELS[topic]}
            </button>
          ))}
        </div>

        {/* Results header */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            {pagination.totalItems} πολίτες βρέθηκαν
            {selectedTopic ? ` για θέμα: ${TOPIC_LABELS[selectedTopic]}` : ''}
          </p>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader type="card" count={5} />
          </div>
        ) : error ? (
          <EmptyState
            title="Σφάλμα"
            description="Δεν ήταν δυνατή η φόρτωση της λίστας. Παρακαλώ δοκιμάστε ξανά."
          />
        ) : users.length === 0 ? (
          <EmptyState
            title="Δεν βρέθηκαν αποτελέσματα"
            description={
              selectedTopic
                ? `Δεν υπάρχουν ακόμα εγκρίσεις για το θέμα "${TOPIC_LABELS[selectedTopic]}".`
                : 'Δεν υπάρχουν ακόμα εγκρίσεις. Γίνετε ο πρώτος που θα εγκρίνει έναν συμπολίτη!'
            }
          />
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => (
              <UserLeaderboardCard
                key={user.id}
                user={user}
                rank={(page - 1) * PAGE_SIZE + index + 1}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
