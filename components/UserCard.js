'use client';

import { useState } from 'react';

const DEFAULT_AVATAR_COLOR = '#64748b';

export default function UserCard({ user }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || '';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className="h-16 w-16 rounded-full border border-gray-200 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
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
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {user.username}
          </h3>
          {displayName && (
            <p className="text-sm text-gray-600 truncate">{displayName}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
