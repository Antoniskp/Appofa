'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BuildingOffice2Icon, GlobeAltIcon, EnvelopeIcon, MapPinIcon, PencilSquareIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { organizationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth-context';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

// Phase 2 ships full member management; remaining tabs are placeholders for later phases.
const TABS = ['info', 'members', 'polls_voting', 'suggestions', 'official_posts'];
const MANAGEABLE_ROLES = ['admin', 'moderator', 'member'];

function parsePositiveInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function OrganizationProfilePage({ params }) {
  const t = useTranslations('organizations');
  const { slug } = use(params);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [actionLoading, setActionLoading] = useState(false);
  const [memberActionError, setMemberActionError] = useState('');
  const [memberActionSuccess, setMemberActionSuccess] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [roleDrafts, setRoleDrafts] = useState({});

  const { data: organization, loading, error } = useAsyncData(
    async () => {
      const res = await organizationAPI.getBySlug(slug);
      return res?.data?.organization || null;
    },
    [slug],
    { initialData: null }
  );

  const { data: membersData, loading: membersLoading, error: membersError, refetch: refetchMembers } = useAsyncData(
    async () => {
      if (!organization?.id) return { members: [] };
      const res = await organizationAPI.getMembers(organization.id);
      return { members: res?.data?.members || [] };
    },
    [organization?.id],
    { initialData: { members: [] } }
  );

  const members = membersData?.members || [];

  const myMembership = useMemo(() => {
    if (!user?.id) return null;
    return members.find((member) => member.userId === user.id) || null;
  }, [members, user?.id]);

  const canManageMembers = useMemo(() => {
    if (!user) return false;
    if (['admin', 'moderator'].includes(user.role)) return true;
    return members.some(
      (member) => member.userId === user.id && member.status === 'active' && ['owner', 'admin'].includes(member.role)
    );
  }, [members, user]);

  const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = useAsyncData(
    async () => {
      if (!organization?.id || !canManageMembers) return { members: [] };
      const res = await organizationAPI.getPendingMembers(organization.id);
      return { members: res?.data?.members || [] };
    },
    [organization?.id, canManageMembers],
    { initialData: { members: [] } }
  );

  const pendingMembers = pendingData?.members || [];

  useEffect(() => {
    setRoleDrafts((prev) => {
      const next = {};
      const nextSize = members.length;
      let changed = Object.keys(prev).length !== nextSize;

      members.forEach((member) => {
        const value = prev[member.userId] ?? member.role;
        next[member.userId] = value;
        if (!changed && prev[member.userId] !== value) {
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [members]);

  const roleLabel = (role) => t(`role_${role}`);
  const statusLabel = (status) => t(`status_${status}`);
  const canEdit = user && ['admin', 'moderator'].includes(user.role);
  const canLeave = myMembership?.status === 'active' && myMembership?.role !== 'owner';

  const runMemberAction = async (action, successMessage) => {
    setActionLoading(true);
    setMemberActionError('');
    setMemberActionSuccess('');

    try {
      await action();
      setMemberActionSuccess(successMessage);
      await Promise.all([refetchMembers(), refetchPending()]);
    } catch (actionError) {
      setMemberActionError(actionError?.message || t('member_action_failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!organization?.id) return;
    await runMemberAction(() => organizationAPI.join(organization.id), t('join_success'));
  };

  const handleLeave = async () => {
    if (!organization?.id) return;
    await runMemberAction(() => organizationAPI.leave(organization.id), t('leave_success'));
  };

  const handleApprove = async (userId) => {
    if (!organization?.id) return;
    await runMemberAction(() => organizationAPI.approveMember(organization.id, userId), t('approve_success'));
  };

  const handleRemove = async (userId) => {
    if (!organization?.id) return;
    await runMemberAction(() => organizationAPI.removeMember(organization.id, userId), t('remove_success'));
  };

  const handleRoleUpdate = async (userId) => {
    if (!organization?.id) return;
    await runMemberAction(
      () => organizationAPI.updateMemberRole(organization.id, userId, roleDrafts[userId]),
      t('role_update_success')
    );
  };

  const handleInvite = async () => {
    if (!organization?.id) return;
    const userId = parsePositiveInt(inviteUserId);
    if (!userId) {
      setMemberActionError(t('invite_invalid_user_id'));
      return;
    }

    await runMemberAction(() => organizationAPI.inviteMember(organization.id, userId), t('invite_success'));
    setInviteUserId('');
  };

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
              <div className="space-y-4">
                {memberActionError && <AlertMessage message={memberActionError} />}
                {memberActionSuccess && <AlertMessage tone="success" message={memberActionSuccess} />}

                <div className="flex flex-wrap items-center gap-3">
                  {!user && <p className="text-sm text-gray-600">{t('login_to_manage_membership')}</p>}
                  {user && !myMembership && (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {t('join')}
                    </button>
                  )}
                  {myMembership?.status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">{t('pending_request')}</span>
                  )}
                  {myMembership?.status === 'invited' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">{t('invited_status')}</span>
                  )}
                  {canLeave && (
                    <button
                      type="button"
                      onClick={handleLeave}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {t('leave')}
                    </button>
                  )}
                  {myMembership?.role === 'owner' && myMembership?.status === 'active' && (
                    <span className="text-sm text-gray-600">{t('owner_cannot_leave')}</span>
                  )}
                </div>

                {canManageMembers && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
                    <p className="text-sm font-medium text-gray-800">{t('member_management')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={inviteUserId}
                        onChange={(e) => setInviteUserId(e.target.value)}
                        placeholder={t('invite_user_id_placeholder')}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleInvite}
                        disabled={actionLoading}
                        className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {t('invite_member')}
                      </button>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 mb-2">{t('pending_requests')}</p>
                      {pendingLoading && <SkeletonLoader count={2} type="list" />}
                      {!pendingLoading && pendingMembers.length === 0 && <p className="text-xs text-gray-500">{t('no_pending_requests')}</p>}
                      {!pendingLoading && pendingMembers.length > 0 && (
                        <div className="space-y-2">
                          {pendingMembers.map((member) => (
                            <div key={`pending-${member.id}`} className="flex items-center justify-between gap-3 text-sm border border-gray-200 rounded-lg bg-white px-3 py-2">
                              <span className="truncate">@{member.user?.username || member.userId}</span>
                              <button
                                type="button"
                                onClick={() => handleApprove(member.userId)}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                              >
                                {t('approve')}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {membersLoading && <SkeletonLoader count={4} type="list" />}
                {!membersLoading && membersError && <AlertMessage message={membersError} />}
                {!membersLoading && !membersError && !organization.isPublic && !myMembership && !canEdit && (
                  <AlertMessage message={t('members_only')} />
                )}
                {!membersLoading && !membersError && (organization.isPublic || myMembership || canEdit) && (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-gray-200">
                        {member.user?.avatar ? (
                          <img src={member.user.avatar} alt={member.user.username} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <UserCircleIcon className="h-10 w-10 text-gray-300" style={{ color: member.user?.avatarColor || undefined }} />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{member.user?.username || '-'}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">{roleLabel(member.role)}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{statusLabel(member.status)}</span>
                          </div>
                        </div>

                        {canManageMembers && member.role !== 'owner' && (
                          <div className="flex flex-wrap items-center gap-2">
                            {member.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleApprove(member.userId)}
                                disabled={actionLoading}
                                className="px-2 py-1 text-xs rounded border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                              >
                                {t('approve')}
                              </button>
                            )}

                            {member.status === 'active' && (
                              <>
                                <select
                                  value={roleDrafts[member.userId] ?? member.role}
                                  onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [member.userId]: e.target.value }))}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                                >
                                  {MANAGEABLE_ROLES.map((role) => (
                                    <option key={`${member.id}-${role}`} value={role}>{roleLabel(role)}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleRoleUpdate(member.userId)}
                                  disabled={actionLoading || (roleDrafts[member.userId] ?? member.role) === member.role}
                                  className="px-2 py-1 text-xs rounded border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                                >
                                  {t('update_role')}
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemove(member.userId)}
                              disabled={actionLoading}
                              className="px-2 py-1 text-xs rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {t('remove_member')}
                            </button>
                          </div>
                        )}
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
