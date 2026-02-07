'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { pollAPI } from '@/lib/api';
import { getSessionId, hasVotedOnPoll, markPollAsVoted, getUserVote } from '@/lib/utils/pollSession';
import VoteInterface from '@/components/VoteInterface';
import PollResults from '@/components/PollResults';
import PollStats from '@/components/PollStats';
import Button from '@/components/Button';
import SkeletonLoader from '@/components/SkeletonLoader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/ToastProvider';
import { PencilSquareIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { showToast } = useToast();

  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userVote, setUserVote] = useState(null);

  const pollId = params.id;

  useEffect(() => {
    loadPoll();
    loadResults();
  }, [pollId]);

  useEffect(() => {
    // Check if user has voted (from localStorage for unauthenticated users)
    if (!user && hasVotedOnPoll(pollId)) {
      const vote = getUserVote(pollId);
      setUserVote(vote);
    }
  }, [pollId, user]);

  const loadPoll = async () => {
    setLoading(true);
    try {
      const response = await pollAPI.getById(pollId);
      if (response.success) {
        setPoll(response.data.poll);
        // Check if authenticated user has voted (from backend)
        // The backend returns userVotes array, check if it has any items
        if (response.data.poll.userVotes && response.data.poll.userVotes.length > 0) {
          setUserVote(response.data.poll.userVotes[0]);
        }
      } else {
        showToast('Η ψηφοφορία δεν βρέθηκε', 'error');
        router.push('/polls');
      }
    } catch (error) {
      console.error('Error loading poll:', error);
      showToast(error.message || 'Σφάλμα κατά τη φόρτωση της ψηφοφορίας', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const response = await pollAPI.getResults(pollId);
      if (response.success) {
        setResults(response.data);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const handleVote = async (voteData) => {
    setVotingLoading(true);
    try {
      // Add sessionId for unauthenticated users
      if (!user) {
        voteData.sessionId = getSessionId();
      }

      const response = await pollAPI.vote(pollId, voteData);
      
      if (response.success) {
        showToast('Η ψήφος σας καταχωρήθηκε με επιτυχία!', 'success');
        
        // Mark as voted in localStorage for unauthenticated users
        if (!user) {
          markPollAsVoted(pollId, voteData);
        }
        
        setUserVote(voteData);
        
        // Reload poll and results
        await loadPoll();
        await loadResults();
      } else {
        showToast(response.message || 'Σφάλμα κατά την υποβολή της ψήφου', 'error');
      }
    } catch (error) {
      console.error('Error voting:', error);
      showToast(error.message || 'Σφάλμα κατά την υποβολή της ψήφου', 'error');
    } finally {
      setVotingLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await pollAPI.delete(pollId);
      if (response.success) {
        showToast('Η ψηφοφορία διαγράφηκε με επιτυχία', 'success');
        router.push('/polls');
      } else {
        showToast(response.message || 'Σφάλμα κατά τη διαγραφή της ψηφοφορίας', 'error');
      }
    } catch (error) {
      console.error('Error deleting poll:', error);
      showToast(error.message || 'Σφάλμα κατά τη διαγραφή της ψηφοφορίας', 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-6xl">
          <SkeletonLoader type="article" count={1} />
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-6xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">Η ψηφοφορία δεν βρέθηκε</p>
          </div>
        </div>
      </div>
    );
  }

  const isCreator = user && poll.creatorId === user.id;
  const canEdit = isCreator || isAdmin;
  const isOpen = poll.status === 'open' || poll.status === 'active';
  const shouldShowResults = userVote || !isOpen || (isCreator && results);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-6xl">
        {/* Back Button */}
        <Link 
          href="/polls" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Πίσω στις Ψηφοφορίες
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Poll Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {poll.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Από {poll.creator?.username || 'Άγνωστος'}</span>
                    <span>•</span>
                    <span>
                      {new Date(poll.createdAt).toLocaleDateString('el-GR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/polls/${pollId}/edit`}>
                      <Button variant="secondary" size="sm">
                        <PencilSquareIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {poll.description && (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {poll.description}
                </p>
              )}
            </div>

            {/* Voting Interface or Results */}
            {!shouldShowResults && isOpen ? (
              <VoteInterface
                poll={poll}
                onVote={handleVote}
                userVote={userVote}
                isLoading={votingLoading}
              />
            ) : (
              results && <PollResults results={results} poll={poll} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PollStats poll={poll} variant="detailed" />

            {/* Poll Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Πληροφορίες</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Τύπος:</span>
                  <span className="font-medium text-gray-900">
                    {poll.pollType === 'simple' ? 'Απλή' : 'Σύνθετη'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ερώτηση:</span>
                  <span className="font-medium text-gray-900">
                    {poll.questionType === 'single-choice' && 'Μονή Επιλογή'}
                    {poll.questionType === 'ranked-choice' && 'Κατάταξη'}
                    {poll.questionType === 'free-text' && 'Ελεύθερο Κείμενο'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ανώνυμοι:</span>
                  <span className="font-medium text-gray-900">
                    {poll.allowUnauthenticatedVoting ? 'Ναι' : 'Όχι'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Νέες Επιλογές:</span>
                  <span className="font-medium text-gray-900">
                    {poll.allowUserAddOptions ? 'Ναι' : 'Όχι'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Διαγραφή Ψηφοφορίας"
        message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ψηφοφορία; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
        confirmLabel="Διαγραφή"
        variant="danger"
      />
    </div>
  );
}
