'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getArticleTypeLabel, getArticleTypeClasses } from '@/lib/utils/articleTypes';
import { useToast } from '@/components/ToastProvider';
import ArticleForm from '@/components/ArticleForm';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePermissions } from '@/hooks/usePermissions';

function EditorDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { canEditArticle, canDeleteArticle } = usePermissions();

  const { data: articles, loading, refetch } = useAsyncData(
    async () => {
      if (!user?.id) {
        return [];
      }
      const response = await articleAPI.getAll({ authorId: user?.id, limit: 50 });
      if (response.success) {
        return response.data.articles || [];
      }
      return [];
    },
    [user?.id],
    {
      initialData: [],
      onError: (error) => {
        console.error('Failed to fetch articles:', error);
      }
    }
  );

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await articleAPI.create(formData);
      if (response.success) {
        addToast('Article created successfully!', { type: 'success' });
        const articleId = response.data.article.id;
        // Redirect to edit page where users can add locations
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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await articleAPI.delete(id);
      refetch();
      addToast('Article deleted successfully', { type: 'success' });
    } catch (error) {
      addToast(`Failed to delete article: ${error.message}`, { type: 'error' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Article Dashboard</h1>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2">Welcome, {user?.username}!</h2>
          <p className="text-gray-600">
            You can create and manage articles here.
          </p>
        </div>

        {/* Create Article Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Article</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              {showForm ? 'Hide Form' : 'Show Form'}
            </button>
          </div>

          {showForm && (
            <ArticleForm
              article={null}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={submitting}
              submitError={submitError}
            />
          )}
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Articles</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No articles found. Create your first article!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {articles.slice(0, 10).map((article) => {
                return (
                  <div key={article.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold mb-1">
                          <Link href={`/articles/${article.id}`} className="hover:text-blue-600">
                            {article.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {article.summary || article.content?.substring(0, 100) + '...'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded ${
                            article.status === 'published' ? 'bg-green-100 text-green-800' :
                            article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {article.status}
                          </span>
                          {article.type && (
                            <span className={`px-2 py-1 rounded ${getArticleTypeClasses(article.type)}`}>
                              {getArticleTypeLabel(article.type)}
                            </span>
                          )}
                          {article.isNews && (
                            <span className={`px-2 py-1 rounded ${
                              article.newsApprovedAt ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {article.newsApprovedAt ? '📰 Approved News' : '📰 Pending News'}
                            </span>
                          )}
                          {article.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {article.category}
                            </span>
                          )}
                          {Array.isArray(article.tags) && article.tags.length > 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                              {article.tags.join(', ')}
                            </span>
                          )}
                          <span>By {article.User?.username || 'Unknown'}</span>
                          <span>•</span>
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </Link>
                        {canDeleteArticle(article) && (
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {articles.length > 10 && (
            <div className="px-6 py-4 bg-gray-50 text-center">
              <Link href="/articles" className="text-blue-600 hover:text-blue-800 font-medium">
                View All Articles →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditorDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'editor', 'moderator', 'viewer']}>
      <EditorDashboardContent />
    </ProtectedRoute>
  );
}
