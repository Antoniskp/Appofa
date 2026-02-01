'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpenIcon, TrashIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import ArticleForm from '@/components/ArticleForm';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { SafeHtml, truncateHtml } from '@/lib/html-sanitizer';

function EditorDashboardContent() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const statusLabels = {
    draft: 'Πρόχειρο',
    published: 'Δημοσιευμένο',
    archived: 'Αρχειοθετημένο'
  };
  const emptyPreviewMessage = 'Δεν υπάρχει διαθέσιμη προεπισκόπηση.';
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    summary: '',
    category: '',
    articleType: 'personal',
    status: 'draft',
    isFeatured: false,
    coverImageUrl: '',
    coverImageCaption: '',
    sourceName: '',
    sourceUrl: '',
    tags: '',
    locationId: null,
    useUserLocation: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchArticles();
    }
  }, [user?.id]);

  const fetchArticles = async () => {
    try {
      const response = await articleAPI.getAll({ limit: 50, authorId: user?.id });
      if (response.success) {
        setArticles(response.data.articles || []);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === 'number') {
      if (value === '') {
        setFormData((prev) => ({
          ...prev,
          [name]: '',
        }));
        return;
      }
      if (Number.isNaN(Number(value))) {
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
          : []
      };
      const response = await articleAPI.create(payload);
      if (response.success) {
        alert('Το άρθρο δημιουργήθηκε με επιτυχία!');
        setShowForm(false);
        setFormData({
          title: '',
          subtitle: '',
          content: '',
          summary: '',
          category: '',
          articleType: 'personal',
          status: 'draft',
          isFeatured: false,
          coverImageUrl: '',
          coverImageCaption: '',
          sourceName: '',
          sourceUrl: '',
          tags: '',
          locationId: null,
          useUserLocation: false
        });
        fetchArticles();
      }
    } catch (error) {
      alert('Αποτυχία δημιουργίας άρθρου: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτό το άρθρο;')) {
      return;
    }

    try {
      await articleAPI.delete(id);
      setArticles(articles.filter(a => a.id !== id));
      alert('Το άρθρο διαγράφηκε με επιτυχία.');
    } catch (error) {
      alert('Αποτυχία διαγραφής άρθρου: ' + error.message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Create Article Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Δημιουργία Νέου Άρθρου</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              {showForm ? 'Απόκρυψη φόρμας' : 'Προβολή φόρμας'}
            </button>
          </div>

          {showForm && (
            <ArticleForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitLabel="Δημιουργία"
              cancelLabel="Ακύρωση"
              onCancel={() => setShowForm(false)}
              onLocationChange={(locationId) => setFormData((prev) => ({ ...prev, locationId }))}
              onUseUserLocationChange={(checked) => setFormData((prev) => ({ ...prev, useUserLocation: checked }))}
            />
          )}
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Πρόσφατα Άρθρα</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Φόρτωση άρθρων...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Δεν βρέθηκαν άρθρα. Δημιουργήστε το πρώτο σας άρθρο!</p>
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
                        {article.summary ? (
                          <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
                        ) : article.content ? (
                          <div className="prose max-w-none mb-2 line-clamp-3">
                            <SafeHtml
                              html={truncateHtml(article.content, 120)}
                              className="text-gray-800 leading-relaxed"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 mb-2">{emptyPreviewMessage}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded ${
                            article.status === 'published' ? 'bg-green-100 text-green-800' :
                            article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statusLabels[article.status] || article.status}
                          </span>
                          {article.isNews && (
                          <span className={`px-2 py-1 rounded ${
                            article.newsApprovedAt ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {article.newsApprovedAt ? 'Εγκεκριμένη είδηση' : 'Εκκρεμής είδηση'}
                          </span>
                        )}
                          {article.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {article.category}
                            </span>
                          )}
                          <span>Από {article.author?.username || article.User?.username || 'Άγνωστος'}</span>
                          <span>•</span>
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Προβολή
                        </Link>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            Διαγραφή
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
              <Link href="/articles" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
                Όλα τα άρθρα
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
