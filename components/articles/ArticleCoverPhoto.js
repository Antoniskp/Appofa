'use client';

import { useState } from 'react';
import Image from 'next/image';
import ExpandablePhoto from '@/components/ui/ExpandablePhoto';
import { articleBannerImage, defaultArticleImage } from '@/lib/utils/articleImage';

export default function ArticleCoverPhoto({ article }) {
  const [failedSource, setFailedSource] = useState(null);
  const fallback = defaultArticleImage(article);
  const cover = article.coverImage?.variants?.articleCover?.url || articleBannerImage(article);
  const src = failedSource === cover ? fallback : cover;
  const image = (
    <Image
      src={src}
      alt={article.bannerImageAltText || article.title}
      width={1600}
      height={900}
      sizes="100vw"
      priority
      unoptimized={src.startsWith('/uploads/')}
      className="h-64 w-full object-cover"
      onError={() => setFailedSource(cover)}
    />
  );

  if (src === fallback) return image;

  return (
    <ExpandablePhoto src={src} name={article.bannerImageAltText || article.title} caption={article.bannerImageCaption} className="w-full focus-visible:-outline-offset-2">
      {image}
    </ExpandablePhoto>
  );
}
