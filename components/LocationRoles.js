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
          // Only keep roles that have at least one assignment
          const assigned = (res.roles || []).filter(
            (r) => {
              if (r.repeatable) return Array.isArray(r.assignments) && r.assignments.some((a) => a?.userId);
              return r.assignment && (r.assignment.personId || r.assignment.userId);
            }
          );
          setRoles(assigned);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locationId]);

  if (loading || roles.length === 0) return null;

  const flattenedRoles = roles.flatMap((role) => {
    if (role.repeatable) {
      return (role.assignments || [])
        .filter((assignment) => assignment?.userId)
        .map((assignment, idx) => ({
          key: `${role.key}-${assignment.id || assignment.userId}-${idx}`,
          title: role.title,
          assignment,
        }));
    }

    return [{
      key: role.key,
      title: role.title,
      assignment: role.assignment,
    }];
  });

  if (compact) {
    return (
      <div className="text-sm text-gray-700">
        <p className="font-semibold text-gray-800 mb-1">Αξιωματούχοι</p>
        <ul className="space-y-0.5">
          {flattenedRoles.map((role) => {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">Αξιωματούχοι Τοποθεσίας</h3>
        <span className="text-xs font-medium text-gray-500">{flattenedRoles.length} αναθέσεις</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {flattenedRoles.map((role) => {
          const { assignment } = role;
          const user = assignment?.user;
          const photo = user?.photo || user?.avatar;
          const name = user?.firstNameNative
            ? `${user.firstNameNative} ${user.lastNameNative || ''}`.trim()
            : user?.username;
          const profileSlug = user?.slug;
          const profileHref = profileSlug ? `/persons/${profileSlug}` : null;

          return (
            <div key={role.key} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <div className="mb-2">
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  {role.title}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {photo ? (
                  <img
                    src={photo}
                    alt={name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <UserCircleIcon className="w-11 h-11 text-gray-400 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {profileHref ? (
                    <Link href={profileHref} className="text-sm font-semibold text-blue-700 hover:underline truncate block">
                      {name}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                  )}
                  <p className="text-xs text-gray-500 truncate">@{user?.username || 'unknown'}</p>
                </div>
              </div>
              {profileHref && (
                <Link
                  href={profileHref}
                  className="mt-3 inline-flex items-center rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  Προβολή προφίλ
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
