'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import ArticleForm from '@/components/ArticleForm';
import { articleAPI } from '@/lib/api';

function EditArticleContent() {
  const params = useParams();
  const router = useRouter();
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await articleAPI.getById(params.id);
        if (response.success) {
          const article = response.data.article;
          setFormData({
            title: article.title || '',
            subtitle: article.subtitle || '',
            content: article.content || '',
            summary: article.summary || '',
            category: article.category || '',
            articleType: article.articleType || 'personal',
            status: article.status || 'draft',
            isFeatured: article.isFeatured || false,
            coverImageUrl: article.coverImageUrl || '',
            coverImageCaption: article.coverImageCaption || '',
            sourceName: article.sourceName || '',
            sourceUrl: article.sourceUrl || '',
            tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
            locationId: article.locationId || null,
            useUserLocation: false
          });
        } else {
          setLoadError(response.message || 'Αποτυχία φόρτωσης άρθρου.');
        }
      } catch (err) {
        setLoadError(err.message || 'Αποτυχία φόρτωσης άρθρου.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
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
      const response = await articleAPI.update(params.id, payload);
      if (response.success) {
        alert('Το άρθρο ενημερώθηκε με επιτυχία!');
        router.push(`/articles/${params.id}`);
      } else {
        setSubmitError(response.message || 'Αποτυχία ενημέρωσης άρθρου.');
      }
    } catch (err) {
      setSubmitError(err.message || 'Αποτυχία ενημέρωσης άρθρου.');
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

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{loadError}</p>
        </div>
        <Link href="/articles" className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Πίσω στα άρθρα
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Επεξεργασία Άρθρου</h1>
          <Link href={`/articles/${params.id}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Πίσω στο άρθρο
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <ArticleForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Αποθήκευση"
            submitError={submitError}
            cancelLabel="Ακύρωση"
            cancelHref={`/articles/${params.id}`}
            onLocationChange={(locationId) => setFormData((prev) => ({ ...prev, locationId }))}
            onUseUserLocationChange={(checked) => setFormData((prev) => ({ ...prev, useUserLocation: checked }))}
          />
        </div>
      </div>
    </div>
  );
}

export default function EditArticlePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'editor', 'viewer', 'moderator']}>
      <EditArticleContent />
    </ProtectedRoute>
  );
}
