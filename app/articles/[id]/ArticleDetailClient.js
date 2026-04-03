'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShareIcon, BookmarkIcon, PrinterIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { bookmarkAPI } from '@/lib/api';
import CommentsThread from '@/components/comments/CommentsThread';
import { useAuth } from '@/lib/auth-context';
import Badge, { StatusBadge, TypeBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ToastProvider';
import { useFetchArticle } from '@/hooks/useFetchArticle';
import { usePermissions } from '@/hooks/usePermissions';
import RichArticleContent from '@/components/RichArticleContent';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { TooltipIconButton } from '@/components/ui/Tooltip';
import { idSlug } from '@/lib/utils/slugify';
import VideoEmbed from '@/components/articles/VideoEmbed';
import ReportButton from '@/components/ReportButton';
import ShareModal from '@/components/ui/ShareModal';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { error: toastError } = useToast();
  const { article, loading, error } = useFetchArticle(params.id);
  const { canEditArticle } = usePermissions();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentSettings, setCommentSettings] = useState({
    commentsEnabled: true,
    commentsLocked: false,
  });

  const isNews = article?.type === 'news' || article?.isNews;
  const isVideo = article?.type === 'video';
  const breadcrumbLabel = isVideo ? 'Βίντεο' : (isNews ? 'News' : 'Articles');
  const breadcrumbHref = isVideo ? '/videos' : (isNews ? '/news' : '/articles');

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleBookmark = () => {
    if (!user) {
      addToast('Συνδεθείτε για να αποθηκεύσετε άρθρα.', { type: 'info' });
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
          response.data?.bookmarked ? 'Το άρθρο αποθηκεύτηκε.' : 'Ο σελιδοδείκτης αφαιρέθηκε.',
          { type: 'success' }
        );
      })
      .catch((err) => {
        addToast(err.message || 'Σφάλμα κατά την ενημέρωση σελιδοδείκτη.', { type: 'error' });
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

  // Redirect old numeric-only URLs to canonical slug URLs
  useEffect(() => {
    if (!article) return;
    setCommentSettings({
      commentsEnabled: article.commentsEnabled !== false,
      commentsLocked: article.commentsLocked === true,
    });
    const isVideoType = article.type === 'video';
    const isOnVideosPath = pathname?.startsWith('/videos/');
    let basePath;
    if (article.type === 'news') {
      basePath = '/news';
    } else if (isVideoType && isOnVideosPath) {
      basePath = '/videos';
    } else {
      basePath = '/articles';
    }
    const canonical = idSlug(article.id, article.title);
    if (params.id !== canonical) {
      router.replace(`${basePath}/${canonical}`);
    }
  }, [article, params.id, router, pathname]);

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
    <>
    <div className="bg-gray-50 min-h-screen py-8">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <li>
              <Link href={breadcrumbHref} className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                {isVideo && <span aria-hidden="true">←</span>}{breadcrumbLabel}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700">{article.title}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* For video articles: show video embed at the top, hide banner image */}
          {isVideo ? (
            <div className="p-4 sm:p-6 pb-0">
              <VideoEmbed article={article} autoplay={true} compact={false} />
            </div>
          ) : (
            <img
              src={bannerImageUrl}
              alt={`${article.title} banner`}
              className="w-full h-64 object-cover"
              onError={handleBannerError}
            />
          )}
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
                  <ReportButton contentType="article" contentId={article.id} />
                  {canEditArticle(article) && (
                    <TooltipIconButton
                      icon={PencilSquareIcon}
                      tooltip="Επεξεργασία"
                      onClick={() => router.push(`/articles/${article.id}/edit`)}
                    />
                  )}
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

            {/* Video Embed (YouTube / TikTok) — only for non-video-type articles */}
            {!isVideo && <VideoEmbed article={article} />}

            {/* Article Content */}
            <div className="prose max-w-none mb-8">
              <RichArticleContent content={article.content} />
            </div>

            <CommentsThread
              entityType="article"
              entityId={article.id}
              commentsEnabled={commentSettings.commentsEnabled}
              commentsLocked={commentSettings.commentsLocked}
            />
          </div>
        </div>
      </article>

    </div>
      {showShareModal && (
        <ShareModal
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={article.title}
          shareText="Δείτε αυτό το άρθρο στο Appofa! 📰"
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
