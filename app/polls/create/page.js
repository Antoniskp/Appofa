'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pollAPI } from '@/lib/api';
import PollForm from '@/components/PollForm';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/components/ToastProvider';

function CreatePollPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (pollData) => {
    setIsLoading(true);
    try {
      const response = await pollAPI.create(pollData);
      
      if (response.success) {
        showToast('Η ψηφοφορία δημιουργήθηκε με επιτυχία!', 'success');
        router.push(`/polls/${response.data.poll.id}`);
      } else {
        showToast(response.message || 'Σφάλμα κατά τη δημιουργία της ψηφοφορίας', 'error');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      showToast(error.message || 'Σφάλμα κατά τη δημιουργία της ψηφοφορίας', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Δημιουργία Νέας Ψηφοφορίας
          </h1>
          <p className="text-gray-600">
            Δημιουργήστε μια νέα ψηφοφορία και συλλέξτε ψήφους από την κοινότητα
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <PollForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Δημιουργία Ψηφοφορίας"
          />
        </div>
      </div>
    </div>
  );
}

export default function ProtectedCreatePollPage() {
  return (
    <ProtectedRoute>
      <CreatePollPage />
    </ProtectedRoute>
  );
}
