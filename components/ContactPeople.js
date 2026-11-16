'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { authAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import UserAvatar from '@/components/user/UserAvatar';

function ProfileLink({ user, label }) {
  const name = [user.firstNameNative, user.lastNameNative].filter(Boolean).join(' ')
    || [user.firstNameEn, user.lastNameEn].filter(Boolean).join(' ')
    || user.username;

  return (
    <li className="min-w-0">
      <Link
        href={`/users/${encodeURIComponent(user.username)}`}
        className="flex h-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <UserAvatar user={user} size="h-12 w-12" textSize="text-lg" />
        <div className="min-w-0">
          <p className="break-words font-semibold text-gray-900">{name}</p>
          <p className="truncate text-sm text-gray-500">@{user.username}</p>
          {label && <p className="mt-1 text-xs font-medium text-blue-700">{label}</p>}
        </div>
      </Link>
    </li>
  );
}

export default function ContactPeople() {
  const t = useTranslations('static_pages');
  const { data, loading, error, refetch } = useAsyncData(
    () => authAPI.getContactPeople(),
    [],
    { transform: (response) => response.data },
  );

  return (
    <section aria-labelledby="contact-people-heading" className="mb-8">
      <h2 id="contact-people-heading" className="text-xl font-semibold text-gray-900">{t('contact_people_title')}</h2>
      <p className="mt-2 text-sm text-gray-600">{t('contact_people_intro')}</p>
      {loading ? (
        <p role="status" className="mt-4 text-sm text-gray-500">{t('contact_people_loading')}</p>
      ) : error ? (
        <div role="status" className="mt-4 text-sm text-gray-600">
          <p>{t('contact_people_error')}</p>
          <button type="button" onClick={() => refetch()} className="mt-2 font-medium text-blue-700 underline">{t('contact_people_retry')}</button>
        </div>
      ) : (
        <>
          <h3 className="mb-3 mt-5 font-semibold text-gray-900">{t('contact_admins_title')}</h3>
          {data?.admins?.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.admins.map((user) => <ProfileLink key={user.id} user={user} label={t('contact_admin_label')} />)}
            </ul>
          ) : <p className="text-sm text-gray-500">{t('contact_admins_empty')}</p>}
          {data?.earlyMembers?.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 font-semibold text-gray-900">{t('contact_early_members_title')}</h3>
              <p className="mb-3 text-sm text-gray-600">{t('contact_early_members_intro')}</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.earlyMembers.map((user) => (
                  <ProfileLink
                    key={user.id}
                    user={user}
                    label={t(user.username === 'Simeon' ? 'contact_early_contributor_label' : 'contact_early_member_label')}
                  />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
