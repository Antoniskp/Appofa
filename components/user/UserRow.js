'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/Badge';

const DEFAULT_AVATAR_COLOR = '#64748b';

/**
 * Renders a single user row with avatar, username, display name, and role badge.
 * Used in followers/following list pages.
 */
export default function UserRow({ user }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || '';

  return (
    <Link href={`/users/${user.id}`} className="block hover:bg-gray-50 transition-colors rounded-lg">
      <div className="flex items-center gap-4 px-4 py-3">
        <div
          className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{user.username}</span>
            {user.role && (
              <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">
                {user.role}
              </Badge>
            )}
          </div>
          {displayName && (
            <p className="text-xs text-gray-500 truncate">{displayName}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
