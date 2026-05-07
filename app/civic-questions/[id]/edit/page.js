'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import CivicQuestionForm from '@/components/civicQuestions/CivicQuestionForm';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { civicQuestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';

function EditCivicQuestionContent() {
  const t = useTranslations('civicQuestions');
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
            setError(t('edit.forbidden'));
            return;
          }
          setCivicQuestion(question);
        }
      } catch (err) {
        setError(err.message || t('detail.load_error'));
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
      setSubmitError(err.message || t('edit.update_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('edit.confirm_delete'))) return;
    try {
      const response = await civicQuestionAPI.delete(questionId);
      if (response.success) {
        router.push('/civic-questions');
      }
    } catch {
      alert(t('edit.delete_error'));
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
            title={t('edit.cannot_edit_title')}
            description={error || t('edit.cannot_edit_description')}
            action={{ label: t('detail.back_list'), href: '/civic-questions' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('edit.title')}</h1>
          <p className="text-gray-600 mt-2">{t('edit.description')}</p>
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
