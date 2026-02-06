import Link from 'next/link';
import { getArticleTypeLabel, getArticleTypeClasses } from '@/lib/utils/articleTypes';
import Button from '@/components/Button';

/**
 * Reusable article card component
 * @param {Object} article - Article object with title, category, summary, content, author, createdAt
 * @param {string} variant - 'grid' for grid layout (compact) or 'list' for list layout (detailed)
 */
export default function ArticleCard({ article, variant = 'grid' }) {
  const isListVariant = variant === 'list';
  const defaultBannerImageUrl = '/images/branding/news default.png';
  const bannerImageUrl = article.bannerImageUrl || defaultBannerImageUrl;
  const createdAt = new Date(article.createdAt);
  const formattedDate = createdAt.toLocaleDateString();
  const formattedTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const handleBannerError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = defaultBannerImageUrl;
  };

  return (
    <article className="card overflow-hidden">
      {isListVariant ? (
        <div className="flex">
          <Link href={`/articles/${article.id}`} className="flex-shrink-0">
            <img
              src={bannerImageUrl}
              alt={`${article.title} banner`}
              className="w-32 h-24 object-cover"
              onError={handleBannerError}
            />
          </Link>
          <div className="p-6 flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-grow">
                <div className="flex flex-wrap gap-2 mb-2">
                  {article.type && (
                    <span className={`inline-block text-xs px-2 py-1 rounded ${getArticleTypeClasses(article.type)}`}>
                      {getArticleTypeLabel(article.type)}
                    </span>
                  )}
                  {article.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {article.category}
                    </span>
                  )}
                  {Array.isArray(article.tags) && article.tags.length > 0 && (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {article.tags.join(', ')}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  <Link href={`/articles/${article.id}`} className="hover:text-blue-600">
                    {article.title}
                  </Link>
                </h2>
                <p className="body-copy mb-4">
                  {article.summary || (article.content ? `${article.content.substring(0, 200)}...` : '')}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>By {article.author?.username || 'Unknown'}</span>
                  <span>•</span>
                  <span>
                    {formattedDate} {formattedTime}
                  </span>
                  {article.status !== 'published' && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600 font-medium">{article.status}</span>
                    </>
                  )}
                </div>
              </div>
              <Link href={`/articles/${article.id}`} className="inline-block mt-4 md:mt-0 md:ml-4">
                <Button variant="primary" size="md" className="whitespace-nowrap">
                  Read More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Link href={`/articles/${article.id}`}>
            <img
              src={bannerImageUrl}
              alt={`${article.title} banner`}
              className="w-full h-32 object-cover"
              onError={handleBannerError}
            />
          </Link>
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {article.type && (
                <span className={`inline-block text-xs px-2 py-1 rounded ${getArticleTypeClasses(article.type)}`}>
                  {getArticleTypeLabel(article.type)}
                </span>
              )}
              {article.category && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {article.category}
                </span>
              )}
              {Array.isArray(article.tags) && article.tags.length > 0 && (
                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                  {article.tags.join(', ')}
                </span>
              )}
            </div>
            <h3 className="headline">
              <Link href={`/articles/${article.id}`} className="hover:text-blue-600">
                {article.title}
              </Link>
            </h3>
            <p className="body-copy mb-4 line-clamp-3">
              {article.summary || (article.content ? `${article.content.substring(0, 150)}...` : '')}
            </p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>By {article.author?.username || 'Unknown'}</span>
              <span>
                {formattedDate} {formattedTime}
              </span>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
