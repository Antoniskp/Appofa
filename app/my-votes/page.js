'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { pollAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { TooltipIconButton } from '@/components/Tooltip';

function PollStatusBadge({ status }) {
  const variants = { active: 'success', closed: 'secondary', archived: 'secondary' };
  const labels = { active: 'Ενεργή', closed: 'Κλειστή', archived: 'Αρχειοθετημένη' };
  return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
}

function MyVotesContent() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: votedPolls, loading, error, refetch } = useAsyncData(
    async () => {
      if (!user?.id) return [];
      const response = await pollAPI.getMyVotedPolls({ limit: 50 });
      if (response.success) return response.data || [];
      return [];
    },
    [user?.id],
    { initialData: [] }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Οι ψήφοι μου</h1>
          <p className="text-gray-600 mt-1">Όλες οι δημοσκοπήσεις στις οποίες έχετε ψηφίσει.</p>
        </div>

        <Card>
          {loading && <SkeletonLoader type="card" count={4} variant="list" />}
          {error && (
            <EmptyState
              type="error"
              title="Σφάλμα φόρτωσης"
              description={error}
              action={{ text: 'Δοκιμάστε ξανά', onClick: refetch }}
            />
          )}
          {!loading && !error && votedPolls.length === 0 && (
            <EmptyState
              type="empty"
              title="Δεν έχετε ψηφίσει ακόμη"
              description="Επισκεφθείτε τις δημοσκοπήσεις και ψηφίστε!"
              action={{ text: 'Δείτε δημοσκοπήσεις', onClick: () => router.push('/polls') }}
            />
          )}
          {!loading && !error && votedPolls.length > 0 && (
            <div className="divide-y divide-gray-200">
              {votedPolls.map((item) => {
                const poll = item.poll;
                if (!poll) return null;
                const isOpen = poll.status === 'active';
                return (
                  <div key={item.voteId} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold mb-1">
                          <Link href={`/polls/${poll.id}`} className="hover:text-blue-600">{poll.title}</Link>
                        </h3>
                        <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500 mb-2">
                          <PollStatusBadge status={poll.status} />
                          <span>Η ψήφος σας: <strong>{item.votedOption?.text || '—'}</strong></span>
                          <span>•</span>
                          <span>Ψηφίσατε: {new Date(item.votedAt).toLocaleDateString('el-GR')}</span>
                        </div>
                        {isOpen ? (
                          <Link
                            href={`/polls/${poll.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Αλλαγή ψήφου →
                          </Link>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            Η δημοσκόπηση έχει κλείσει — δεν είναι δυνατή η αλλαγή ψήφου.
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <TooltipIconButton
                          icon={EyeIcon}
                          tooltip="Προβολή δημοσκόπησης"
                          onClick={() => router.push(`/polls/${poll.id}`)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function MyVotesPage() {
  return (
    <ProtectedRoute>
      <MyVotesContent />
    </ProtectedRoute>
  );
}
