'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShareIcon, BookmarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { articleAPI, bookmarkAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Badge, { StatusBadge, TypeBadge } from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import { useFetchArticle } from '@/hooks/useFetchArticle';
import { usePermissions } from '@/hooks/usePermissions';
import Button from '@/components/Button';
import SkeletonLoader from '@/components/SkeletonLoader';
import { ConfirmDialog } from '@/components/Modal';
import { TooltipIconButton } from '@/components/Tooltip';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { error: toastError } = useToast();
  const { article, loading, error } = useFetchArticle(params.id);
  const { canEditArticle, canDeleteArticle } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const isNews = article?.type === 'news' || article?.isNews;
  const breadcrumbLabel = isNews ? 'News' : 'Articles';
  const breadcrumbHref = isNews ? '/news' : '/articles';

  const handleDelete = async () => {
    try {
      await articleAPI.delete(params.id);
      addToast('Article deleted successfully', { type: 'success' });
      router.push('/articles');
    } catch (err) {
      addToast(`Failed to delete article: ${err.message}`, { type: 'error' });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.summary || article?.content?.substring(0, 200),
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      addToast('Link copied to clipboard!', { type: 'success' });
    }
  };

  const handleBookmark = () => {
    if (!user) {
      addToast('Please log in to bookmark articles.', { type: 'info' });
      return;
    }

    if (!article?.id || bookmarkLoading) return;

    setBookmarkLoading(true);
    bookmarkAPI.toggle('article', article.id)
      .then((response) => {
        setIsBookmarked(Boolean(response.data?.bookmarked));
        setBookmarkCount((prev) => (
          response.data?.bookmarked ? prev + 1 : Math.max(prev - 1, 0)
        ));
        addToast(
          response.data?.bookmarked ? 'Article bookmarked.' : 'Bookmark removed.',
          { type: 'success' }
        );
      })
      .catch((err) => {
        addToast(err.message || 'Failed to update bookmark.', { type: 'error' });
      })
      .finally(() => {
        setBookmarkLoading(false);
      });
  };

  useEffect(() => {
    if (!user || !article?.id) {
      setIsBookmarked(false);
      return;
    }

    let isActive = true;
    bookmarkAPI.getStatus('article', article.id)
      .then((response) => {
        if (isActive) {
          setIsBookmarked(Boolean(response.data?.bookmarked));
        }
      })
      .catch(() => {
        if (isActive) {
          setIsBookmarked(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, article?.id]);

  useEffect(() => {
    if (!article?.id) {
      setBookmarkCount(0);
      return;
    }

    let isActive = true;
    bookmarkAPI.getCount('article', article.id)
      .then((response) => {
        if (isActive) {
          setBookmarkCount(response.data?.count || 0);
        }
      })
      .catch(() => {
        if (isActive) {
          setBookmarkCount(0);
        }
      });

    return () => {
      isActive = false;
    };
  }, [article?.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SkeletonLoader type="article" count={1} />
      </div>
    );
  }

  if (error || !article) {
    if (error) {
      toastError(error || 'Article not found');
    }
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-red-600 mb-4">Error loading article: {error || 'Article not found'}</p>
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

  const defaultBannerImageUrl = '/images/branding/news default.png';
  const bannerImageUrl = article.bannerImageUrl || defaultBannerImageUrl;
  const handleBannerError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = defaultBannerImageUrl;
  };
  const authorLabel = article.hideAuthor ? 'Anonymous' : (article.author?.username || 'Unknown');

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

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <img
            src={bannerImageUrl}
            alt={`${article.title} banner`}
            className="w-full h-64 object-cover"
            onError={handleBannerError}
          />
          <div className="p-8">
            {/* Article Header */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {article.type && <TypeBadge type={article.type} size="md" />}
                {article.category && (
                  <Badge variant="primary" size="md">
                    {article.category}
                  </Badge>
                )}
                {Array.isArray(article.tags) && article.tags.length > 0 && (
                  <Badge variant="purple" size="md">
                    {article.tags.join(', ')}
                  </Badge>
                )}
                {article.status !== 'published' && (
                  <StatusBadge status={article.status} size="md" />
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm border-b border-gray-200 pb-4">
                <div className="flex items-center">
                  <span className="font-medium">By {authorLabel}</span>
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
                <div className="ml-auto flex gap-2">
                  <TooltipIconButton
                    icon={ShareIcon}
                    tooltip="Κοινοποίηση άρθρου"
                    onClick={handleShare}
                  />
                  <div className="flex items-center gap-1">
                    <TooltipIconButton
                      icon={isBookmarked ? BookmarkIconSolid : BookmarkIcon}
                      tooltip={isBookmarked ? 'Αφαίρεση από τα σελιδοδείκτες' : 'Αποθήκευση'}
                      onClick={handleBookmark}
                      disabled={bookmarkLoading}
                      variant={isBookmarked ? 'primary' : 'default'}
                    />
                    {bookmarkCount > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {bookmarkCount}
                      </span>
                    )}
                  </div>
                  <TooltipIconButton
                    icon={PrinterIcon}
                    tooltip="Εκτύπωση"
                    onClick={() => window.print()}
                  />
                </div>
              </div>
            </div>

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
            {(canEditArticle(article) || canDeleteArticle(article)) && (
              <div className="flex gap-4 pt-8 border-t border-gray-200">
                {canEditArticle(article) && (
                  <Link href={`/articles/${article.id}/edit`}>
                    <Button variant="secondary">
                      Edit Article
                    </Button>
                  </Link>
                )}
                {canDeleteArticle(article) && (
                  <Button 
                    variant="danger" 
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Article
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete Article"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
