'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { SafeHtml } from '@/lib/html-sanitizer';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const statusLabels = {
    draft: 'Πρόχειρο',
    published: 'Δημοσιευμένο',
    archived: 'Αρχειοθετημένο'
  };
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tags = Array.isArray(article?.tags) ? article.tags : [];
  const statusLabel = article ? statusLabels[article.status] || article.status : '';

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await articleAPI.getById(params.id);
        if (response.success) {
          setArticle(response.data.article);
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

  const handleDelete = async () => {
    if (!confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτό το άρθρο;')) {
      return;
    }

    try {
      await articleAPI.delete(params.id);
      alert('Το άρθρο διαγράφηκε με επιτυχία.');
      router.push('/articles');
    } catch (err) {
      alert('Αποτυχία διαγραφής άρθρου: ' + err.message);
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
        <Link href="/articles" className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Πίσω στα άρθρα
        </Link>
      </div>
    );
  }

  const canEdit = user && (user.role === 'admin' || user.role === 'editor' || user.id === article.authorId);
  const canDelete = user && (user.role === 'admin' || user.id === article.authorId);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/articles" className="inline-flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Πίσω στα άρθρα
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {article.category && (
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                  {article.category}
                </span>
              )}
              {article.status !== 'published' && (
                <span className="inline-block bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded">
                  {statusLabel}
                </span>
              )}
              {article.isFeatured && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded">
                  Προτεινόμενο
                </span>
              )}
              {tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            {article.subtitle && (
              <p className="text-xl text-gray-600 mb-4">{article.subtitle}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm border-b border-gray-200 pb-4">
              <div className="flex items-center">
                <span className="font-medium">Από {article.author?.username || article.User?.username || 'Άγνωστος'}</span>
              </div>
              <span>•</span>
              <div>
                <span>Δημοσιεύθηκε: {new Date(article.createdAt).toLocaleDateString()}</span>
              </div>
              {article.readingTimeMinutes && (
                <>
                  <span>•</span>
                  <div>
                    <span>{article.readingTimeMinutes} λεπτά ανάγνωσης</span>
                  </div>
                </>
              )}
              {article.updatedAt !== article.createdAt && (
                <>
                  <span>•</span>
                  <div>
                    <span>Ενημερώθηκε: {new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cover Image */}
          {article.coverImageUrl && (
            <div className="mb-8">
              <figure>
                <img
                  src={article.coverImageUrl}
                  alt={article.coverImageCaption || article.title}
                  className="w-full max-h-[28rem] rounded-lg object-cover"
                  width="1200"
                  height="630"
                  loading="lazy"
                />
                {article.coverImageCaption && (
                  <figcaption className="text-sm text-gray-500 mt-2">
                    {article.coverImageCaption}
                  </figcaption>
                )}
              </figure>
            </div>
          )}

          {/* Article Summary */}
          {article.summary && (
            <div className="mb-8">
              <p className="text-xl text-gray-700 italic border-l-4 border-blue-600 pl-4">
                {article.summary}
              </p>
            </div>
          )}

          {/* Article Content */}
          <div className="prose max-w-none mb-8">
            <SafeHtml 
              html={article.content}
              className="text-gray-800 leading-relaxed"
            />
          </div>

          {(article.sourceName || article.sourceUrl) && (
            <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
              <span className="font-medium">Πηγή:</span>{' '}
              {article.sourceUrl ? (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {article.sourceName || article.sourceUrl}
                </a>
              ) : (
                <span>{article.sourceName}</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {(canEdit || canDelete) && (
            <div className="flex gap-4 pt-8 border-t border-gray-200">
              {canEdit && (
                <Link
                  href={`/articles/${article.id}/edit`}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                >
                  <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                  Επεξεργασία
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  Διαγραφή
                </button>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
