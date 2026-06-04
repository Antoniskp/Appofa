'use client';

import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

export default function OrgAvatar({ org, size = 'h-6 w-6' }) {
  if (org?.logo) {
    return (
      <img
        src={org.logo}
        alt={org.name}
        className={`${size} rounded object-cover border border-gray-200 flex-shrink-0`}
      />
    );
  }

  return (
    <span className={`${size} rounded bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0`}>
      <BuildingOffice2Icon className="h-3.5 w-3.5 text-gray-400" />
    </span>
  );
}
