'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI, authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import AlertMessage from '@/components/AlertMessage';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import AdminTable from '@/components/admin/AdminTable';

function AdminDashboardContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
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
  const [userRoleError, setUserRoleError] = useState('');

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

  const handleDelete = async (article) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await articleAPI.delete(article.id);
      refetch();
      addToast('Article deleted successfully', { type: 'success' });
    } catch (error) {
      addToast(`Failed to delete article: ${error.message}`, { type: 'error' });
    }
  };

  const handleApproveNews = async (article) => {
    if (!confirm('Approve this article as news and publish it?')) {
      return;
    }

    try {
      const response = await articleAPI.approveNews(article.id);
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
      setUserRoleError('');
      const response = await authAPI.updateUserRole(userId, newRole);
      if (response.success) {
        // Refetch users to get the updated list
        await refetchUsers();
        addToast('User role updated successfully!', { type: 'success' });
      }
    } catch (error) {
      setUserRoleError(error.message || 'Failed to update user role.');
      addToast(`Failed to update user role: ${error.message}`, { type: 'error' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.username}!</h2>
          <p className="text-gray-600">
            You have {user?.role} access. You can {user?.role === 'admin' ? 'create, edit, and delete all articles' : 'approve news submissions and manage content'}.
          </p>
        </div>

        {/* Article Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Articles</h3>
            <p className="text-3xl font-bold mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Published</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{stats.published}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Drafts</h3>
            <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.draft}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Archived</h3>
            <p className="text-3xl font-bold mt-2 text-gray-600">{stats.archived}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending News</h3>
            <p className="text-3xl font-bold mt-2 text-orange-600">{stats.pendingNews}</p>
          </div>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold mt-2">{userStats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Admins</h3>
            <p className="text-3xl font-bold mt-2 text-purple-600">{userStats.byRole.admin}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Moderators</h3>
            <p className="text-3xl font-bold mt-2 text-blue-600">{userStats.byRole.moderator}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Editors</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{userStats.byRole.editor}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Viewers</h3>
            <p className="text-3xl font-bold mt-2 text-gray-600">{userStats.byRole.viewer}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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
        </div>

        {/* Recent Articles Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Articles</h2>
          </div>
          
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
                render: (article) => article.author?.username || 'Unknown'
              },
              {
                key: 'status',
                header: 'Status',
                render: (article) => (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    article.status === 'published' ? 'bg-green-100 text-green-800' :
                    article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {article.status}
                  </span>
                )
              },
              {
                key: 'newsStatus',
                header: 'News Status',
                render: (article) => (
                  article.isNews ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      article.newsApprovedAt ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {article.newsApprovedAt ? '✓ Approved' : '⏳ Pending'}
                    </span>
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
                  <div className="flex gap-3 items-center justify-end">
                    <Link
                      href={`/articles/${article.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                    {article.isNews && !article.newsApprovedAt && (
                      <button
                        onClick={() => handleApproveNews(article)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(article)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                )
              }
            ]}
            data={articles}
            loading={loading}
            emptyMessage="No articles found."
            actions={false}
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Users</h2>
          </div>

          <AlertMessage className="mx-6 mt-4" message={userRoleError} />

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
        </div>
      </div>
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
