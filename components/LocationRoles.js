'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { locationRoleAPI } from '@/lib/api';
import { UserCircleIcon } from '@heroicons/react/24/outline';

/**
 * LocationRoles — public display of assigned role holders for a location.
 *
 * Only shows roles that have an assignee (person or user).
 * Unassigned slots are not rendered on the public page.
 */
export default function LocationRoles({ locationId, compact = false }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationId) return;
    locationRoleAPI.getRoles(locationId)
      .then((res) => {
        if (res?.success) {
          // Only keep roles that have an assignment with a person or user
          const assigned = (res.roles || []).filter(
            (r) => r.assignment && (r.assignment.personId || r.assignment.userId)
          );
          setRoles(assigned);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locationId]);

  if (loading || roles.length === 0) return null;

  if (compact) {
    return (
      <div className="text-sm text-gray-700">
        <p className="font-semibold text-gray-800 mb-1">Αξιωματούχοι</p>
        <ul className="space-y-0.5">
          {roles.map((role) => {
            const { assignment } = role;
            const user = assignment?.user;
            const name = user?.firstNameNative
              ? `${user.firstNameNative} ${user.lastNameNative || ''}`.trim()
              : user?.username;
            const profileSlug = user?.slug;
            return (
              <li key={role.key} className="flex items-center gap-1">
                <span className="text-gray-500">{role.title}:</span>
                {profileSlug ? (
                  <Link href={`/persons/${profileSlug}`} className="text-blue-600 hover:underline truncate">
                    {name}
                  </Link>
                ) : (
                  <span className="truncate">{name}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Αξιωματούχοι Τοποθεσίας</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {roles.map((role) => {
          const { assignment } = role;
          const user = assignment?.user;
          const photo = user?.photo || user?.avatar;
          const name = user?.firstNameNative
            ? `${user.firstNameNative} ${user.lastNameNative || ''}`.trim()
            : user?.username;
          const profileSlug = user?.slug;
          const profileHref = profileSlug ? `/persons/${profileSlug}` : null;

          return (
            <div key={role.key} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <UserCircleIcon className="w-10 h-10 text-gray-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                {profileHref ? (
                  <Link href={profileHref} className="text-sm font-medium text-blue-600 hover:underline truncate block">
                    {name}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                )}
                <p className="text-xs text-gray-500 truncate">{role.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
