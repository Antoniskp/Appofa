'use client';

import { useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function RolePersonPhoto({ person, name }) {
  const [failedSources, setFailedSources] = useState([]);
  const src = [person?.photo, person?.avatarUrl, person?.avatar].find(
    value => value && !failedSources.includes(value)
  );

  return src ? (
    <Image
      src={src}
      alt={name}
      width={192}
      height={192}
      className="h-20 w-20 shrink-0 rounded-xl border border-gray-200 object-cover sm:h-24 sm:w-24"
      onError={() => setFailedSources(previous => [...previous, src])}
    />
  ) : (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 sm:h-24 sm:w-24">
      <UserCircleIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />
    </div>
  );
}
