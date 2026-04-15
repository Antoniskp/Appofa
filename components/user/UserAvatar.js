'use client';

import { useState, useEffect } from 'react';
import VerifiedBadge from '@/components/VerifiedBadge';
import PartyBadge from '@/components/PartyBadge';

const DEFAULT_AVATAR_COLOR = '#64748b';

const BADGE_TIER_EMOJI = { bronze: '🥉', silver: '🥈', gold: '🥇', verified: '✅' };

/**
 * Derives a proportional badge overlay size class from the avatar size prop.
 * h-6 or smaller → h-3 w-3 · h-8/h-10 → h-4 w-4 · h-12 or larger → h-5 w-5
 */
function deriveBadgeSize(avatarSize = '') {
  const match = avatarSize.match(/h-(\d+)/);
  const h = match ? parseInt(match[1], 10) : 10;
  if (h <= 6) return 'h-3 w-3';
  if (h <= 10) return 'h-4 w-4';
  return 'h-5 w-5';
}

/**
 * Small overlay image for a selected display badge.
 * Falls back to emoji if the SVG is missing.
 */
function DisplayBadgeOverlay({ slug, tier, size }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src={`/images/badges/${slug}-${tier}.svg`}
        alt={`${slug} ${tier}`}
        className={`absolute bottom-0 right-0 ${size} object-contain`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: for the verified badge show the green checkmark; others show emoji
  if (slug === 'verified') {
    return <VerifiedBadge overlay className={`absolute bottom-0 right-0 ${size}`} />;
  }

  return (
    <span className="absolute bottom-0 right-0 text-base leading-none">
      {BADGE_TIER_EMOJI[tier] || '🏅'}
    </span>
  );
}

/**
 * Renders a user avatar with an optional overlay at bottom-right.
 * If the user has a displayBadgeSlug/displayBadgeTier set, that badge is shown.
 * Otherwise falls back to the green verified checkmark when isVerified is true.
 *
 * Props:
 *   user        - user object with avatar, avatarColor, username, isVerified,
 *                 displayBadgeSlug, displayBadgeTier
 *   size        - tailwind size class for width/height (default: 'h-10 w-10')
 *   textSize    - tailwind text size for initials (default: 'text-sm')
 */
export default function UserAvatar({ user, size = 'h-10 w-10', textSize = 'text-sm' }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatar]);

  const hasDisplayBadge = user?.displayBadgeSlug && user?.displayBadgeTier;
  const badgeSize = deriveBadgeSize(size);

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className={`${size} rounded-full border border-gray-200 flex items-center justify-center text-white ${textSize} font-semibold`}
        style={{ backgroundColor: user.avatarColor || DEFAULT_AVATAR_COLOR }}
      >
        {user.avatar && !avatarLoadError ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="h-full w-full rounded-full object-cover"
            onError={() => setAvatarLoadError(true)}
          />
        ) : (
          <span>{(user.username || 'U').charAt(0).toUpperCase()}</span>
        )}
      </div>
      {hasDisplayBadge ? (
        <DisplayBadgeOverlay slug={user.displayBadgeSlug} tier={user.displayBadgeTier} size={badgeSize} />
      ) : user.isVerified ? (
        <VerifiedBadge
          overlay
          className={`absolute bottom-0 right-0 ${badgeSize}`}
        />
      ) : null}
      {user.partyId && (
        <PartyBadge partyId={user.partyId} className="absolute -top-1 -right-1 h-5 w-5" />
      )}
    </div>
  );
}
