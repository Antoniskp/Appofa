'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';
import ArticleForm from '@/components/articles/ArticleForm';
import { articleAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

function NewArticleContent() {
  const tArticles = useTranslations('articles');
  const router = useRouter();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await articleAPI.create(formData);
      if (response.success) {
        addToast(tArticles('created_successfully'), { type: 'success' });
        const articleId = response.data.article.id;
        router.push(`/articles/${articleId}/edit`);
      } else {
        setSubmitError(response.message || tArticles('create_failed'));
      }
    } catch (error) {
      setSubmitError(`${tArticles('create_failed_prefix')}: ${error.message}`);
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
          {tArticles('title')}
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-gray-900">{tArticles('create_new')}</h1>

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
