import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { SafeHtml, truncateHtml } from '@/lib/html-sanitizer';

/**
 * Reusable article card component
 * @param {Object} article - Article object with title, category, summary, content, author, createdAt
 * @param {string} variant - 'grid' for grid layout (compact) or 'list' for list layout (detailed)
 */
export default function ArticleCard({ article, variant = 'grid' }) {
  const isListVariant = variant === 'list';
  const tags = Array.isArray(article.tags) ? article.tags : [];
  const statusLabels = {
    draft: 'Πρόχειρο',
    published: 'Δημοσιευμένο',
    archived: 'Αρχειοθετημένο'
  };
  const statusLabel = statusLabels[article.status] || article.status;

  return (
    <article className={isListVariant ? 'card p-6' : 'card'}>
      {isListVariant ? (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex-grow">
            <div className="flex flex-wrap gap-2 mb-2">
              {article.category && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {article.category}
                </span>
              )}
              {article.isFeatured && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  Προτεινόμενο
                </span>
              )}
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              <Link href={`/articles/${article.id}`} className="hover:text-blue-600">
                {article.title}
              </Link>
            </h2>
            {article.subtitle && (
              <p className="text-gray-600 mb-2">{article.subtitle}</p>
            )}
            {article.summary ? (
              <p className="body-copy mb-4">{article.summary}</p>
            ) : (
              <div className="prose max-w-none mb-4 line-clamp-3">
                <SafeHtml
                  html={truncateHtml(article.content, 240)}
                  className="text-gray-800 leading-relaxed"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>Από {article.author?.username || article.User?.username || 'Άγνωστος'}</span>
              <span>•</span>
              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
              {article.status !== 'published' && (
                <>
                  <span>•</span>
                  <span className="text-orange-600 font-medium">{statusLabel}</span>
                </>
              )}
            </div>
          </div>
          <Link
            href={`/articles/${article.id}`}
            className="inline-block mt-4 md:mt-0 md:ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition whitespace-nowrap"
          >
            Περισσότερα
          </Link>
        </div>
      ) : (
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-2">
            {article.category && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {article.category}
              </span>
            )}
            {article.isFeatured && (
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                Προτεινόμενο
              </span>
            )}
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="headline">
            <Link href={`/articles/${article.id}`} className="hover:text-blue-600">
              {article.title}
            </Link>
          </h3>
          {article.subtitle && (
            <p className="text-gray-600 mb-2">{article.subtitle}</p>
          )}
          {article.summary ? (
            <p className="body-copy mb-4 line-clamp-3">{article.summary}</p>
          ) : (
            <div className="prose max-w-none mb-4 line-clamp-3">
              <SafeHtml
                html={truncateHtml(article.content, 180)}
                className="text-gray-800 leading-relaxed"
              />
            </div>
          )}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex flex-wrap gap-2">
              <span>Από {article.author?.username || article.User?.username || 'Άγνωστος'}</span>
              <span>•</span>
              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <Link
            href={`/articles/${article.id}`}
            className="inline-flex items-center gap-1 mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Περισσότερα
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </article>
  );
}
