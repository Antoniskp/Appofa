'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAsyncData } from '@/hooks/useAsyncData';
import { officialPostsAPI } from '@/lib/api';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function OfficialPostsPage() {
  const t = useTranslations('organizations');

  const { data, loading, error } = useAsyncData(
    async () => {
      const res = await officialPostsAPI.getAll();
      return res?.data?.officialPosts || [];
    },
    [],
    { initialData: [] }
  );

  const officialPosts = data || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="app-container max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('official_posts_discovery_title')}</h1>
          <p className="text-sm text-gray-600">{t('official_posts_discovery_subtitle')}</p>
        </div>

        {loading && <SkeletonLoader count={4} type="list" />}
        {!loading && error && <AlertMessage message={error || t('official_posts_error_loading')} />}
        {!loading && !error && officialPosts.length === 0 && (
          <p className="text-sm text-gray-500">{t('official_posts_empty')}</p>
        )}
        {!loading && !error && officialPosts.length > 0 && (
          <div className="space-y-3">
            {officialPosts.map((post) => (
              <div key={`${post.contentType}-${post.id}`} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">{post.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                      {t(`official_post_type_${post.contentType}`)}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {t(`official_post_scope_${post.officialPostScope || 'platform'}`)}
                    </span>
                  </div>
                </div>
                {post.body && <p className="mt-2 text-sm text-gray-700">{post.body}</p>}
                {post.organization && (
                  <div className="mt-3 text-sm">
                    <Link href={`/organizations/${post.organization.slug}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      {post.organization.name}
                      {post.organization.isVerified && <CheckBadgeIcon className="h-4 w-4 text-green-600" />}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
