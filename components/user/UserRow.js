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
    <div className="relative flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50">
      <div className={user.avatar ? 'relative z-10 shrink-0' : 'shrink-0'}>
        <UserAvatar user={user} size="h-10 w-10" textSize="text-sm" expandable />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/users/${user.username}`} className="truncate font-medium text-gray-900 after:absolute after:inset-0 focus-visible:underline">{user.username}</Link>
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
  );
}
