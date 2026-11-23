'use client';

import { defaultArticleImage, articleBannerImage } from '@/lib/utils/articleImage';
import Image from 'next/image';
import { useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import ExpandablePhoto from '@/components/ui/ExpandablePhoto';

export default function LocationActivityImage({ item, poll = false }) {
  const [failedSource, setFailedSource] = useState(null);
  const suggestionPhoto = item.photos?.find((photo) => photo?.url);
  const source = suggestionPhoto?.url || item.coverImage?.variants?.thumbnail?.url || (item.bannerImageUrl ? articleBannerImage(item) : item.sourceMeta?.thumbnailUrl);
  const image = source && source !== failedSource ? source : null;

  if (poll && !image) {
    return <div className="flex h-40 items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-100" aria-hidden="true">
      <ChartBarIcon className="h-14 w-14 text-blue-500" />
    </div>;
  }

  const fallback = defaultArticleImage(item);
  const thumbnail = (
    <Image
      src={image || fallback}
      alt={suggestionPhoto?.caption || ''}
      width={640}
      height={320}
      sizes="(max-width: 768px) 100vw, 40vw"
      unoptimized={image?.startsWith('/uploads/')}
      className="h-40 w-full object-cover"
      onError={() => { if (image) setFailedSource(source); }}
    />
  );
  if (!image || image === fallback) return thumbnail;

  return (
    <ExpandablePhoto
      src={item.coverImage?.variants?.articleCover?.url || image}
      name={suggestionPhoto?.caption || item.title}
      className="z-10 w-full focus-visible:-outline-offset-2"
    >
      {thumbnail}
    </ExpandablePhoto>
  );
}
