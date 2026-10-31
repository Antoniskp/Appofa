'use client';

import { useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function LocationActivityImage({ item, poll = false }) {
  const [failedSource, setFailedSource] = useState(null);
  const source = item.coverImage?.variants?.thumbnail?.url || item.bannerImageUrl || item.sourceMeta?.thumbnailUrl;
  const image = source && source !== failedSource ? source : null;

  if (poll && !image) {
    return <div className="flex h-40 items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-100" aria-hidden="true">
      <ChartBarIcon className="h-14 w-14 text-blue-500" />
    </div>;
  }

  return <img
    src={image || '/images/branding/news default.png'}
    alt=""
    loading="lazy"
    className="h-40 w-full object-cover"
    onError={() => { if (image) setFailedSource(source); }}
  />;
}
