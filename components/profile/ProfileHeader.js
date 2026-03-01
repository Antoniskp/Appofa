'use client';

import { useState } from 'react';

const DEFAULT_AVATAR_COLOR = '#64748b';

/**
 * Displays the user's avatar, username, and display name.
 *
 * @param {Object} props
 * @param {string} props.username
 * @param {string} [props.firstName]
 * @param {string} [props.lastName]
 * @param {string} [props.email]
 * @param {string} [props.avatar]
 * @param {string} [props.avatarColor]
 */
export default function ProfileHeader({ username, firstName, lastName, email, avatar, avatarColor }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || lastName || '';

  const initials = (username || email || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div
        className="h-20 w-20 rounded-full border border-gray-200 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0"
        style={{ backgroundColor: avatarColor || DEFAULT_AVATAR_COLOR }}
      >
        {avatar && !avatarLoadError ? (
          <img
            src={avatar}
            alt={username || 'User'}
            className="h-full w-full rounded-full object-cover"
            onError={() => setAvatarLoadError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 truncate">
          {username || email || 'My Profile'}
        </h1>
        {displayName && (
          <p className="text-sm text-gray-600 truncate">{displayName}</p>
        )}
        {email && (
          <p className="text-xs text-gray-500 mt-1 truncate">{email}</p>
        )}
      </div>
    </div>
  );
}
