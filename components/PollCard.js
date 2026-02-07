import { ImageCard, ImageTopCard } from '@/components/Card';
import Badge from '@/components/Badge';
import { TruncatedTextTooltip } from '@/components/Tooltip';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable poll card component
 * @param {Object} poll - Poll object with title, description, creator, voteCount, status
 * @param {string} variant - 'grid' for grid layout (compact) or 'list' for list layout (detailed)
 */
export default function PollCard({ poll, variant = 'grid' }) {
  const defaultBannerImageUrl = '/images/branding/news default.png';
  const createdAt = new Date(poll.createdAt);
  const formattedDate = createdAt.toLocaleDateString();
  const formattedTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Determine if poll is open
  const isOpen = poll.status === 'open' || poll.status === 'active';
  
  // Get status badge variant
  const getStatusVariant = (status) => {
    if (status === 'open' || status === 'active') return 'success';
    if (status === 'closed') return 'danger';
    return 'secondary';
  };
  
  // List variant (image on left)
  if (variant === 'list') {
    return (
      <ImageCard
        image={defaultBannerImageUrl}
        imageAlt={`${poll.title} banner`}
        imageFallback={defaultBannerImageUrl}
        href={`/polls/${poll.id}`}
        hoverable
        className="overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex-grow">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant={getStatusVariant(poll.status)}>
                {isOpen ? (
                  <span className="flex items-center gap-1">
                    <CheckCircleIcon className="h-4 w-4" />
                    Ανοιχτή
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircleIcon className="h-4 w-4" />
                    Κλειστή
                  </span>
                )}
              </Badge>
              {poll.questionType && (
                <Badge variant="primary">
                  {poll.questionType === 'single-choice' && 'Μονή Επιλογή'}
                  {poll.questionType === 'ranked-choice' && 'Κατάταξη'}
                  {poll.questionType === 'free-text' && 'Ελεύθερο Κείμενο'}
                </Badge>
              )}
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600">
              <TruncatedTextTooltip maxLength={80} className="text-2xl font-semibold">
                {poll.title}
              </TruncatedTextTooltip>
            </h2>
            
            {/* Description */}
            {poll.description && (
              <p className="body-copy mb-4 text-gray-600">
                {poll.description.length > 200 
                  ? `${poll.description.substring(0, 200)}...` 
                  : poll.description}
              </p>
            )}
            
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>Από {poll.creator?.username || 'Άγνωστος'}</span>
              <span>•</span>
              <span>{formattedDate} {formattedTime}</span>
              <span>•</span>
              <span className="font-medium text-blue-600">
                {poll.voteCount || 0} {poll.voteCount === 1 ? 'ψήφος' : 'ψήφοι'}
              </span>
            </div>
          </div>
        </div>
      </ImageCard>
    );
  }
  
  // Grid variant (image on top)
  return (
    <ImageTopCard
      image={defaultBannerImageUrl}
      imageAlt={`${poll.title} banner`}
      imageFallback={defaultBannerImageUrl}
      imageClassName="h-32"
      href={`/polls/${poll.id}`}
      hoverable
      className="overflow-hidden"
    >
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant={getStatusVariant(poll.status)}>
          {isOpen ? (
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4" />
              Ανοιχτή
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircleIcon className="h-4 w-4" />
              Κλειστή
            </span>
          )}
        </Badge>
        {poll.questionType && (
          <Badge variant="primary">
            {poll.questionType === 'single-choice' && 'Μονή'}
            {poll.questionType === 'ranked-choice' && 'Κατάταξη'}
            {poll.questionType === 'free-text' && 'Κείμενο'}
          </Badge>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 hover:text-blue-600">
        <TruncatedTextTooltip maxLength={60} className="text-lg font-semibold">
          {poll.title}
        </TruncatedTextTooltip>
      </h3>
      
      {/* Description */}
      {poll.description && (
        <p className="body-copy mb-3 text-gray-600 text-sm">
          {poll.description.length > 100 
            ? `${poll.description.substring(0, 100)}...` 
            : poll.description}
        </p>
      )}
      
      {/* Meta */}
      <div className="flex flex-col gap-2 text-sm text-gray-500">
        <span className="truncate">Από {poll.creator?.username || 'Άγνωστος'}</span>
        <span className="font-medium text-blue-600">
          {poll.voteCount || 0} {poll.voteCount === 1 ? 'ψήφος' : 'ψήφοι'}
        </span>
      </div>
    </ImageTopCard>
  );
}
