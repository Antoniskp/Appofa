'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pollAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import ProtectedRoute from '@/components/ProtectedRoute';
import PollForm from '@/components/PollForm';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

function EditPollContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const pollId = params.id;

  useEffect(() => {
    const fetchPoll = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await pollAPI.getById(pollId);
        if (response.success) {
          const pollData = response.data;
          
          // Check permissions
          if (!user || (pollData.creatorId !== user.id && !isAdmin)) {
            setError('Δεν έχετε δικαίωμα να επεξεργαστείτε αυτή τη δημοσκόπηση');
            return;
          }
          
          setPoll(pollData);
        }
      } catch (err) {
        setError(err.message || 'Σφάλμα κατά τη φόρτωση της δημοσκόπησης');
      } finally {
        setLoading(false);
      }
    };

    if (pollId && user !== undefined) {
      fetchPoll();
    }
  }, [pollId, user, isAdmin]);

  const handleSubmit = async (pollData) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await pollAPI.update(pollId, pollData);
      if (response.success) {
        router.push(`/polls/${pollId}`);
      }
    } catch (err) {
      setSubmitError(err.message || 'Σφάλμα κατά την ενημέρωση της δημοσκόπησης');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/polls/${pollId}`);
  };

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
            title="Σφάλμα"
            description={error || 'Δεν μπορείτε να επεξεργαστείτε αυτή τη δημοσκόπηση.'}
            action={{
              text: 'Επιστροφή',
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Επεξεργασία Δημοσκόπησης</h1>
          <p className="text-gray-600 mt-2">
            Ενημερώστε τις λεπτομέρειες της δημοσκόπησής σας
          </p>
        </div>

        <PollForm
          poll={poll}
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </div>
  );
}

export default function EditPollPage() {
  return (
    <ProtectedRoute>
      <EditPollContent />
    </ProtectedRoute>
  );
}
