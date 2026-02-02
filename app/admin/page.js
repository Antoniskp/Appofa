'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI, authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function AdminDashboardContent() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
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
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userRoleError, setUserRoleError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all articles (admin can see all)
        const response = await articleAPI.getAll({ limit: 100 });
        if (response.success) {
          const allArticles = response.data.articles || [];
          setArticles(allArticles);
          
          // Calculate stats
          setStats({
            total: allArticles.length,
            published: allArticles.filter(a => a.status === 'published').length,
            draft: allArticles.filter(a => a.status === 'draft').length,
            archived: allArticles.filter(a => a.status === 'archived').length,
            pendingNews: allArticles.filter(a => a.isNews && !a.newsApprovedAt).length,
          });
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const usersResponse = await authAPI.getUsers();
        if (usersResponse.success) {
          const usersList = usersResponse.data.users || [];
          setUsers(usersList);
          if (usersResponse.data.stats) {
            setUserStats(usersResponse.data.stats);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchData();
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await articleAPI.delete(id);
      setArticles(articles.filter(a => a.id !== id));
      alert('Article deleted successfully');
    } catch (error) {
      alert('Failed to delete article: ' + error.message);
    }
  };

  const handleApproveNews = async (id) => {
    if (!confirm('Approve this article as news and publish it?')) {
      return;
    }

    try {
      const response = await articleAPI.approveNews(id);
      if (response.success) {
        // Update the article in the list with server response
        setArticles(articles.map(a => 
          a.id === id ? response.data.article : a
        ));
        alert('News approved and published successfully!');
      }
    } catch (error) {
      alert('Failed to approve news: ' + error.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUserRoleError('');
      const response = await authAPI.updateUserRole(userId, newRole);
      if (response.success) {
        setUsers((prevUsers) => {
          const index = prevUsers.findIndex((u) => u.id === userId);
          if (index === -1) {
            return prevUsers;
          }
          const updatedUsers = [...prevUsers];
          updatedUsers[index] = response.data.user;
          return updatedUsers;
        });
        if (response.data.stats) {
          setUserStats(response.data.stats);
        }
      }
    } catch (error) {
      setUserRoleError(error.message || 'Failed to update user role.');
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
          
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No articles found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      News Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articles.map((article) => (
                    <tr key={article.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {article.author?.username || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.status === 'published' ? 'bg-green-100 text-green-800' :
                          article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {article.isNews ? (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            article.newsApprovedAt ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {article.newsApprovedAt ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {article.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Array.isArray(article.tags) && article.tags.length > 0 ? article.tags.join(', ') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        {article.isNews && !article.newsApprovedAt && (
                          <button
                            onClick={() => handleApproveNews(article.id)}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Users</h2>
          </div>

          {userRoleError && (
            <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {userRoleError}
            </div>
          )}

          {usersLoading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
