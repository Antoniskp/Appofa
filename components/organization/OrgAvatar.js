'use client';

import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useState } from 'react';

export default function OrgAvatar({ org, size = 'h-6 w-6', fallback }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = org?.logo;
  if (src && failedSrc !== src) {
    return (
      <Image
        src={src}
        alt={org.name}
        width={96}
        height={96}
        onError={() => setFailedSrc(src)}
        className={`${size} rounded object-contain p-1 border border-gray-200 flex-shrink-0 bg-white`}
      />
    );
  }

  return fallback || (
    <span className={`${size} rounded bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0`}>
      <BuildingOffice2Icon className="h-3.5 w-3.5 text-gray-400" />
    </span>
  );
}
