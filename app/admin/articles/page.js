'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EyeIcon, CheckIcon, TrashIcon, PencilIcon, DocumentTextIcon, NewspaperIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import Card, { StatsCard } from '@/components/ui/Card';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import AdminTable from '@/components/admin/AdminTable';
import { ConfirmDialog } from '@/components/ui/Modal';
import { TooltipIconButton } from '@/components/ui/Tooltip';
import Pagination from '@/components/ui/Pagination';
import articleCategories from '@/config/articleCategories.json';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLayout from '@/components/admin/AdminLayout';

function AdminArticlesContent() {
  const tAdmin = useTranslations('admin');
  const tArticles = useTranslations('articles');
  const tCommon = useTranslations('common');
  const { addToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    pendingNews: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [sortBy, setSortBy] = useState('lastModified'); // 'lastModified' | 'title' | 'createdAt'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const articlesTableRef = useRef(null);

  const { data: articles, loading, refetch } = useAsyncData(
    async () => {
      let orderBy = 'updatedAt';
      if (sortBy === 'title') orderBy = 'title';
      else if (sortBy === 'createdAt') orderBy = 'createdAt';

      const params = {
        page,
        limit: 20,
        orderBy,
        order: sortOrder,
      };

      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const response = await articleAPI.getAll(params);
      if (response.success) {
        const allArticles = response.data.articles || [];
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setStats((prev) => ({
            ...prev,
            total: response.data.pagination.totalItems ?? response.data.pagination.total ?? allArticles.length,
          }));
        }
        return allArticles;
      }
      return [];
    },
    [sortBy, sortOrder, statusFilter, categoryFilter, page],
    {
      initialData: [],
      transform: (allArticles) => {
        setStats((prev) => ({
          ...prev,
          published: allArticles.filter((a) => a.status === 'published').length,
          draft: allArticles.filter((a) => a.status === 'draft').length,
          archived: allArticles.filter((a) => a.status === 'archived').length,
          pendingNews: allArticles.filter((a) => a.type === 'news' && !a.newsApprovedAt).length,
        }));
        return allArticles;
      },
      onError: (error) => {
        console.error('Failed to fetch articles:', error);
      },
    }
  );

  const handleDelete = async () => {
    if (!selectedArticle) return;

    try {
      await articleAPI.delete(selectedArticle.id);
      refetch();
      addToast(tArticles('deleted_successfully'), { type: 'success' });
    } catch (error) {
      addToast(`${tArticles('delete_failed_prefix')}: ${error.message}`, { type: 'error' });
    }
  };

  const handleApproveNews = async () => {
    if (!selectedArticle) return;

    try {
      const response = await articleAPI.approveNews(selectedArticle.id);
      if (response.success) {
        refetch();
        addToast(tAdmin('news_approved_success'), { type: 'success' });
      }
    } catch (error) {
      addToast(`${tAdmin('approve_news_failed')}: ${error.message}`, { type: 'error' });
    }
  };

  const allCategories = [...new Set([
    ...articleCategories.articleTypes.articles.categories,
    ...articleCategories.articleTypes.news.categories,
  ])];

  useEffect(() => {
    if (articlesTableRef.current) {
      articlesTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader title={tAdmin('all_articles')} />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title={tAdmin('total_articles')}
            value={stats.total}
            icon={DocumentTextIcon}
          />
          <StatsCard
            title={tAdmin('published')}
            value={stats.published}
            icon={CheckIcon}
          />
          <StatsCard
            title={tAdmin('drafts')}
            value={stats.draft}
            icon={PencilIcon}
          />
          <StatsCard
            title={tAdmin('archived')}
            value={stats.archived}
            icon={ArchiveBoxIcon}
          />
          <StatsCard
            title={tAdmin('pending_news')}
            value={stats.pendingNews}
            icon={NewspaperIcon}
            variant="elevated"
          />
        </div>

        <Card
          ref={articlesTableRef}
          className="overflow-hidden"
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl font-semibold">{tAdmin('all_articles')}</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  id="statusFilter"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{tCommon('all_statuses')}</option>
                  <option value="published">{tAdmin('published')}</option>
                  <option value="draft">{tAdmin('drafts')}</option>
                  <option value="archived">{tAdmin('archived')}</option>
                </select>

                <select
                  id="categoryFilter"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{tCommon('all_categories')}</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <label htmlFor="sortBy" className="text-sm mr-1">{tCommon('sort_by')}</label>
                <select
                  id="sortBy"
                  className="border rounded px-2 py-1 text-sm"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="lastModified">{tCommon('last_modified')}</option>
                  <option value="createdAt">{tCommon('created_date')}</option>
                  <option value="title">{tCommon('alphabetical')}</option>
                </select>
                <button
                  className="ml-1 px-2 py-1 border rounded text-sm"
                  title={sortOrder === 'asc' ? tCommon('ascending') : tCommon('descending')}
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    setPage(1);
                  }}
                  aria-label={tCommon('toggle_sort_order')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          }
        >
          <AdminTable
            columns={[
              {
                key: 'title',
                header: tArticles('table_title'),
                className: 'whitespace-normal',
                render: (article) => (
                  <Link
                    href={article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`}
                    className="text-blue-600 hover:text-blue-800 line-clamp-2 block"
                    title={article.title}
                  >
                    {article.title}
                  </Link>
                ),
              },
              {
                key: 'author',
                header: tArticles('table_author'),
                width: 'w-28',
                render: (article) => (article.hideAuthor ? tCommon('anonymous') : (article.author?.username || tCommon('unknown'))),
              },
              {
                key: 'status',
                header: tArticles('table_status'),
                width: 'w-24',
                render: (article) => <StatusBadge status={article.status} />,
              },
              {
                key: 'newsStatus',
                header: tAdmin('news_status'),
                width: 'w-28',
                render: (article) => (
                  article.type === 'news' ? (
                    <Badge variant={article.newsApprovedAt ? 'success' : 'warning'}>
                      {article.newsApprovedAt ? tAdmin('approved_badge') : tAdmin('pending_badge')}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )
                ),
              },
              {
                key: 'category',
                header: tArticles('table_category'),
                width: 'w-32',
                render: (article) => article.category || '-',
              },
              {
                key: 'tags',
                header: tArticles('table_tags'),
                width: 'w-40',
                render: (article) => (Array.isArray(article.tags) && article.tags.length > 0 ? article.tags.join(', ') : '-'),
              },
              {
                key: 'createdAt',
                header: tCommon('created'),
                width: 'w-28',
                render: (article) => new Date(article.createdAt).toLocaleDateString(),
              },
              {
                key: 'actions',
                header: tCommon('actions'),
                width: 'w-24',
                render: (article) => (
                  <div className="flex gap-2 items-center justify-end">
                    <TooltipIconButton
                      icon={EyeIcon}
                      tooltip={tArticles('view_article')}
                      onClick={() => router.push(article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`)}
                    />
                    {article.type === 'news' && !article.newsApprovedAt && (
                      <TooltipIconButton
                        icon={CheckIcon}
                        tooltip={tAdmin('approve_article')}
                        onClick={() => {
                          setSelectedArticle(article);
                          setApproveDialogOpen(true);
                        }}
                        variant="primary"
                      />
                    )}
                    <TooltipIconButton
                      icon={TrashIcon}
                      tooltip={tArticles('delete_article')}
                      onClick={() => {
                        setSelectedArticle(article);
                        setDeleteDialogOpen(true);
                      }}
                      variant="danger"
                    />
                  </div>
                ),
              },
            ]}
            data={articles}
            loading={loading}
            emptyMessage={tAdmin('no_articles_found')}
            actions={false}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </Card>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={tArticles('delete_confirm_title')}
        message={tArticles('delete_confirm_message')}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        onConfirm={handleApproveNews}
        title={tAdmin('approve_news_title')}
        message={tAdmin('approve_news_message')}
        confirmText={tAdmin('approve_publish')}
        cancelText={tCommon('cancel')}
        variant="primary"
      />
    </div>
  );
}

export default function AdminArticlesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminLayout>
        <AdminArticlesContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}
