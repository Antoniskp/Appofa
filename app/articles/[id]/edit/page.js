'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import AlertMessage from '@/components/AlertMessage';
import LocationSelector from '@/components/LocationSelector';
import articleCategories from '@/config/articleCategories.json';
import { isCategoryRequired } from '@/lib/utils/articleTypes';

function EditArticlePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
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
  const [linkedLocations, setLinkedLocations] = useState([]);
  const [newLocationId, setNewLocationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await articleAPI.getById(params.id);
        if (response.success) {
          const currentArticle = response.data.article;
          setArticle(currentArticle);
          setFormData({
            title: currentArticle.title || '',
            content: currentArticle.content || '',
            summary: currentArticle.summary || '',
            bannerImageUrl: currentArticle.bannerImageUrl || '',
            type: currentArticle.type || 'personal',
            category: currentArticle.category || '',
            tags: Array.isArray(currentArticle.tags) ? currentArticle.tags.join(', ') : '',
            status: currentArticle.status || 'draft',
            isNews: Boolean(currentArticle.isNews),
          });

          // Fetch linked locations
          try {
            const locationsResponse = await locationAPI.getEntityLocations('article', params.id);
            if (locationsResponse.success) {
              setLinkedLocations(locationsResponse.locations || []);
            }
          } catch (err) {
            console.error('Failed to load locations:', err);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If changing article type, reset category
    if (name === 'type') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        category: '', // Reset category when type changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationId) return;

    try {
      const response = await locationAPI.link('article', params.id, newLocationId);
      if (response.success) {
        // Reload locations
        const locationsResponse = await locationAPI.getEntityLocations('article', params.id);
        if (locationsResponse.success) {
          setLinkedLocations(locationsResponse.locations || []);
        }
        setNewLocationId(null);
      }
    } catch (err) {
      setSubmitError(`Failed to link location: ${err.message}`);
    }
  };

  const handleRemoveLocation = async (locationId) => {
    try {
      const response = await locationAPI.unlink('article', params.id, locationId);
      if (response.success) {
        setLinkedLocations(prev => prev.filter(loc => loc.id !== locationId));
      }
    } catch (err) {
      setSubmitError(`Failed to unlink location: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const response = await articleAPI.update(params.id, payload);
      if (response.success) {
        router.push(`/articles/${params.id}`);
      } else {
        setSubmitError(response.message || 'Failed to update article. Please try again.');
      }
    } catch (err) {
      setSubmitError(`Failed to update article: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AlertMessage message={`Error loading article: ${error || 'Article not found'}`} />
        <Link href="/articles" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Articles
        </Link>
      </div>
    );
  }

  const canEdit = user && (user.role === 'admin' || user.role === 'editor' || user.id === article.authorId);

  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AlertMessage message="You do not have permission to edit this article." />
        <Link href={`/articles/${article.id}`} className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Article
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={`/articles/${article.id}`} className="inline-block mb-6 text-blue-600 hover:text-blue-800">
          ← Back to Article
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">Edit Article</h1>

          <AlertMessage className="mb-6" message={submitError} />

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

            {/* Locations Section */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locations
              </label>
              
              {/* Linked Locations */}
              {linkedLocations.length > 0 && (
                <div className="mb-3 space-y-2">
                  {linkedLocations.map(location => (
                    <div key={location.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div>
                        <span className="font-medium text-gray-900">{location.name}</span>
                        {location.name_local && (
                          <span className="text-gray-500 ml-2">({location.name_local})</span>
                        )}
                        <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {location.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(location.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Location */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocationSelector
                    value={newLocationId}
                    onChange={setNewLocationId}
                    placeholder="Select a location to add"
                    allowClear={true}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddLocation}
                  disabled={!newLocationId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/articles/${article.id}`}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditArticlePage() {
  return (
    <ProtectedRoute>
      <EditArticlePageContent />
    </ProtectedRoute>
  );
}
