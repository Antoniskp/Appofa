'use client';

import { useState, useEffect } from 'react';
import VerifiedBadge from '@/components/VerifiedBadge';

const DEFAULT_AVATAR_COLOR = '#64748b';

const BADGE_TIER_EMOJI = { bronze: '🥉', silver: '🥈', gold: '🥇', verified: '✅' };

/**
 * Small overlay image for a selected display badge.
 * Falls back to emoji if the SVG is missing.
 */
function DisplayBadgeOverlay({ slug, tier }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src={`/images/badges/${slug}-${tier}.svg`}
        alt={`${slug} ${tier}`}
        className="absolute bottom-0 right-0 h-4 w-4 object-contain"
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: for the verified badge show the green checkmark; others show emoji
  if (slug === 'verified') {
    return <VerifiedBadge overlay className="absolute bottom-0 right-0 h-4 w-4" />;
  }

  return (
    <span className="absolute bottom-0 right-0 text-xs leading-none">
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
        <DisplayBadgeOverlay slug={user.displayBadgeSlug} tier={user.displayBadgeTier} />
      ) : user.isVerified ? (
        <VerifiedBadge
          overlay
          className="absolute bottom-0 right-0 h-4 w-4"
        />
      ) : null}
    </div>
  );
}
