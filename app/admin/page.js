'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, CheckIcon, TrashIcon, PencilIcon, DocumentTextIcon, UserGroupIcon, NewspaperIcon, ArchiveBoxIcon, ShieldCheckIcon, UserIcon, MapPinIcon, EnvelopeIcon, XCircleIcon, FlagIcon, StarIcon, PhotoIcon, HeartIcon, PencilSquareIcon, UsersIcon, GlobeEuropeAfricaIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI, authAPI, notificationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
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

function AdminDashboardContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    pendingNews: 0,
  });
  const [userStats, setUserStats] = useState({
    total: 0,
    byRole: {
      admin: 0,
      moderator: 0,
      editor: 0,
      viewer: 0,
    },
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

  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '', actionUrl: '', targetRole: '' });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null); // { success, message }

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim()) return;
    setBroadcastLoading(true);
    setBroadcastResult(null);
    try {
      const res = await notificationAPI.broadcast({
        title: broadcastForm.title,
        body: broadcastForm.body || undefined,
        actionUrl: broadcastForm.actionUrl || undefined,
        targetRole: broadcastForm.targetRole || undefined,
      });
      setBroadcastResult({ success: true, message: res.data?.message || `Εστάλη σε ${res.data?.count} χρήστες` });
      setBroadcastForm({ title: '', body: '', actionUrl: '', targetRole: '' });
      setTimeout(() => setBroadcastResult(null), 5000);
    } catch (err) {
      setBroadcastResult({ success: false, message: err.message || 'Αποτυχία αποστολής' });
    } finally {
      setBroadcastLoading(false);
    }
  };

  const { data: articles, loading, refetch } = useAsyncData(
    async () => {
      let orderBy = 'updatedAt';
      if (sortBy === 'title') orderBy = 'title';
      else if (sortBy === 'createdAt') orderBy = 'createdAt';
      
      const params = {
        page,
        limit: 20,
        orderBy,
        order: sortOrder
      };
      
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      
      const response = await articleAPI.getAll(params);
      if (response.success) {
        const allArticles = response.data.articles || [];
        // Update total pages for pagination and accurate total from server
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setStats(prev => ({
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
        // Per-page status breakdown (reflects the current page only)
        setStats(prev => ({
          ...prev,
          published: allArticles.filter(a => a.status === 'published').length,
          draft: allArticles.filter(a => a.status === 'draft').length,
          archived: allArticles.filter(a => a.status === 'archived').length,
          pendingNews: allArticles.filter(a => a.type === 'news' && !a.newsApprovedAt).length,
        }));
        return allArticles;
      },
      onError: (error) => {
        console.error('Failed to fetch articles:', error);
      }
    }
  );

  const { data: userStatsData } = useAsyncData(
    async () => {
      const response = await authAPI.getAdminUsers({ page: 1, limit: 1 });
      if (response.success && response.data?.stats) {
        return response.data.stats;
      }
      return null;
    },
    [],
    {
      initialData: null,
      transform: (s) => {
        if (s) setUserStats(s);
        return s;
      },
    }
  );

  const handleDelete = async () => {
    if (!selectedArticle) return;
    
    try {
      await articleAPI.delete(selectedArticle.id);
      refetch();
      addToast('Article deleted successfully', { type: 'success' });
    } catch (error) {
      addToast(`Failed to delete article: ${error.message}`, { type: 'error' });
    }
  };

  const handleApproveNews = async () => {
    if (!selectedArticle) return;
    
    try {
      const response = await articleAPI.approveNews(selectedArticle.id);
      if (response.success) {
        refetch();
        addToast('News approved and published successfully!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Failed to approve news: ${error.message}`, { type: 'error' });
    }
  };

  // Combine article and news categories from config
  const allCategories = [...new Set([
    ...articleCategories.articleTypes.articles.categories,
    ...articleCategories.articleTypes.news.categories
  ])];

  // Scroll to top of table when page changes
  useEffect(() => {
    if (articlesTableRef.current) {
      articlesTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);
  return (
    <AdminLayout>
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader title="Admin Dashboard" />

        {/* Welcome Message */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.username}!</h2>
          <p className="text-gray-600">
            You have {user?.role} access. You can {user?.role === 'admin' ? 'create, edit, and delete all articles' : 'approve news submissions and manage content'}.
          </p>
        </Card>

        {/* Article Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Articles"
            value={stats.total}
            icon={DocumentTextIcon}
          />
          <StatsCard
            title="Published"
            value={stats.published}
            icon={CheckIcon}
          />
          <StatsCard
            title="Drafts"
            value={stats.draft}
            icon={PencilIcon}
          />
          <StatsCard
            title="Archived"
            value={stats.archived}
            icon={ArchiveBoxIcon}
          />
          <StatsCard
            title="Pending News"
            value={stats.pendingNews}
            icon={NewspaperIcon}
            variant="elevated"
          />
        </div>

        {/* User Statistics Cards — linked to /admin/users */}
        <Link href="/admin/users" className="block mb-8 group">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <StatsCard
              title="Total Users"
              value={userStats.total}
              icon={UserGroupIcon}
            />
            <StatsCard
              title="Admins"
              value={userStats.byRole.admin}
              icon={ShieldCheckIcon}
            />
            <StatsCard
              title="Moderators"
              value={userStats.byRole.moderator}
              icon={UserIcon}
            />
            <StatsCard
              title="Editors"
              value={userStats.byRole.editor}
              icon={UserIcon}
            />
            <StatsCard
              title="Viewers"
              value={userStats.byRole.viewer}
              icon={UserIcon}
            />
          </div>
        </Link>

        {/* Quick Actions */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { href: '/admin/users', label: 'Manage Users', icon: UsersIcon },
              { href: '/editor', label: 'Create Article', icon: PencilSquareIcon },
              { href: '/articles', label: 'View Articles', icon: DocumentTextIcon },
              { href: '/admin/locations', label: 'Manage Locations', icon: MapPinIcon },
              { href: '/admin/messages', label: 'Manage Messages', icon: EnvelopeIcon },
              { href: '/admin/persons', label: 'Manage Persons', icon: UserGroupIcon },
              { href: '/admin/removal-requests', label: 'Removal Requests', icon: XCircleIcon },
              { href: '/admin/reports', label: 'Reports', icon: FlagIcon },
              { href: '/admin/dream-team', label: 'Dream Team', icon: StarIcon },
               { href: '/admin/manifests', label: 'Manage Manifests', icon: DocumentTextIcon },
               { href: '/admin/hero', label: 'Hero Settings', icon: PhotoIcon },
               {
                 href: '/admin/geo',
                 label: '🌍 Γεωγραφικά & Χώρες',
                 description: 'Επισκεψιμότητα ανά χώρα, διασπορά, χρηματοδότηση',
                 icon: GlobeEuropeAfricaIcon,
               },
               { href: '/admin/status', label: 'System Health', icon: HeartIcon },
             ].map(action => (
               <Link
                 key={action.href}
                 href={action.href}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
              >
                 <action.icon className="h-8 w-8 text-gray-500 group-hover:text-blue-600 transition" />
                 <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 text-center">{action.label}</span>
                 {action.description && (
                   <span className="text-xs text-gray-500 text-center">{action.description}</span>
                 )}
               </Link>
             ))}
          </div>
        </Card>

        {/* Recent Articles Table */}
        <Card 
          ref={articlesTableRef}
          className="overflow-hidden"
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl font-semibold">All Articles</h2>
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
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
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
                  <option value="">All Categories</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <label htmlFor="sortBy" className="text-sm mr-1">Sort by:</label>
                <select
                  id="sortBy"
                  className="border rounded px-2 py-1 text-sm"
                  value={sortBy}
                  onChange={e => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="lastModified">Last Modified</option>
                  <option value="createdAt">Created Date</option>
                  <option value="title">Alphabetical</option>
                </select>
                <button
                  className="ml-1 px-2 py-1 border rounded text-sm"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    setPage(1);
                  }}
                  aria-label="Toggle sort order"
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
                header: 'Title',
                className: 'whitespace-normal',
                render: (article) => (
                  <Link
                    href={article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`}
                    className="text-blue-600 hover:text-blue-800 line-clamp-2 block"
                    title={article.title}
                  >
                    {article.title}
                  </Link>
                )
              },
              {
                key: 'author',
                header: 'Author',
                width: 'w-28',
                render: (article) => (article.hideAuthor ? 'Anonymous' : (article.author?.username || 'Unknown'))
              },
              {
                key: 'status',
                header: 'Status',
                width: 'w-24',
                render: (article) => <StatusBadge status={article.status} />
              },
              {
                key: 'newsStatus',
                header: 'News Status',
                width: 'w-28',
                render: (article) => (
                  article.type === 'news' ? (
                    <Badge variant={article.newsApprovedAt ? 'success' : 'warning'}>
                      {article.newsApprovedAt ? '✓ Approved' : '⏳ Pending'}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )
                )
              },
              {
                key: 'category',
                header: 'Category',
                width: 'w-32',
                render: (article) => article.category || '-'
              },
              {
                key: 'tags',
                header: 'Tags',
                width: 'w-40',
                render: (article) => Array.isArray(article.tags) && article.tags.length > 0 ? article.tags.join(', ') : '-'
              },
              {
                key: 'createdAt',
                header: 'Created',
                width: 'w-28',
                render: (article) => new Date(article.createdAt).toLocaleDateString()
              },
              {
                key: 'actions',
                header: 'Actions',
                width: 'w-24',
                render: (article) => (
                  <div className="flex gap-2 items-center justify-end">
                    <TooltipIconButton
                      icon={EyeIcon}
                      tooltip="Προβολή άρθρου"
                      onClick={() => router.push(article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`)}
                    />
                    {article.type === 'news' && !article.newsApprovedAt && (
                      <TooltipIconButton
                        icon={CheckIcon}
                        tooltip="Έγκριση άρθρου"
                        onClick={() => {
                          setSelectedArticle(article);
                          setApproveDialogOpen(true);
                        }}
                        variant="primary"
                      />
                    )}
                    <TooltipIconButton
                      icon={TrashIcon}
                      tooltip="Διαγραφή άρθρου"
                      onClick={() => {
                        setSelectedArticle(article);
                        setDeleteDialogOpen(true);
                      }}
                      variant="danger"
                    />
                  </div>
                )
              }
            ]}
            data={articles}
            loading={loading}
            emptyMessage="No articles found."
            actions={false}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onPrevious={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
          />
        </Card>

        {/* Broadcast panel — admin only */}
        {user?.role === 'admin' && (
          <Card className="mt-8" header={<h2 className="text-xl font-semibold flex items-center gap-2">📣 Ανακοινώσεις</h2>}>
            <form onSubmit={handleBroadcast} className="space-y-4 max-w-xl">
              <div>
                <label htmlFor="broadcastTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Τίτλος <span className="text-red-500">*</span>
                </label>
                <input
                  id="broadcastTitle"
                  type="text"
                  maxLength={200}
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Τίτλος ανακοίνωσης"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-0.5 text-right" aria-live="polite">{broadcastForm.title.length}/200</p>
              </div>
              <div>
                <label htmlFor="broadcastBody" className="block text-sm font-medium text-gray-700 mb-1">
                  Περιεχόμενο <span className="text-gray-400 text-xs">(προαιρετικό)</span>
                </label>
                <textarea
                  id="broadcastBody"
                  maxLength={500}
                  rows={3}
                  value={broadcastForm.body}
                  onChange={e => setBroadcastForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Σύντομο κείμενο ανακοίνωσης..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-0.5 text-right" aria-live="polite">{broadcastForm.body.length}/500</p>
              </div>
              <div>
                <label htmlFor="broadcastActionUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL ενέργειας <span className="text-gray-400 text-xs">(προαιρετικό)</span>
                </label>
                <input
                  id="broadcastActionUrl"
                  type="text"
                  value={broadcastForm.actionUrl}
                  onChange={e => setBroadcastForm(f => ({ ...f, actionUrl: e.target.value }))}
                  placeholder="/notifications"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="broadcastTargetRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Κοινό <span className="text-red-500">*</span>
                </label>
                <select
                  id="broadcastTargetRole"
                  value={broadcastForm.targetRole}
                  onChange={e => setBroadcastForm(f => ({ ...f, targetRole: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Όλοι οι χρήστες</option>
                  <option value="citizen">Χρήστες (citizen)</option>
                  <option value="candidate">Υποψήφιοι (candidate)</option>
                  <option value="admin">Διαχειριστές (admin)</option>
                  <option value="moderator">Συντονιστές (moderator)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={broadcastLoading || !broadcastForm.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {broadcastLoading ? 'Αποστολή...' : '📣 Αποστολή ανακοίνωσης'}
                </button>
                {broadcastResult && (
                  <span className={`text-sm ${broadcastResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {broadcastResult.success ? '✓ ' : '✗ '}{broadcastResult.message}
                  </span>
                )}
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Approve News Dialog */}
      <ConfirmDialog
        isOpen={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        onConfirm={handleApproveNews}
        title="Approve News"
        message="Approve this article as news and publish it?"
        confirmText="Approve & Publish"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
    </AdminLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
