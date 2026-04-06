'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import UserAvatar from '@/components/user/UserAvatar';

/**
 * Renders a single user row with avatar, username, display name, and role badge.
 * Used in followers/following list pages.
 */
export default function UserRow({ user }) {
  const displayName = user.firstNameNative && user.lastNameNative
    ? `${user.firstNameNative} ${user.lastNameNative}`
    : user.firstNameNative || user.lastNameNative || '';

  return (
    <Link href={`/users/${user.username}`} className="block hover:bg-gray-50 transition-colors rounded-lg">
      <div className="flex items-center gap-4 px-4 py-3">
        <UserAvatar user={user} size="h-10 w-10" textSize="text-sm" />
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
