'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { ImageTopCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { TruncatedTextTooltip } from '@/components/ui/Tooltip';
import { ChartBarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import { idSlug } from '@/lib/utils/slugify';
import { pollAPI } from '@/lib/api';

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
  const creatorLabel = poll.hideCreator ? 'Ανώνυμος' : (poll.creator?.username || 'Άγνωστος');
  
  const isPollActive = poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date());
  const totalVotes = poll.totalVotes || 0;

  // ── Inline voting state ───────────────────────────────────────────────────
  const initialVotedId = poll.userVote?.optionId ?? null;
  const [inlineVotedId, setInlineVotedId]       = useState(initialVotedId);
  const [inlineVoteCounts, setInlineVoteCounts] = useState(null); // populated after first inline vote
  const [isInlineSubmitting, setIsInlineSubmitting] = useState(false);

  // Which poll types can be voted on inline (binary OR simple with ≤3 options)
  const options = poll.options || [];
  const isInlineVotable =
    isPollActive &&
    (user || poll.allowUnauthenticatedVotes) &&
    (poll.type === 'binary' ||
      (poll.type === 'simple' && options.length >= 2 && options.length <= 3));

  const handleInlineVote = async (e, optionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInlineSubmitting) return;

    const prevVotedId = inlineVotedId;
    setIsInlineSubmitting(true);
    // Optimistic: mark the selection immediately
    setInlineVotedId(optionId);
    try {
      const res = await pollAPI.vote(poll.id, optionId);
      if (res.success && res.data?.voteCounts) {
        setInlineVoteCounts(res.data.voteCounts);
      }
    } catch {
      // Rollback to the previous vote on error
      setInlineVotedId(prevVotedId);
    } finally {
      setIsInlineSubmitting(false);
    }
  };
  
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

  // Default colors for binary polls (green for Yes / red for No)
  const BINARY_DEFAULTS = ['#16a34a', '#dc2626'];
  
  // Type badge variant mapping
  const getTypeBadge = (type) => {
    switch (type) {
      case 'simple':
        return <Badge variant="primary">Απλή</Badge>;
      case 'complex':
        return <Badge variant="purple">Σύνθετη</Badge>;
      case 'binary':
        return <Badge variant="success">Δυαδική</Badge>;
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
        <div className="h-32 bg-gradient-to-br from-gray-50 to-white px-4 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="relative">
              <svg width="128" height="128" viewBox="0 0 100 100" className="block">
                <circle cx="50" cy="50" r="40" fill="#e5e7eb" />
                <circle cx="50" cy="50" r="25" fill="white" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-center text-xs">
                <div className="text-gray-400 font-semibold leading-tight px-1">Χωρίς ψήφους</div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0" />
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

      currentAngle = endAngle;

      // Skip tiny segments that would be nearly invisible as SVG arcs
      if (angle < 0.5) {
        return null;
      }

      const color = (poll.useCustomColors && option.color)
        ? option.color
        : (poll.type === 'binary' && index < BINARY_DEFAULTS.length)
          ? BINARY_DEFAULTS[index]
          : chartColors[index % chartColors.length];

      // Treat near-360° arcs as full circles to avoid SVG degenerate-arc rendering issues
      if (angle >= 359.99) {
        return {
          isFullCircle: true,
          color,
          percentage: (percentage * 100).toFixed(0),
          label: option.text,
          votes: option.voteCount || 0,
        };
      }
      
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
      
      return {
        isFullCircle: false,
        path,
        color,
        percentage: (percentage * 100).toFixed(0),
        label: option.text,
        votes: option.voteCount || 0,
      };
    }).filter(Boolean);

    const topOptions = [...segments]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 4);

    return (
      <div className="h-32 bg-gradient-to-br from-gray-50 to-white px-4 flex items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="relative">
            <svg width="128" height="128" viewBox="0 0 100 100" className="block">
              {segments.map((segment, index) =>
                segment.isFullCircle ? (
                  <g key={index}>
                    <circle cx={cx} cy={cy} r={radius} fill={segment.color} stroke="white" strokeWidth="1" />
                    <circle cx={cx} cy={cy} r={innerRadius} fill="white" />
                  </g>
                ) : (
                  <path
                    key={index}
                    d={segment.path}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="1"
                  />
                )
              )}
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

  const pollHref = `/polls/${idSlug(poll.id, poll.title)}`;
  
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
      {Array.isArray(poll.tags) && poll.tags.length > 0 && (
        <Badge variant="purple">{poll.tags.join(', ')}</Badge>
      )}
      {poll.visibility === 'locals_only' && (
        <Badge variant="orange">Τοπική</Badge>
      )}
    </div>
  );

  // Inline voting section for binary / simple polls with ≤3 options.
  // Only used when results are NOT already shown (avoids nested <Link> issues).
  const renderInlineVoting = () => {
    if (!isInlineVotable || showResults) return null;

    // After voting — show compact progress bars
    if (inlineVotedId !== null) {
      const counts = inlineVoteCounts
        ? options.map((o) => ({ ...o, voteCount: inlineVoteCounts[String(o.id)] ?? o.voteCount ?? 0 }))
        : options;
      const total = counts.reduce((s, o) => s + (o.voteCount || 0), 0);
      return (
        <div className="mt-3 space-y-1.5">
          {counts.map((option, idx) => {
            const pct = total > 0 ? Math.round(((option.voteCount || 0) / total) * 100) : 0;
            const isVoted = option.id === inlineVotedId;
            const customColor = (poll.useCustomColors && option.color) ? option.color : null;
            const isBinaryDefault = !customColor && poll.type === 'binary' && idx < BINARY_DEFAULTS.length;
            const barColor = customColor || (isBinaryDefault ? BINARY_DEFAULTS[idx] : null);
            const labelClass = `font-medium truncate max-w-[70%] ${isVoted && !barColor ? 'text-blue-700' : 'text-gray-700'}`;
            const pctClass = `font-semibold ${isVoted && !barColor ? 'text-blue-700' : 'text-gray-500'}`;
            const barClass = `h-full rounded-full transition-all duration-500 ${barColor ? '' : isVoted ? 'bg-blue-500' : 'bg-gray-300'}`;
            return (
              <div key={option.id} className="relative">
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span
                    className={labelClass}
                    style={barColor && isVoted ? { color: barColor } : undefined}
                  >
                    {isVoted && (
                      <CheckCircleIcon
                        className={`h-3.5 w-3.5 inline mr-1${!barColor ? ' text-blue-600' : ''}`}
                        style={barColor ? { color: barColor } : undefined}
                      />
                    )}
                    {option.text}
                  </span>
                  <span
                    className={pctClass}
                    style={barColor && isVoted ? { color: barColor } : undefined}
                  >{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={barClass}
                    style={{ width: `${pct}%`, ...(barColor ? { backgroundColor: barColor } : {}) }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-gray-400 mt-1">
            {total} {total === 1 ? 'ψήφος' : 'ψήφοι'}
          </p>
        </div>
      );
    }

    // Before voting — show option buttons
    const isBinary = poll.type === 'binary';
    return (
      <div className={`mt-3 ${isBinary ? 'flex gap-2' : 'space-y-1.5'}`}>
        {options.map((option, idx) => {
          const customColor = (poll.useCustomColors && option.color) ? option.color : null;
          const colorClass = customColor
            ? ''
            : isBinary
              ? idx === 0
                ? 'border-green-400 text-green-700 hover:bg-green-50 focus:ring-green-300'
                : 'border-red-400 text-red-600 hover:bg-red-50 focus:ring-red-300'
              : 'border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-300';
          return (
            <button
              key={option.id}
              type="button"
              disabled={isInlineSubmitting}
              onClick={(e) => handleInlineVote(e, option.id)}
              className={`${isBinary ? 'flex-1' : 'w-full text-left'} px-3 py-1.5 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
              style={customColor ? { borderColor: customColor, color: customColor } : undefined}
            >
              {isInlineSubmitting ? '…' : option.text}
            </button>
          );
        })}
      </div>
    );
  };

  // Render poll info
  const pollInfoContent = (
    <>
      <h3 className="headline hover:text-blue-600 mb-2">
        <TruncatedTextTooltip maxLines={2}>
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
        <span>{creatorLabel}</span>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        {formattedDate} {formattedTime}
      </div>
      
      {isInlineVotable && !showResults ? (
        renderInlineVoting()
      ) : (
        <div className="mt-4">
          {isPollActive ? (
            <Link
              href={pollHref}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
            >
              Ψηφοφορία Τώρα
            </Link>
          ) : (
            <Link
              href={pollHref}
              className="inline-block bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition text-sm font-medium"
            >
              Προβολή Αποτελεσμάτων
            </Link>
          )}
        </div>
      )}
    </>
  );
  
  // Render with results bars instead of image
  if (showResults) {
    return (
      <Link href={pollHref} className="block">
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
  
  // For inline-votable polls (not showing full results): render as a plain card
  // (not wrapped in a link) so the vote buttons work without triggering navigation.
  if (isInlineVotable && !showResults) {
    return (
      <Card hoverable className="overflow-hidden h-full">
        <Link href={pollHref} className="block">
          <img
            src={pollImageUrl}
            alt={`${poll.title} banner`}
            className="w-full h-32 object-cover"
            onError={(e) => { e.currentTarget.src = defaultPollImage; }}
          />
        </Link>
        <div className="p-6">
          <Link href={pollHref} className="block">
            {badgesContent}
          </Link>
          {pollInfoContent}
        </div>
      </Card>
    );
  }

  // Render with image (non-inline-votable)
  return (
    <ImageTopCard
      image={pollImageUrl}
      imageAlt={`${poll.title} banner`}
      imageFallback={defaultPollImage}
      imageClassName="h-32"
      href={pollHref}
      hoverable
      className="overflow-hidden"
    >
      {badgesContent}
      {pollInfoContent}
    </ImageTopCard>
  );
}
