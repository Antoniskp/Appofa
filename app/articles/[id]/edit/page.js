'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
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
    type: 'personal',
    category: '',
    status: 'draft',
    isNews: false,
  });
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
            type: currentArticle.type || 'personal',
            category: currentArticle.category || '',
            status: currentArticle.status || 'draft',
            isNews: Boolean(currentArticle.isNews),
          });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await articleAPI.update(params.id, formData);
      if (response.success) {
        router.push(`/articles/${params.id}`);
      } else {
      setSubmitError(response.message || 'Αποτυχία ενημέρωσης άρθρου. Παρακαλώ δοκιμάστε ξανά.');
      }
    } catch (err) {
    setSubmitError(`Αποτυχία ενημέρωσης άρθρου: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">Φόρτωση άρθρου...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Σφάλμα φόρτωσης άρθρου: {error || 'Το άρθρο δεν βρέθηκε'}</p>
        </div>
        <Link href="/articles" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Πίσω στα άρθρα
        </Link>
      </div>
    );
  }

  const canEdit = user && (user.role === 'admin' || user.role === 'editor' || user.id === article.authorId);

  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Δεν έχετε άδεια να επεξεργαστείτε αυτό το άρθρο.</p>
        </div>
        <Link href={`/articles/${article.id}`} className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Πίσω στο άρθρο
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={`/articles/${article.id}`} className="inline-block mb-6 text-blue-600 hover:text-blue-800">
          ← Πίσω στο άρθρο
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">Επεξεργασία άρθρου</h1>

          {submitError && (
            <div className="mb-6 border px-4 py-3 rounded bg-red-100 border-red-400 text-red-700">
              <p>{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Τίτλος *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Εισάγετε τίτλο άρθρου"
              />
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                Περίληψη
              </label>
              <input
                type="text"
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Σύντομη περίληψη (προαιρετικό)"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Περιεχόμενο *
              </label>
              <textarea
                id="content"
                name="content"
                required
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Γράψτε το περιεχόμενο του άρθρου σας εδώ..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Τύπος άρθρου *
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
                      {articleType.labelEl}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {articleCategories.articleTypes[formData.type]?.description}
                </p>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Κατηγορία {isCategoryRequired(formData.type, articleCategories) && '*'}
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
                  Κατάσταση *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Πρόχειρο</option>
                  <option value="published">Δημοσιευμένο</option>
                  <option value="archived">Αρχειοθετημένο</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Αποθήκευση...' : 'Αποθήκευση αλλαγών'}
              </button>
              <Link
                href={`/articles/${article.id}`}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition"
              >
                Ακύρωση
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
