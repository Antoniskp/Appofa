'use client';

import Link from 'next/link';
import Card from '@/components/Card';
import { ImageTopCard } from '@/components/Card';
import Badge from '@/components/Badge';
import { TruncatedTextTooltip } from '@/components/Tooltip';
import { ChartBarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Reusable poll card component
 * @param {Object} poll - Poll object with title, description, type, status, etc.
 * @param {string} variant - 'grid' for grid layout (compact) or 'list' for list layout (detailed)
 */
export default function PollCard({ poll, variant = 'grid' }) {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  
  const defaultPollImage = '/images/branding/news default.png';
  const pollImageUrl = poll.bannerImageUrl || defaultPollImage;
  const createdAt = new Date(poll.createdAt);
  const formattedDate = createdAt.toLocaleDateString('el-GR');
  const formattedTime = createdAt.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  
  const isPollActive = poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date());
  const totalVotes = poll.totalVotes || 0;
  
  // Check if user can view results
  const canViewResults = () => {
    if (!poll) return false;
    
    // Creator and admin can always view
    if (user && (poll.creatorId === user.id || isAdmin)) return true;
    
    // Check visibility settings
    if (poll.resultsVisibility === 'always') return true;
    if (poll.resultsVisibility === 'after_deadline' && (poll.status === 'closed' || (poll.deadline && new Date() >= new Date(poll.deadline)))) return true;
    if (poll.resultsVisibility === 'after_vote' && poll.userVote) return true;
    
    return false;
  };
  
  // Color palette for donut chart
  const chartColors = [
    '#3B82F6', // blue-600
    '#10B981', // green-600
    '#F97316', // orange-600
    '#8B5CF6', // purple-600
    '#EC4899', // pink-600
    '#F59E0B', // amber-600
    '#14B8A6', // teal-600
    '#EF4444', // red-600
  ];
  
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

  // Render result bars component
  // Render donut chart using SVG
  const renderDonutChart = () => {
    const options = poll.options || [];
    if (options.length === 0) return null;

    const totalVotesForResults = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
    
    if (totalVotesForResults === 0) {
      return (
        <div className="h-32 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center text-sm text-gray-500">
            <div className="text-xs font-semibold mb-1">Χωρίς ψήφους</div>
          </div>
        </div>
      );
    }

    // Calculate segments for donut chart
    const radius = 40;
    const innerRadius = 25;
    const cx = 50;
    const cy = 50;

    let currentAngle = -90; // Start from top
    const segments = options.map((option, index) => {
      const percentage = (option.voteCount || 0) / totalVotesForResults;
      const angle = percentage * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);
      
      const ix1 = cx + innerRadius * Math.cos(startRad);
      const iy1 = cy + innerRadius * Math.sin(startRad);
      const ix2 = cx + innerRadius * Math.cos(endRad);
      const iy2 = cy + innerRadius * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${ix2} ${iy2}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
        Z
      `;
      
      currentAngle = endAngle;
      
      return {
        path,
        color: chartColors[index % chartColors.length],
        percentage: (percentage * 100).toFixed(0),
        label: option.text,
        votes: option.voteCount || 0,
      };
    });

    const topOptions = [...segments]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 4);

    return (
      <div className="h-32 bg-gradient-to-br from-gray-50 to-white px-4 flex items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="relative">
            <svg width="128" height="128" viewBox="0 0 100 100" className="block">
              {segments.map((segment, index) => (
                <path
                  key={index}
                  d={segment.path}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-center text-xs">
              <div>
                <div className="font-semibold text-gray-700">{totalVotesForResults}</div>
                <div className="text-gray-500">
                  {totalVotesForResults === 1 ? 'ψήφος' : 'ψήφοι'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-gray-600 mb-2">Κορυφαίες Επιλογές</div>
          <div className="space-y-1.5">
            {topOptions.map((option) => (
              <div key={option.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                <span className="text-xs text-gray-700 truncate flex-1">{option.label}</span>
                <span className="text-xs font-semibold text-gray-800">{option.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Show results if user can view them
  const showResults = canViewResults();
  
  // Render badges
  const badgesContent = (
    <div className="flex flex-wrap gap-2 mb-2">
      {getTypeBadge(poll.type)}
      {getStatusBadge(poll.status, isPollActive)}
      {poll.category && (
        <Badge variant="primary">{poll.category}</Badge>
      )}
      {poll.visibility === 'locals_only' && (
        <Badge variant="orange">Τοπική</Badge>
      )}
    </div>
  );

  // Render poll info
  const pollInfoContent = (
    <>
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
    </>
  );
  
  // Render with results bars instead of image
  if (showResults) {
    return (
      <Link href={`/polls/${poll.id}`} className="block">
        <Card hoverable className="overflow-hidden h-full">
          {renderDonutChart()}
          <div className="p-6">
            {badgesContent}
            {pollInfoContent}
          </div>
        </Card>
      </Link>
    );
  }
  
  // Render with image
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
      {badgesContent}
      {pollInfoContent}
    </ImageTopCard>
  );
}
