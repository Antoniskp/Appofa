'use client';

import { useMemo, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BuildingOffice2Icon, GlobeAltIcon, EnvelopeIcon, MapPinIcon, PencilSquareIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { organizationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth-context';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

const TABS = ['info', 'members', 'polls_voting', 'suggestions', 'official_posts'];

export default function OrganizationProfilePage({ params }) {
  const t = useTranslations('organizations');
  const { slug } = use(params);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

  const { data: organization, loading, error } = useAsyncData(
    async () => {
      const res = await organizationAPI.getBySlug(slug);
      return res?.data?.organization || null;
    },
    [slug],
    { initialData: null }
  );

  const { data: membersData, loading: membersLoading, error: membersError } = useAsyncData(
    async () => {
      if (!organization?.id) return { members: [] };
      const res = await organizationAPI.getMembers(organization.id);
      return { members: res?.data?.members || [] };
    },
    [organization?.id],
    { initialData: { members: [] } }
  );

  const members = membersData?.members || [];
  const isMember = useMemo(() => {
    if (!user?.id) return false;
    return members.some((member) => member.userId === user.id && member.status === 'active');
  }, [members, user?.id]);

  const roleLabel = (role) => t(`role_${role}`);
  const canEdit = user && ['admin', 'moderator'].includes(user.role);

  if (loading) {
    return <div className="app-container py-10"><SkeletonLoader count={1} type="card" /></div>;
  }

  if (error || !organization) {
    return (
      <div className="app-container py-10">
        <AlertMessage message={error || t('not_found')} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl mx-auto">
        <Link href="/organizations" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← {t('title')}</Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-5">
              {organization.logo ? (
                <img src={organization.logo} alt={organization.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <BuildingOffice2Icon className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">{t(`type_${organization.type}`)}</span>
                  {organization.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      <CheckBadgeIcon className="h-4 w-4" /> {t('verified_badge')}
                    </span>
                  )}
                  {!organization.isPublic && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">{t('private_badge')}</span>
                  )}
                  {canEdit && (
                    <Link
                      href={`/admin/organizations?edit=${organization.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      {t('edit')}
                    </Link>
                  )}
                </div>

                {organization.description && <p className="mt-2 text-gray-700 whitespace-pre-line">{organization.description}</p>}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                  {organization.website && (
                    <a href={organization.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-blue-600">
                      <GlobeAltIcon className="h-4 w-4" />
                      {organization.website}
                    </a>
                  )}
                  {organization.contactEmail && (
                    <a href={`mailto:${organization.contactEmail}`} className="inline-flex items-center gap-1 hover:text-blue-600">
                      <EnvelopeIcon className="h-4 w-4" />
                      {organization.contactEmail}
                    </a>
                  )}
                  {organization.location && (
                    <Link href={`/locations/${organization.location.slug}`} className="inline-flex items-center gap-1 hover:text-blue-600">
                      <MapPinIcon className="h-4 w-4" />
                      {organization.location.name}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto py-3">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t(tab)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            {activeTab === 'info' && (
              <div className="space-y-3 text-sm text-gray-700">
                {organization.description && <p><span className="font-semibold">{t('description')}:</span> {organization.description}</p>}
                {organization.website && <p><span className="font-semibold">{t('website')}:</span> <a className="text-blue-600 hover:underline" href={organization.website} target="_blank" rel="noopener noreferrer">{organization.website}</a></p>}
                {organization.contactEmail && <p><span className="font-semibold">{t('contact_email')}:</span> <a className="text-blue-600 hover:underline" href={`mailto:${organization.contactEmail}`}>{organization.contactEmail}</a></p>}
                {organization.location && <p><span className="font-semibold">{t('location')}:</span> <Link className="text-blue-600 hover:underline" href={`/locations/${organization.location.slug}`}>{organization.location.name}</Link></p>}
                {organization.createdBy && <p><span className="font-semibold">{t('created_by')}:</span> <Link className="text-blue-600 hover:underline" href={`/users/${organization.createdBy.username}`}>@{organization.createdBy.username}</Link></p>}
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                {membersLoading && <SkeletonLoader count={4} type="list" />}
                {!membersLoading && membersError && <AlertMessage message={membersError} />}
                {!membersLoading && !membersError && !organization.isPublic && !isMember && !canEdit && (
                  <AlertMessage message={t('members_only')} />
                )}
                {!membersLoading && !membersError && (organization.isPublic || isMember || canEdit) && (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                        {member.user?.avatar ? (
                          <img src={member.user.avatar} alt={member.user.username} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <UserCircleIcon className="h-10 w-10 text-gray-300" style={{ color: member.user?.avatarColor || undefined }} />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{member.user?.username || '-'}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">{roleLabel(member.role)}</span>
                        </div>
                      </div>
                    ))}
                    {members.length === 0 && <p className="text-sm text-gray-500">{t('no_members')}</p>}
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'info' && activeTab !== 'members' && (
              <p className="text-sm text-gray-500">{t('coming_soon')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
