'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CalendarIcon, 
  UserIcon, 
  EyeIcon, 
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { pollAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import PollVoting from '@/components/PollVoting';
import PollResults from '@/components/PollResults';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import Badge from '@/components/Badge';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const pollId = params.id;

  const fetchPoll = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await pollAPI.getById(pollId);
      if (response.success) {
        setPoll(response.data);
      }
    } catch (err) {
      setError(err.message || 'Σφάλμα κατά τη φόρτωση της δημοσκόπησης');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const handleVoteSuccess = () => {
    // Refresh poll data after voting
    fetchPoll();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await pollAPI.delete(pollId);
      if (response.success) {
        router.push('/polls');
      }
    } catch (err) {
      alert('Σφάλμα κατά τη διαγραφή της δημοσκόπησης');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Check if user can view results
  const canViewResults = (poll) => {
    if (!poll) return false;
    
    if (poll.resultsVisibility === 'always') return true;
    if (poll.resultsVisibility === 'after_deadline' && poll.status === 'closed') return true;
    if (poll.resultsVisibility === 'after_vote' && poll.userVote) return true;
    
    // Creator and admin can always view results
    if (user && (poll.creatorId === user.id || isAdmin)) return true;
    
    return false;
  };

  const isPollActive = poll && poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date());
  const isCreator = user && poll && poll.creatorId === user.id;
  const canEdit = isCreator || isAdmin;
  const canDelete = isCreator || isAdmin;
  const showResults = canViewResults(poll);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-4xl">
          <SkeletonLoader type="card" count={1} />
          <div className="mt-6">
            <SkeletonLoader type="text" count={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-4xl">
          <EmptyState
            type="error"
            title="Δεν Βρέθηκε η Δημοσκόπηση"
            description={error || 'Η δημοσκόπηση που ζητήσατε δεν υπάρχει.'}
            action={{
              text: 'Επιστροφή στις Δημοσκοπήσεις',
              onClick: () => router.push('/polls')
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant={poll.type === 'simple' ? 'primary' : 'purple'}>
                  {poll.type === 'simple' ? 'Απλή' : 'Σύνθετη'}
                </Badge>
                <Badge variant={isPollActive ? 'success' : 'gray'}>
                  {isPollActive ? 'Ενεργή' : 'Κλειστή'}
                </Badge>
                {poll.visibility === 'locals_only' && (
                  <Badge variant="orange">Τοπική</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{poll.title}</h1>
              
              {poll.description && (
                <p className="text-gray-700 text-lg mb-4 whitespace-pre-wrap">
                  {poll.description}
                </p>
              )}
            </div>
            
            {canEdit && (
              <div className="flex gap-2 ml-4">
                <Link
                  href={`/polls/${poll.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Επεξεργασία
                </Link>
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Διαγραφή
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Meta Information */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>
                Δημιουργός: <strong>{poll.creator?.username || 'Άγνωστος'}</strong>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                Δημιουργήθηκε: {new Date(poll.createdAt).toLocaleDateString('el-GR')}
              </span>
            </div>
            
            {poll.deadline && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                <span>
                  Λήγει: {new Date(poll.deadline).toLocaleDateString('el-GR')} {new Date(poll.deadline).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <EyeIcon className="h-4 w-4" />
              <span>
                Ορατότητα: <strong>
                  {poll.visibility === 'public' ? 'Δημόσια' : 
                   poll.visibility === 'locals_only' ? 'Τοπική' : 
                   'Μόνο Συνδεδεμένοι'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Voting Section */}
        {isPollActive && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ψηφοφορία</h2>
            <PollVoting poll={poll} onVoteSuccess={handleVoteSuccess} />
          </div>
        )}

        {/* Results Section */}
        {showResults && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Αποτελέσματα</h2>
            <PollResults poll={poll} canView={showResults} />
          </div>
        )}

        {/* Results Not Available Message */}
        {!showResults && !isPollActive && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              Τα αποτελέσματα θα είναι διαθέσιμα {
                poll.resultsVisibility === 'after_deadline' ? 'μετά την προθεσμία της δημοσκόπησης' :
                poll.resultsVisibility === 'after_vote' ? 'αφού ψηφίσετε' :
                'σύντομα'
              }.
            </p>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6">
          <Link
            href="/polls"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Επιστροφή στις Δημοσκοπήσεις
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Διαγραφή Δημοσκόπησης"
        message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη δημοσκόπηση; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
        confirmText="Διαγραφή"
        cancelText="Ακύρωση"
        isLoading={isDeleting}
      />
    </div>
  );
}
