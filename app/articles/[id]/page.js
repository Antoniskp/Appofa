'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getArticleTypeLabel, getArticleTypeClasses } from '@/lib/utils/articleTypes';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const isNews = article?.type === 'news' || article?.isNews;
  const breadcrumbLabel = isNews ? 'News' : 'Articles';
  const breadcrumbHref = isNews ? '/news' : '/articles';

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await articleAPI.delete(params.id);
      alert('Article deleted successfully');
      router.push('/articles');
    } catch (err) {
      alert('Failed to delete article: ' + err.message);
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading article: {error || 'Article not found'}</p>
        </div>
        <nav aria-label="Breadcrumb" className="mt-4">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <li>
              <Link href={breadcrumbHref} className="text-blue-600 hover:text-blue-800">
                {breadcrumbLabel}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700">Article</li>
          </ol>
        </nav>
      </div>
    );
  }

  const canEdit = user && (user.role === 'admin' || user.role === 'editor' || user.id === article.authorId);
  const canDelete = user && (user.role === 'admin' || user.id === article.authorId);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <li>
              <Link href={breadcrumbHref} className="text-blue-600 hover:text-blue-800">
                {breadcrumbLabel}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700">{article.title}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.type && (
                <span className={`inline-block text-sm px-3 py-1 rounded ${getArticleTypeClasses(article.type)}`}>
                  {getArticleTypeLabel(article.type)}
                </span>
              )}
              {article.category && (
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                  {article.category}
                </span>
              )}
              {Array.isArray(article.tags) && article.tags.length > 0 && (
                <span className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded">
                  {article.tags.join(', ')}
                </span>
              )}
              {article.status !== 'published' && (
                <span className="inline-block bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded">
                  {article.status}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm border-b border-gray-200 pb-4">
              <div className="flex items-center">
                <span className="font-medium">By {article.author?.username || 'Unknown'}</span>
              </div>
              <span>•</span>
              <div>
                <span>Published: {new Date(article.createdAt).toLocaleDateString()}</span>
              </div>
              {article.updatedAt !== article.createdAt && (
                <>
                  <span>•</span>
                  <div>
                    <span>Updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {article.introImage && (
            <div className="mb-8">
              <img
                src={article.introImage.url}
                alt={article.introImage.title || article.title}
                className="w-full max-h-[420px] object-cover rounded-lg"
              />
              {article.introImage.title && (
                <p className="text-sm text-gray-500 mt-2">{article.introImage.title}</p>
              )}
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
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          </div>

          {/* Action Buttons */}
          {(canEdit || canDelete) && (
            <div className="flex gap-4 pt-8 border-t border-gray-200">
              {canEdit && (
                <Link
                  href={`/articles/${article.id}/edit`}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                >
                  Edit Article
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
                >
                  Delete Article
                </button>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
