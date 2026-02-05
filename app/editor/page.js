'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import articleCategories from '@/config/articleCategories.json';
import { getArticleTypeLabel, getArticleTypeClasses, isCategoryRequired } from '@/lib/utils/articleTypes';
import { useToast } from '@/components/ToastProvider';
import LocationSelector from '@/components/LocationSelector';

function EditorDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    bannerImageUrl: '',
    type: 'personal',
    category: '',
    tags: '',
    status: 'draft',
    isNews: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchArticles = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    try {
      const response = await articleAPI.getAll({ authorId: user?.id, limit: 50 });
      if (response.success) {
        setArticles(response.data.articles || []);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchArticles();
    }
  }, [user?.id, fetchArticles]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If changing article type, reset category
    if (name === 'type') {
      setFormData({
        ...formData,
        [name]: value,
        category: '', // Reset category when type changes
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const response = await articleAPI.create(payload);
      if (response.success) {
        addToast('Article created successfully!', { type: 'success' });
        const articleId = response.data.article.id;
        // Redirect to edit page where users can add locations
        router.push(`/articles/${articleId}/edit`);
      }
    } catch (error) {
      addToast(`Failed to create article: ${error.message}`, { type: 'error' });
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
      setArticles(articles.filter(a => a.id !== id));
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                  Summary
                </label>
                <input
                  type="text"
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief summary (optional)"
                />
              </div>
 
              <div>
                <label htmlFor="bannerImageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  id="bannerImageUrl"
                  name="bannerImageUrl"
                  value={formData.bannerImageUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. AI, Research"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your article content here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Τύπος Άρθρου (Article Type) *
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.values(articleCategories.articleTypes).map((articleType) => (
                      <option key={articleType.value} value={articleType.value}>
                        {articleType.labelEl} ({articleType.label})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {articleCategories.articleTypes[formData.type]?.description}
                  </p>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Κατηγορία (Category) {isCategoryRequired(formData.type, articleCategories) && '*'}
                  </label>
                  {articleCategories.articleTypes[formData.type]?.categories.length > 0 ? (
                    <select
                      id="category"
                      name="category"
                      required={isCategoryRequired(formData.type, articleCategories)}
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Επιλέξτε κατηγορία...</option>
                      {articleCategories.articleTypes[formData.type].categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="Δεν απαιτείται"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Locations Section - Disabled with informational message */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locations
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-3">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Note:</strong> Locations can be added after creating the article. 
                    You will be redirected to the edit page where you can link locations to your article.
                  </p>
                </div>
                
                {/* Disabled location selector */}
                <div className="opacity-50 pointer-events-none">
                  <LocationSelector
                    value={null}
                    onChange={() => {}}
                    placeholder="Locations can be added after article creation"
                    allowClear={false}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Article'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
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
                const canEdit = user.role === 'admin' || user.role === 'editor' || user.id === article.authorId;
                const canDelete = user.role === 'admin' || user.id === article.authorId;
                
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
                        {canDelete && (
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
