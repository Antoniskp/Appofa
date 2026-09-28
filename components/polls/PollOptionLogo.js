'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getPartyLogo } from '@/lib/party-logo';

export default function PollOptionLogo({ poll, option }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (poll?.purpose !== 'voting_intention') return null;
  const official = getPartyLogo(option.text || option.displayText);
  const src = option.photoUrl || official?.src;
  if (!src || failedSrc === src) return null;
  return (
    <span className={`flex h-11 w-16 shrink-0 items-center justify-center rounded-md p-1.5 ring-1 ring-black/5 ${official?.dark && !option.photoUrl ? 'bg-gray-800' : 'bg-white'}`}>
      <Image src={src} alt="" width={64} height={44} unoptimized
        className="h-full w-full object-contain" onError={() => setFailedSrc(src)} />
    </span>
  );
}
