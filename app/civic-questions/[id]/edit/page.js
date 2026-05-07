'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import CivicQuestionForm from '@/components/civicQuestions/CivicQuestionForm';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { civicQuestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function EditCivicQuestionContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [civicQuestion, setCivicQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const questionId = parseInt(params.id, 10);

  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await civicQuestionAPI.getById(questionId);
        if (response.success) {
          const question = response.data;
          const canEdit = user && (question.creatorId === user.id || user.role === 'admin');
          if (!canEdit) {
            setError('You are not allowed to edit this civic question.');
            return;
          }
          setCivicQuestion(question);
        }
      } catch (err) {
        setError(err.message || 'Failed to load civic question.');
      } finally {
        setLoading(false);
      }
    };

    if (questionId && user !== undefined) {
      fetchQuestion();
    }
  }, [questionId, user]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await civicQuestionAPI.update(questionId, payload);
      if (response.success) {
        router.push(`/civic-questions/${questionId}`);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to update civic question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this civic question?')) return;
    try {
      const response = await civicQuestionAPI.delete(questionId);
      if (response.success) {
        router.push('/civic-questions');
      }
    } catch {
      alert('Failed to delete civic question.');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-4xl">
          <SkeletonLoader type="card" count={1} />
        </div>
      </div>
    );
  }

  if (error || !civicQuestion) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-4xl">
          <EmptyState
            type="error"
            title="Cannot edit civic question"
            description={error || 'This civic question could not be loaded.'}
            action={{ label: 'Back to civic questions', href: '/civic-questions' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Civic Question</h1>
          <p className="text-gray-600 mt-2">Update civic question details and settings.</p>
        </div>
        <CivicQuestionForm
          civicQuestion={civicQuestion}
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/civic-questions/${questionId}`)}
          onDelete={handleDelete}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </div>
  );
}

export default function EditCivicQuestionPage() {
  return (
    <ProtectedRoute>
      <EditCivicQuestionContent />
    </ProtectedRoute>
  );
}
