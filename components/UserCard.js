'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import UserAvatar from '@/components/user/UserAvatar';

export default function UserCard({ user }) {
  const displayName = user.firstNameNative && user.lastNameNative
    ? `${user.firstNameNative} ${user.lastNameNative}`
    : user.firstNameNative || user.lastNameNative || '';

  return (
    <Card hoverable href={`/users/${user.username}`}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <UserAvatar user={user} size="h-16 w-16" textSize="text-xl" />
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.username}
            </h3>
            {user.role && (
              <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">
                {user.role}
              </Badge>
            )}
          </div>
          
          {displayName && (
            <p className="text-sm text-gray-600 truncate">{displayName}</p>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString('el-GR')}
          </p>
        </div>
      </div>
    </Card>
  );
}
