'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import ArticleForm from '@/components/articles/ArticleForm';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import LoginLink from '@/components/ui/LoginLink';

function NewArticleContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">Πρέπει να συνδεθείτε για να δημιουργήσετε άρθρο.</p>
            <LoginLink className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Σύνδεση
            </LoginLink>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await articleAPI.create(formData);
      if (response.success) {
        addToast('Article created successfully!', { type: 'success' });
        const articleId = response.data.article.id;
        router.push(`/articles/${articleId}/edit`);
      } else {
        setSubmitError(response.message || 'Failed to create article. Please try again.');
      }
    } catch (error) {
      setSubmitError(`Failed to create article: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/articles"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Άρθρα
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-gray-900">Νέο Άρθρο</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <ArticleForm
            article={null}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/articles')}
            isSubmitting={submitting}
            submitError={submitError}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewArticlePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'editor', 'moderator', 'viewer']}>
      <NewArticleContent />
    </ProtectedRoute>
  );
}
