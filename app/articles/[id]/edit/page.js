'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import ArticleForm from '@/components/ArticleForm';
import { useFetchArticle } from '@/hooks/useFetchArticle';
import { usePermissions } from '@/hooks/usePermissions';

function EditArticlePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { article, loading, error: loadError, refetch } = useFetchArticle(params.id);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { canEditArticle } = usePermissions();

  // Show error toast only when loading completes with an error
  useEffect(() => {
    if (!loading && loadError) {
      error('Article not found');
    }
  }, [loading, loadError, error]);

  // Show permission error toast only once when permission check fails
  useEffect(() => {
    if (!loading && article && !canEditArticle(article)) {
      error('You do not have permission to edit this article.');
    }
  }, [loading, article, canEditArticle, error]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await articleAPI.update(params.id, formData);
      if (response.success) {
        success('Article updated successfully!');
        router.push(`/articles/${params.id}`);
      } else {
        setSubmitError(response.message || 'Failed to update article. Please try again.');
      }
    } catch (err) {
      setSubmitError(`Failed to update article: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-red-600 mb-4">Article not found</p>
        <Link href="/articles" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Articles
        </Link>
      </div>
    );
  }

  if (!canEditArticle(article)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-red-600 mb-4">You do not have permission to edit this article.</p>
        <Link href={`/articles/${article.id}`} className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Article
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={`/articles/${article.id}`} className="inline-block mb-6 text-blue-600 hover:text-blue-800">
          ← Back to Article
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">Edit Article</h1>

          <ArticleForm
            article={article}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/articles/${article.id}`)}
            isSubmitting={submitting}
            submitError={submitError}
          />
        </div>
      </div>
    </div>
  );
}

export default function EditArticlePage() {
  return (
    <ProtectedRoute>
      <EditArticlePageContent />
    </ProtectedRoute>
  );
}
