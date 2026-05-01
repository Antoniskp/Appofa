'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import UserAvatar from '@/components/user/UserAvatar';
import { resolveProfessionLabel, getExpertiseTagLabel } from '@/lib/utils/professionTaxonomy';

export default function UserCard({ user }) {
  const displayName = user.firstNameNative && user.lastNameNative
    ? `${user.firstNameNative} ${user.lastNameNative}`
    : user.firstNameNative || user.lastNameNative || '';

  // Resolve primary profession label from the first profession entry
  const primaryProfession = Array.isArray(user.professions) && user.professions.length > 0
    ? resolveProfessionLabel(user.professions[0])
    : null;

  // Show up to 2 expertise tags
  const expertiseTags = Array.isArray(user.expertiseArea) ? user.expertiseArea.slice(0, 2) : [];

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

          {primaryProfession && (
            <p className="text-xs text-blue-700 font-medium mt-0.5 truncate">{primaryProfession}</p>
          )}

          {expertiseTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {expertiseTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
                >
                  {getExpertiseTagLabel(tag)}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString('el-GR')}
          </p>
        </div>
      </div>
    </Card>
  );
}
