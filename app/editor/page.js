'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Card from '@/components/Card';
import Badge, { StatusBadge, TypeBadge } from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import ArticleForm from '@/components/ArticleForm';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePermissions } from '@/hooks/usePermissions';
import Button from '@/components/Button';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/Modal';
import { TooltipIconButton } from '@/components/Tooltip';

function EditorDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { canEditArticle, canDeleteArticle } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);

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
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Welcome, {user?.username}!</h2>
          <p className="text-gray-600">
            You can create and manage articles here.
          </p>
        </Card>

        {/* Create Article Section */}
        <Card 
          header={
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Create New Article</h2>
              <Button onClick={() => setShowForm(!showForm)} variant="primary">
                {showForm ? 'Hide Form' : 'Show Form'}
              </Button>
            </div>
          }
          className="mb-8"
        >
          {showForm && (
            <ArticleForm
              article={null}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={submitting}
              submitError={submitError}
            />
          )}
        </Card>

        {/* Articles List */}
        <Card 
          className="overflow-hidden"
          header={<h2 className="text-xl font-semibold">Recent Articles</h2>}
        >

          {loading ? (
            <SkeletonLoader type="card" count={5} variant="list" />
          ) : articles.length === 0 ? (
            <EmptyState 
              type="empty"
              title="No articles found"
              description="Create your first article!"
            />
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
                          <StatusBadge status={article.status} />
                          {article.type && <TypeBadge type={article.type} />}
                          {article.isNews && (
                            <Badge 
                              variant={article.newsApprovedAt ? 'success' : 'warning'}
                              aria-label={article.newsApprovedAt ? 'Approved News' : 'Pending News'}
                            >
                              {article.newsApprovedAt ? '✓ Approved News' : '⏳ Pending News'}
                            </Badge>
                          )}
                          {article.category && (
                            <Badge variant="primary">{article.category}</Badge>
                          )}
                          {Array.isArray(article.tags) && article.tags.length > 0 && (
                            <Badge variant="purple">{article.tags.join(', ')}</Badge>
                          )}
                          <span>By {article.User?.username || 'Unknown'}</span>
                          <span>•</span>
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <TooltipIconButton
                          icon={EyeIcon}
                          tooltip="Προβολή άρθρου"
                          onClick={() => router.push(`/articles/${article.id}`)}
                        />
                        {canEditArticle(article) && (
                          <TooltipIconButton
                            icon={PencilIcon}
                            tooltip="Επεξεργασία άρθρου"
                            onClick={() => router.push(`/articles/${article.id}/edit`)}
                            variant="primary"
                          />
                        )}
                        {canDeleteArticle(article) && (
                          <TooltipIconButton
                            icon={TrashIcon}
                            tooltip="Διαγραφή άρθρου"
                            onClick={() => {
                              setArticleToDelete(article.id);
                              setDeleteDialogOpen(true);
                            }}
                            variant="danger"
                          />
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
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => handleDelete(articleToDelete)}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
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
