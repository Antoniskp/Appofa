'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { pollAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import Button from '@/components/Button';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/Modal';
import { TooltipIconButton } from '@/components/Tooltip';

const TABS = [
  { id: 'created', label: 'Δημιουργημένες' },
  { id: 'voted', label: 'Συμμετείχα' },
];

function PollStatusBadge({ status }) {
  const variants = { active: 'success', closed: 'secondary', archived: 'secondary' };
  const labels = { active: 'Ενεργή', closed: 'Κλειστή', archived: 'Αρχειοθετημένη' };
  return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
}

function CreatedPollsTab({ user }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState(null);

  const { data: polls, loading, error, refetch } = useAsyncData(
    async () => {
      if (!user?.id) return [];
      const response = await pollAPI.getAll({ creatorId: user.id, limit: 50 });
      if (response.success) return response.data || [];
      return [];
    },
    [user?.id],
    { initialData: [] }
  );

  const handleDelete = async (id) => {
    try {
      await pollAPI.delete(id);
      refetch();
      addToast('Η δημοσκόπηση διαγράφηκε.', { type: 'success' });
    } catch (error) {
      addToast(`Αποτυχία διαγραφής: ${error.message}`, { type: 'error' });
    }
  };

  if (loading) return <SkeletonLoader type="card" count={4} variant="list" />;
  if (error) return (
    <EmptyState type="error" title="Σφάλμα φόρτωσης" description={error} action={{ text: 'Δοκιμάστε ξανά', onClick: refetch }} />
  );
  if (polls.length === 0) return (
    <EmptyState
      type="empty"
      title="Δεν έχετε δημιουργήσει δημοσκοπήσεις"
      description="Δημιουργήστε την πρώτη σας δημοσκόπηση!"
      action={{ text: 'Δημιουργία δημοσκόπησης', onClick: () => router.push('/polls/create') }}
    />
  );

  return (
    <>
      <div className="divide-y divide-gray-200">
        {polls.map((poll) => (
          <div key={poll.id} className="p-6 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold mb-1">
                  <Link href={`/polls/${poll.id}`} className="hover:text-blue-600">{poll.title}</Link>
                </h3>
                {poll.description && (
                  <p className="text-sm text-gray-600 mb-2">{poll.description.substring(0, 120)}{poll.description.length > 120 ? '...' : ''}</p>
                )}
                <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
                  <PollStatusBadge status={poll.status} />
                  {poll.category && <Badge variant="primary">{poll.category}</Badge>}
                  <span>{poll.totalVotes ?? 0} ψήφοι</span>
                  <span>•</span>
                  <span>{new Date(poll.createdAt).toLocaleDateString('el-GR')}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <TooltipIconButton icon={EyeIcon} tooltip="Προβολή" onClick={() => router.push(`/polls/${poll.id}`)} />
                <TooltipIconButton
                  icon={TrashIcon}
                  tooltip="Διαγραφή"
                  onClick={() => { setPollToDelete(poll.id); setDeleteDialogOpen(true); }}
                  variant="danger"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => handleDelete(pollToDelete)}
        title="Διαγραφή Δημοσκόπησης"
        message="Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή τη δημοσκόπηση; Η ενέργεια δεν μπορεί να αναιρεθεί."
        confirmText="Διαγραφή"
        cancelText="Άκυρο"
        variant="danger"
      />
    </>
  );
}

function VotedPollsTab({ user }) {
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

  if (loading) return <SkeletonLoader type="card" count={4} variant="list" />;
  if (error) return (
    <EmptyState type="error" title="Σφάλμα φόρτωσης" description={error} action={{ text: 'Δοκιμάστε ξανά', onClick: refetch }} />
  );
  if (votedPolls.length === 0) return (
    <EmptyState
      type="empty"
      title="Δεν έχετε συμμετάσχει σε δημοσκοπήσεις"
      description="Επισκεφθείτε τις δημοσκοπήσεις και ψηφίστε!"
      action={{ text: 'Δείτε δημοσκοπήσεις', onClick: () => router.push('/polls') }}
    />
  );

  return (
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
                  <p className="text-sm text-gray-400 italic">Η δημοσκόπηση έχει κλείσει — δεν είναι δυνατή η αλλαγή ψήφου.</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <TooltipIconButton icon={EyeIcon} tooltip="Προβολή δημοσκόπησης" onClick={() => router.push(`/polls/${poll.id}`)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MyPollsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('created');

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Οι δημοσκοπήσεις μου</h1>
          <Button
            onClick={() => router.push('/polls/create')}
            variant="primary"
            icon={<PlusCircleIcon className="h-5 w-5" />}
          >
            Δημιουργία δημοσκόπησης
          </Button>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <Card>
          {activeTab === 'created' && <CreatedPollsTab user={user} />}
          {activeTab === 'voted' && <VotedPollsTab user={user} />}
        </Card>
      </div>
    </div>
  );
}

export default function MyPollsPage() {
  return (
    <ProtectedRoute>
      <MyPollsContent />
    </ProtectedRoute>
  );
}
