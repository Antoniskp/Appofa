'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pollAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import PollForm from '@/components/PollForm';

function CreatePollContent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (pollData) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await pollAPI.create(pollData);
      if (response.success) {
        router.push(`/polls/${response.data.id}`);
      }
    } catch (err) {
      setSubmitError(err.message || 'Σφάλμα κατά τη δημιουργία της δημοσκόπησης');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/polls');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Δημιουργία Δημοσκόπησης</h1>
          <p className="text-gray-600 mt-2">
            Δημιουργήστε μια νέα δημοσκόπηση και συλλέξτε γνώμες από την κοινότητα
          </p>
        </div>

        <PollForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </div>
  );
}

export default function CreatePollPage() {
  return (
    <ProtectedRoute>
      <CreatePollContent />
    </ProtectedRoute>
  );
}
