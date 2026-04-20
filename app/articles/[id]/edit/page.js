'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import ArticleForm from '@/components/articles/ArticleForm';
import { useFetchArticle } from '@/hooks/useFetchArticle';
import { usePermissions } from '@/hooks/usePermissions';

function EditArticlePageContent() {
  const tArticles = useTranslations('articles');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { article, loading, error: loadError, refetch } = useFetchArticle(params.id);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { canEditArticle, canDeleteArticle } = usePermissions();

  // Show error toast only when loading completes with an error
  useEffect(() => {
    if (!loading && loadError) {
      error(tArticles('not_found'));
    }
  }, [loading, loadError, error]);

  // Show permission error toast only once when permission check fails
  useEffect(() => {
    if (!loading && article && !canEditArticle(article)) {
      error(tArticles('no_edit_permission'));
    }
  }, [loading, article, canEditArticle, error]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await articleAPI.update(params.id, formData);
      if (response.success) {
        success(tArticles('updated_successfully'));
        const redirectPath = article.type === 'news' ? `/news/${params.id}` : `/articles/${params.id}`;
        router.push(redirectPath);
      } else {
        setSubmitError(response.message || tArticles('update_failed'));
      }
    } catch (err) {
      setSubmitError(`${tArticles('update_failed_prefix')}: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await articleAPI.delete(params.id);
      success(tArticles('deleted_successfully'));
      const redirectPath = article.type === 'news' ? '/news' : '/articles';
      router.push(redirectPath);
    } catch (err) {
      error(`${tArticles('delete_failed_prefix')}: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">{tArticles('loading_article')}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-red-600 mb-4">{tArticles('not_found')}</p>
        <Link href="/articles" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← {tArticles('back_to_articles')}
        </Link>
      </div>
    );
  }

  const isNews = article.type === 'news';
  const articleDetailPath = isNews ? `/news/${article.id}` : `/articles/${article.id}`;

  if (!canEditArticle(article)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-red-600 mb-4">{tArticles('no_edit_permission')}</p>
        <Link href={articleDetailPath} className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← {tArticles('back_to_article')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={articleDetailPath} className="inline-block mb-6 text-blue-600 hover:text-blue-800">
          ← {tArticles('back_to_article')}
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">{tArticles('edit_article_title')}</h1>

          <ArticleForm
            article={article}
            onSubmit={handleSubmit}
            onCancel={() => router.push(articleDetailPath)}
            onDelete={canDeleteArticle(article) ? handleDelete : undefined}
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
