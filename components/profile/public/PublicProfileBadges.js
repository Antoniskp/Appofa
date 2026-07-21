'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { badgeAPI } from '@/lib/api';

const TIER_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };

function BadgeImage({ slug, tier }) {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return <span className="text-xl font-semibold text-gray-500">{TIER_LABELS[tier]?.slice(0, 1) || '*'}</span>;
  }
  return (
    <img
      src={`/images/badges/${slug}-${tier}.svg`}
      alt={`${slug} ${tier}`}
      className="w-10 h-10 object-contain"
      onError={() => setImgError(true)}
    />
  );
}

export default function PublicProfileBadges({ userId, labels = {} }) {
  const [badges, setBadges] = useState(null);

  useEffect(() => {
    if (!userId) return;
    badgeAPI.getUserBadges(userId)
      .then((res) => {
        if (res?.data?.badges) setBadges(res.data.badges);
        else setBadges([]);
      })
      .catch(() => setBadges([]));
  }, [userId]);

  if (badges === null) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{labels.title || 'Badges'}</h2>
        <Link href="/platform/badges" className="text-xs text-blue-600 hover:underline">
          {labels.viewAll || 'View all badges ->'}
        </Link>
      </div>
      {badges.length === 0 ? (
        <p className="text-sm text-gray-500">{labels.empty || 'No badges earned yet.'}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {badges.map((b) => (
            <div
              key={`${b.badgeSlug}-${b.tier}`}
              className="flex flex-col items-center gap-1 min-w-[64px]"
              title={`${b.name || b.badgeSlug} - ${b.label || b.tier}`}
            >
              <BadgeImage slug={b.badgeSlug} tier={b.tier} />
              <span className="text-xs text-gray-600 text-center leading-tight">{b.name || b.badgeSlug}</span>
              <span className="text-xs text-gray-400 capitalize">{b.label || b.tier}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
