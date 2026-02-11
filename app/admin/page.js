'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, CheckIcon, TrashIcon, PencilIcon, DocumentTextIcon, UserGroupIcon, NewspaperIcon, ArchiveBoxIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI, authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Card, { StatsCard } from '@/components/Card';
import Badge, { StatusBadge } from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import AdminTable from '@/components/admin/AdminTable';
import { ConfirmDialog } from '@/components/Modal';
import { TooltipIconButton } from '@/components/Tooltip';
import Tooltip from '@/components/Tooltip';

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

  const { data: articles, loading, refetch } = useAsyncData(
    async () => {
      const response = await articleAPI.getAll({ limit: 100 });
      if (response.success) {
        return response.data.articles || [];
      }
      return [];
    },
    [],
    {
      initialData: [],
      transform: (allArticles) => {
        // Calculate stats
        setStats({
          total: allArticles.length,
          published: allArticles.filter(a => a.status === 'published').length,
          draft: allArticles.filter(a => a.status === 'draft').length,
          archived: allArticles.filter(a => a.status === 'archived').length,
          pendingNews: allArticles.filter(a => a.isNews && !a.newsApprovedAt).length,
        });
        return allArticles;
      },
      onError: (error) => {
        console.error('Failed to fetch articles:', error);
      }
    }
  );

  const { data: users, loading: usersLoading, refetch: refetchUsers } = useAsyncData(
    async () => {
      const usersResponse = await authAPI.getUsers();
      if (usersResponse.success) {
        return usersResponse;
      }
      return { data: { users: [], stats: null } };
    },
    [],
    {
      initialData: [],
      transform: (response) => {
        const usersList = response.data.users || [];
        if (response.data.stats) {
          setUserStats(response.data.stats);
        }
        return usersList;
      },
      onError: (error) => {
        console.error('Failed to fetch users:', error);
      }
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

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await authAPI.updateUserRole(userId, newRole);
      if (response.success) {
        // Refetch users to get the updated list
        await refetchUsers();
        addToast('User role updated successfully!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Failed to update user role: ${error.message}`, { type: 'error' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

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

        {/* User Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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

        {/* Quick Actions */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/editor"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Create New Article
            </Link>
            <Link
              href="/articles"
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
            >
              View All Articles
            </Link>
            <Link
              href="/admin/locations"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              Manage Locations
            </Link>
            <Link
              href="/admin/status"
              className="bg-white text-blue-700 border border-blue-200 px-6 py-2 rounded hover:bg-blue-50 transition"
            >
              System Health
            </Link>
          </div>
        </Card>

        {/* Recent Articles Table */}
        <Card 
          className="overflow-hidden"
          header={<h2 className="text-xl font-semibold">All Articles</h2>}
        >
          
          <AdminTable
            columns={[
              {
                key: 'title',
                header: 'Title',
                render: (article) => (
                  <Link
                    href={`/articles/${article.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {article.title}
                  </Link>
                )
              },
              {
                key: 'author',
                header: 'Author',
                render: (article) => (article.hideAuthor ? 'Anonymous' : (article.author?.username || 'Unknown'))
              },
              {
                key: 'status',
                header: 'Status',
                render: (article) => <StatusBadge status={article.status} />
              },
              {
                key: 'newsStatus',
                header: 'News Status',
                render: (article) => (
                  article.isNews ? (
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
                render: (article) => article.category || '-'
              },
              {
                key: 'tags',
                header: 'Tags',
                render: (article) => Array.isArray(article.tags) && article.tags.length > 0 ? article.tags.join(', ') : '-'
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (article) => new Date(article.createdAt).toLocaleDateString()
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (article) => (
                  <div className="flex gap-2 items-center justify-end">
                    <TooltipIconButton
                      icon={EyeIcon}
                      tooltip="Προβολή άρθρου"
                      onClick={() => router.push(`/articles/${article.id}`)}
                    />
                    {article.isNews && !article.newsApprovedAt && (
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
        </Card>

        {/* Users Table */}
        <Card 
          className="overflow-hidden mt-8"
          header={<h2 className="text-xl font-semibold">Users</h2>}
        >

          <AdminTable
            columns={[
              {
                key: 'username',
                header: 'Username',
              },
              {
                key: 'email',
                header: 'Email',
              },
              {
                key: 'name',
                header: 'Name',
                render: (user) => [user.firstName, user.lastName].filter(Boolean).join(' ') || '-'
              },
              {
                key: 'role',
                header: 'Role',
                render: (user) => (
                  <Tooltip content="Αλλαγή ρόλου χρήστη" position="top">
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user.id, event.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </Tooltip>
                )
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (user) => new Date(user.createdAt).toLocaleDateString()
              }
            ]}
            data={users}
            loading={usersLoading}
            emptyMessage="No users found."
            actions={false}
          />
        </Card>
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
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
