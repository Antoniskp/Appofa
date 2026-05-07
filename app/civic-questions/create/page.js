'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import CivicQuestionForm from '@/components/civicQuestions/CivicQuestionForm';
import { civicQuestionAPI } from '@/lib/api';
import { useTranslations } from 'next-intl';

function CreateCivicQuestionContent() {
  const t = useTranslations('civicQuestions');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await civicQuestionAPI.create(payload);
      if (response.success) {
        router.push(`/civic-questions/${response.data.id}`);
      }
    } catch (err) {
      setSubmitError(err.message || t('create.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('create.title')}</h1>
          <p className="text-gray-600 mt-2">{t('create.description')}</p>
        </div>
        <CivicQuestionForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/civic-questions')}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </div>
  );
}

export default function CreateCivicQuestionPage() {
  return (
    <ProtectedRoute>
      <CreateCivicQuestionContent />
    </ProtectedRoute>
  );
}
