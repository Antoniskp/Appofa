import Link from 'next/link';
import { ImageTopCard } from '@/components/Card';
import Badge from '@/components/Badge';
import { TruncatedTextTooltip } from '@/components/Tooltip';
import { ChartBarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable poll card component
 * @param {Object} poll - Poll object with title, description, type, status, etc.
 * @param {string} variant - 'grid' for grid layout (compact) or 'list' for list layout (detailed)
 */
export default function PollCard({ poll, variant = 'grid' }) {
  const defaultPollImage = '/images/branding/news default.png';
  const pollImageUrl = poll.bannerImageUrl || defaultPollImage;
  const createdAt = new Date(poll.createdAt);
  const formattedDate = createdAt.toLocaleDateString('el-GR');
  const formattedTime = createdAt.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  
  const isPollActive = poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date());
  const totalVotes = poll.totalVotes || 0;
  
  // Type badge variant mapping
  const getTypeBadge = (type) => {
    switch (type) {
      case 'simple':
        return <Badge variant="primary">Απλή</Badge>;
      case 'complex':
        return <Badge variant="purple">Σύνθετη</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };
  
  // Status badge
  const getStatusBadge = (status, isActive) => {
    if (status === 'closed' || !isActive) {
      return <Badge variant="gray"><XCircleIcon className="h-3 w-3 inline mr-1" />Κλειστή</Badge>;
    }
    return <Badge variant="success"><CheckCircleIcon className="h-3 w-3 inline mr-1" />Ενεργή</Badge>;
  };
  
  return (
    <ImageTopCard
      image={pollImageUrl}
      imageAlt={`${poll.title} banner`}
      imageFallback={defaultPollImage}
      imageClassName="h-32"
      href={`/polls/${poll.id}`}
      hoverable
      className="overflow-hidden"
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {getTypeBadge(poll.type)}
        {getStatusBadge(poll.status, isPollActive)}
        {poll.visibility === 'locals_only' && (
          <Badge variant="orange">Τοπική</Badge>
        )}
      </div>
      
      <h3 className="headline hover:text-blue-600 mb-2">
        <TruncatedTextTooltip maxLength={60} className="headline">
          {poll.title}
        </TruncatedTextTooltip>
      </h3>
      
      <p className="body-copy mb-4 line-clamp-2 text-gray-600">
        {poll.description || 'Χωρίς περιγραφή'}
      </p>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          <ChartBarIcon className="h-4 w-4 inline mr-1" />
          {totalVotes} {totalVotes === 1 ? 'ψήφος' : 'ψήφοι'}
        </span>
        <span>
          {poll.creator?.username || 'Άγνωστος'}
        </span>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        {formattedDate} {formattedTime}
      </div>
      
      <div className="mt-4">
        {isPollActive ? (
          <Link
            href={`/polls/${poll.id}`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
          >
            Ψηφοφορία Τώρα
          </Link>
        ) : (
          <Link
            href={`/polls/${poll.id}`}
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition text-sm font-medium"
          >
            Προβολή Αποτελεσμάτων
          </Link>
        )}
      </div>
    </ImageTopCard>
  );
}
