'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_AVATAR_COLOR } from '@/lib/constants/profile';

/**
 * Displays the user's avatar, username, display name, and header actions.
 *
 * @param {Object} props
 * @param {string} props.username
 * @param {string} [props.firstNameNative]
 * @param {string} [props.lastNameNative]
 * @param {string} [props.firstNameEn]
 * @param {string} [props.lastNameEn]
 * @param {string} [props.nickname]
 * @param {string} [props.email]
 * @param {string} [props.avatar]
 * @param {string} [props.avatarColor]
 * @param {number} [props.followersCount]
 * @param {number} [props.followingCount]
 */
export default function ProfileHeader({ username, firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, email, avatar, avatarColor, followersCount, followingCount }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [avatar]);

  const nativeName = `${firstNameNative || ''} ${lastNameNative || ''}`.trim();
  const enName = `${firstNameEn || ''} ${lastNameEn || ''}`.trim();
  const displayName = nativeName || enName || nickname || '';

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
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 truncate">
          {username || email || 'My Profile'}
        </h1>
        {displayName && (
          <p className="text-sm text-gray-600 truncate">{displayName}</p>
        )}
        {email && (
          <p className="text-xs text-gray-500 mt-1 truncate">{email}</p>
        )}
        {username && (
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <Link
              href={`/users/${username}/followers`}
              className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
            >
              {followersCount !== undefined ? `${followersCount} Followers` : 'Followers'}
            </Link>
            <Link
              href={`/users/${username}/following`}
              className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
            >
              {followingCount !== undefined ? `${followingCount} Following` : 'Following'}
            </Link>
            <Link
              href={`/users/${username}`}
              className="text-sm text-blue-600 hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              View public profile →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
