'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, TrashIcon, PencilIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Card from '@/components/ui/Card';
import Badge, { StatusBadge, TypeBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ToastProvider';
import ArticleForm from '@/components/articles/ArticleForm';
import { usePermissions } from '@/hooks/usePermissions';
import Button from '@/components/ui/Button';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { TooltipIconButton } from '@/components/ui/Tooltip';

const PAGE_LIMIT = 10;

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
  const [sortBy, setSortBy] = useState('lastModified'); // 'lastModified' or 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchArticles = useCallback(async (pageNum, reset = false) => {
    if (!user?.id) {
      setArticles([]);
      setLoading(false);
      return;
    }
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const orderBy = sortBy === 'title' ? 'title' : 'updatedAt';
      const response = await articleAPI.getAll({
        authorId: user.id,
        limit: PAGE_LIMIT,
        page: pageNum,
        orderBy,
        order: sortOrder,
      });
      if (response.success) {
        const fetched = response.data.articles || [];
        setArticles(prev => (reset || pageNum === 1) ? fetched : [...prev, ...fetched]);
        setHasMore(fetched.length === PAGE_LIMIT);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
    fetchArticles(1, true);
  }, [fetchArticles]);

  const refetch = useCallback(() => {
    setPage(1);
    fetchArticles(1, true);
  }, [fetchArticles]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchArticles(nextPage);
  };

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Τα άρθρα μου</h1>
          <Button onClick={() => setShowForm(!showForm)} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
            Δημιουργία άρθρου
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Νέο Άρθρο</h2>
            <ArticleForm
              article={null}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={submitting}
              submitError={submitError}
            />
          </Card>
        )}

        {/* Articles List */}
        <Card
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl font-semibold">Τα άρθρα μου</h2>
              <div className="flex gap-2 items-center">
                <label htmlFor="sortBy" className="text-sm mr-1">Sort by:</label>
                <select
                  id="sortBy"
                  className="border rounded px-2 py-1 text-sm"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="lastModified">Last Modified</option>
                  <option value="title">Alphabetical</option>
                </select>
                <button
                  className="ml-1 px-2 py-1 border rounded text-sm"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  aria-label="Toggle sort order"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          }
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
              {articles.map((article) => (
                <div key={article.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold mb-1">
                        <Link href={article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`} className="hover:text-blue-600">
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
                        <span>By {article.User?.username || user?.username || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <TooltipIconButton
                        icon={EyeIcon}
                        tooltip="Προβολή άρθρου"
                        onClick={() => router.push(article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`)}
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
              ))}
            </div>
          )}

          {hasMore && (
            <div className="px-6 py-4 text-center">
              <Button onClick={handleLoadMore} variant="secondary" disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
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
