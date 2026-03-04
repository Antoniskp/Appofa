'use client';

import { useState, useEffect } from 'react';
import VerifiedBadge from '@/components/VerifiedBadge';

const DEFAULT_AVATAR_COLOR = '#64748b';

/**
 * Renders a user avatar with an optional green verified badge overlay at bottom-right.
 * Props:
 *   user        - user object with avatar, avatarColor, username, isVerified
 *   size        - tailwind size class for width/height (default: 'h-10 w-10')
 *   textSize    - tailwind text size for initials (default: 'text-sm')
 */
export default function UserAvatar({ user, size = 'h-10 w-10', textSize = 'text-sm' }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatar]);

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
      {user.isVerified && (
        <VerifiedBadge
          overlay
          className="absolute bottom-0 right-0 h-4 w-4"
        />
      )}
    </div>
  );
}
