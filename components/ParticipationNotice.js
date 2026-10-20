'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function ParticipationNotice() {
  const t = useTranslations('democracy');
  return (
    <p className="my-3 text-xs text-gray-600">
      <Link href="/platform/participation" className="underline underline-offset-4 hover:text-teal-800">
        {t('participationLink')}
      </Link>
    </p>
  );
}
