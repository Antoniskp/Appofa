import { ImageCard, ImageTopCard } from '@/components/Card';
import Badge, { TypeBadge } from '@/components/Badge';
import { TruncatedTextTooltip } from '@/components/Tooltip';
import MarkdownRenderer from '@/components/MarkdownRenderer';

/**
 * Reusable article card component
 * @param {Object} article - Article object with title, category, summary, content, author, createdAt
 * @param {string} variant - 'grid' for grid layout (compact) or 'list' for list layout (detailed)
 */
export default function ArticleCard({ article, variant = 'grid' }) {
  const defaultBannerImageUrl = '/images/branding/news default.png';
  const bannerImageUrl = article.bannerImageUrl || defaultBannerImageUrl;
  const createdAt = new Date(article.createdAt);
  const formattedDate = createdAt.toLocaleDateString();
  const formattedTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // List variant (image on left)
  if (variant === 'list') {
    return (
      <ImageCard
        image={bannerImageUrl}
        imageAlt={`${article.title} banner`}
        imageFallback={defaultBannerImageUrl}
        href={`/articles/${article.id}`}
        hoverable
        className="overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex-grow">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {article.type && <TypeBadge type={article.type} />}
              {article.category && <Badge variant="primary">{article.category}</Badge>}
              {Array.isArray(article.tags) && article.tags.length > 0 && (
                <Badge variant="purple">{article.tags.join(', ')}</Badge>
              )}
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600">
              <TruncatedTextTooltip maxLength={80} className="text-2xl font-semibold">
                {article.title}
              </TruncatedTextTooltip>
            </h2>
            
            {/* Summary */}
            <div className="body-copy mb-4">
              <MarkdownRenderer 
                content={article.summary || (article.content ? article.content.substring(0, 200) + '...' : '')} 
                className="line-clamp-3"
              />
            </div>
            
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>By {article.author?.username || 'Unknown'}</span>
              <span>•</span>
              <span>{formattedDate} {formattedTime}</span>
              {article.status !== 'published' && (
                <>
                  <span>•</span>
                  <span className="text-orange-600 font-medium">{article.status}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </ImageCard>
    );
  }
  
  // Grid variant (image on top)
  return (
    <ImageTopCard
      image={bannerImageUrl}
      imageAlt={`${article.title} banner`}
      imageFallback={defaultBannerImageUrl}
      imageClassName="h-32"
      href={`/articles/${article.id}`}
      hoverable
      className="overflow-hidden"
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {article.type && <TypeBadge type={article.type} />}
        {article.category && <Badge variant="primary">{article.category}</Badge>}
        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <Badge variant="purple">{article.tags.join(', ')}</Badge>
        )}
      </div>
      <h3 className="headline hover:text-blue-600">
        <TruncatedTextTooltip maxLength={60} className="headline">
          {article.title}
        </TruncatedTextTooltip>
      </h3>
      <div className="body-copy line-clamp-3">
        <MarkdownRenderer 
          content={article.summary || (article.content ? article.content.substring(0, 150) + '...' : '')} 
        />
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>By {article.author?.username || 'Unknown'}</span>
        <span>{formattedDate} {formattedTime}</span>
      </div>
    </ImageTopCard>
  );
}
