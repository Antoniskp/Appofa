'use client';
import { useState } from 'react';

export default function EditorialImage({ src, alt = '', className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (!src || failedSrc === src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailedSrc(src)} />;
}
