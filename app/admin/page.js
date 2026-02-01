'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI, authAPI } from '@/lib/api';
import { getArticleStatusLabel } from '@/lib/utils/articleTypes';
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
    if (!confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτό το άρθρο;')) {
      return;
    }

    try {
      await articleAPI.delete(id);
      setArticles(articles.filter(a => a.id !== id));
      alert('Το άρθρο διαγράφηκε επιτυχώς');
    } catch (error) {
      alert('Αποτυχία διαγραφής άρθρου: ' + error.message);
    }
  };

  const handleApproveNews = async (id) => {
    if (!confirm('Να εγκριθεί αυτό το άρθρο ως είδηση και να δημοσιευθεί;')) {
      return;
    }

    try {
      const response = await articleAPI.approveNews(id);
      if (response.success) {
        // Update the article in the list with server response
        setArticles(articles.map(a => 
          a.id === id ? response.data.article : a
        ));
        alert('Η είδηση εγκρίθηκε και δημοσιεύθηκε επιτυχώς!');
      }
    } catch (error) {
      alert('Αποτυχία έγκρισης είδησης: ' + error.message);
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
      setUserRoleError(error.message || 'Αποτυχία ενημέρωσης ρόλου χρήστη.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Πίνακας διαχείρισης</h1>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Καλώς ήρθατε, {user?.username}!</h2>
          <p className="text-gray-600">
            Έχετε πρόσβαση ως {user?.role}. Μπορείτε να {user?.role === 'admin' ? 'δημιουργείτε, επεξεργάζεστε και διαγράφετε όλα τα άρθρα' : 'εγκρίνετε ειδήσεις και να διαχειρίζεστε περιεχόμενο'}.
          </p>
        </div>

        {/* Article Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Σύνολο άρθρων</h3>
            <p className="text-3xl font-bold mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Δημοσιευμένα</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{stats.published}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Πρόχειρα</h3>
            <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.draft}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Αρχειοθετημένα</h3>
            <p className="text-3xl font-bold mt-2 text-gray-600">{stats.archived}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Εκκρεμή νέα</h3>
            <p className="text-3xl font-bold mt-2 text-orange-600">{stats.pendingNews}</p>
          </div>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Σύνολο χρηστών</h3>
            <p className="text-3xl font-bold mt-2">{userStats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Διαχειριστές</h3>
            <p className="text-3xl font-bold mt-2 text-purple-600">{userStats.byRole.admin}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Συντονιστές</h3>
            <p className="text-3xl font-bold mt-2 text-blue-600">{userStats.byRole.moderator}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Συντάκτες</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{userStats.byRole.editor}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Αναγνώστες</h3>
            <p className="text-3xl font-bold mt-2 text-gray-600">{userStats.byRole.viewer}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Γρήγορες ενέργειες</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/editor"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Δημιουργία νέου άρθρου
            </Link>
            <Link
              href="/articles"
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
            >
              Προβολή όλων των άρθρων
            </Link>
          </div>
        </div>

        {/* Recent Articles Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Όλα τα άρθρα</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Φόρτωση άρθρων...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Δεν βρέθηκαν άρθρα.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Τίτλος
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Συντάκτης
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Κατάσταση
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Κατάσταση ειδήσεων
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Κατηγορία
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Δημιουργήθηκε
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ενέργειες
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
                        {article.author?.username || 'Άγνωστος'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.status === 'published' ? 'bg-green-100 text-green-800' :
                          article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getArticleStatusLabel(article.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {article.isNews ? (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            article.newsApprovedAt ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {article.newsApprovedAt ? '✓ Εγκεκριμένο' : '⏳ Εκκρεμές'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {article.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Προβολή
                        </Link>
                        {article.isNews && !article.newsApprovedAt && (
                          <button
                            onClick={() => handleApproveNews(article.id)}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Έγκριση
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Διαγραφή
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
            <h2 className="text-xl font-semibold">Χρήστες</h2>
          </div>

          {userRoleError && (
            <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {userRoleError}
            </div>
          )}

          {usersLoading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Φόρτωση χρηστών...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Δεν βρέθηκαν χρήστες.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Όνομα χρήστη
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ηλ. ταχυδρομείο
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Όνομα
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ρόλος
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Δημιουργήθηκε
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
                          <option value="viewer">Αναγνώστης</option>
                          <option value="editor">Συντάκτης</option>
                          <option value="moderator">Συντονιστής</option>
                          <option value="admin">Διαχειριστής</option>
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
