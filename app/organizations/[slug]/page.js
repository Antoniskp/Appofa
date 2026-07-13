'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AcademicCapIcon, BuildingLibraryIcon, BuildingOffice2Icon, BriefcaseIcon, FlagIcon,
  GlobeAltIcon, EnvelopeIcon, MapPinIcon, MegaphoneIcon,
  PencilSquareIcon, UserCircleIcon, PlusIcon, ChevronUpIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { organizationAPI } from '@/lib/api';
import organizationContentConfig from '@/config/organizationContent.json';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth-context';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';
import PersonSearch from '@/components/dream-team/PersonSearch';
import PollCard from '@/components/polls/PollCard';
import SuggestionCard from '@/components/SuggestionCard';
import SearchInput from '@/components/ui/SearchInput';

const BASE_TABS = ['tab_info', 'tab_roles', 'tab_members', 'tab_polls', 'tab_suggestions', 'tab_analytics'];
const OFFICIAL_POST_TABS = ['tab_official_posts'];
const OFFICIAL_POST_ORG_TYPES = ['party', 'institution'];
const MANAGEABLE_ROLES = ['admin', 'moderator', 'member'];
const ORG_VISIBILITY_OPTIONS = organizationContentConfig.visibilities;
const ORG_SUGGESTION_TYPES = organizationContentConfig.suggestionTypes;
const TYPE_PROFILE_DETAILS = {
  company: { icon: BriefcaseIcon, panel: 'border-slate-200 bg-slate-50 text-slate-700', iconBox: 'bg-white text-slate-500' },
  organization: { icon: BuildingOffice2Icon, panel: 'border-blue-200 bg-blue-50 text-blue-700', iconBox: 'bg-white text-blue-500' },
  institution: { icon: BuildingLibraryIcon, panel: 'border-emerald-200 bg-emerald-50 text-emerald-700', iconBox: 'bg-white text-emerald-500' },
  school: { icon: AcademicCapIcon, panel: 'border-amber-200 bg-amber-50 text-amber-800', iconBox: 'bg-white text-amber-600' },
  university: { icon: AcademicCapIcon, panel: 'border-indigo-200 bg-indigo-50 text-indigo-700', iconBox: 'bg-white text-indigo-500' },
  party: { icon: FlagIcon, panel: 'border-rose-200 bg-rose-50 text-rose-700', iconBox: 'bg-white text-rose-500' },
};
const ROLE_TEMPLATES = {
  party: [
    ['role_template_president', 'role_category_leadership'],
    ['role_template_secretary', 'role_category_governance'],
    ['role_template_spokesperson', 'role_category_public_relations'],
    ['role_template_local_branch_lead', 'role_category_community'],
    ['role_template_youth_lead', 'role_category_community'],
  ],
  school: [
    ['role_template_principal', 'role_category_leadership'],
    ['role_template_parent_association', 'role_category_community'],
    ['role_template_student_council', 'role_category_community'],
    ['role_template_municipal_liaison', 'role_category_public_relations'],
  ],
  institution: [
    ['role_template_director', 'role_category_leadership'],
    ['role_template_press_office', 'role_category_public_relations'],
    ['role_template_public_liaison', 'role_category_public_relations'],
    ['role_template_service_manager', 'role_category_operations'],
  ],
  university: [
    ['role_template_rector', 'role_category_leadership'],
    ['role_template_dean', 'role_category_leadership'],
    ['role_template_student_union', 'role_category_community'],
    ['role_template_research_lead', 'role_category_programs'],
  ],
  company: [
    ['role_template_public_affairs', 'role_category_public_relations'],
    ['role_template_sustainability_lead', 'role_category_programs'],
    ['role_template_local_impact_lead', 'role_category_community'],
  ],
  organization: [
    ['role_template_coordinator', 'role_category_operations'],
    ['role_template_community_manager', 'role_category_community'],
    ['role_template_treasurer', 'role_category_governance'],
    ['role_template_volunteer_lead', 'role_category_community'],
  ],
};

export default function OrganizationProfilePage({ params }) {
  const t = useTranslations('organizations');
  const { slug } = use(params);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tab_info');
  const [actionLoading, setActionLoading] = useState(false);
  const [memberActionError, setMemberActionError] = useState('');
  const [memberActionSuccess, setMemberActionSuccess] = useState('');
  // Invite search state: controlled input + selected user object
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteSelectedUser, setInviteSelectedUser] = useState(null);
  const [inviteSearchError, setInviteSearchError] = useState('');
  const [roleDrafts, setRoleDrafts] = useState({});
  const [pollForm, setPollForm] = useState({ title: '', description: '', deadline: '', visibility: 'members_only' });
  const [suggestionForm, setSuggestionForm] = useState({ type: 'idea', title: '', body: '', visibility: 'members_only' });
  const [officialPostForm, setOfficialPostForm] = useState({
    contentType: 'suggestion',
    title: '',
    body: '',
    officialPostScope: 'platform',
    visibility: 'public',
  });
  const [contentActionLoading, setContentActionLoading] = useState(false);
  const [contentActionError, setContentActionError] = useState('');
  const [contentActionSuccess, setContentActionSuccess] = useState('');
  const [showPollForm, setShowPollForm] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  // Local search filter for org polls and suggestions tabs
  const [pollSearch, setPollSearch] = useState('');
  const [suggestionSearch, setSuggestionSearch] = useState('');
  // Roles management state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ title: '', category: '', description: '', sortOrder: 0, isCurrent: true });
  const [roleAssignType, setRoleAssignType] = useState('vacant');
  const [roleAssignDisplayName, setRoleAssignDisplayName] = useState('');
  const [roleAssignSelected, setRoleAssignSelected] = useState(null);
  const [roleActionLoading, setRoleActionLoading] = useState(false);
  const [roleActionError, setRoleActionError] = useState('');
  const [roleActionSuccess, setRoleActionSuccess] = useState('');
  const [showHistoricalRoles, setShowHistoricalRoles] = useState(false);

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
  const isActiveMember = myMembership?.status === 'active';

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

  const {
    data: childrenData,
    loading: childrenLoading,
    error: childrenError,
  } = useAsyncData(
    async () => {
      if (!organization?.id) return { organizations: [] };
      const res = await organizationAPI.getChildren(organization.id);
      return { organizations: res?.data?.organizations || [] };
    },
    [organization?.id],
    { initialData: { organizations: [] } }
  );
  const children = childrenData?.organizations || [];

  const {
    data: pollsData,
    loading: pollsLoading,
    error: pollsError,
    refetch: refetchPolls,
  } = useAsyncData(
    async () => {
      if (!organization?.id) return { polls: [] };
      const res = await organizationAPI.getPolls(organization.id);
      return { polls: res?.data?.polls || [] };
    },
    [organization?.id],
    { initialData: { polls: [] } }
  );

  const {
    data: suggestionsData,
    loading: suggestionsLoading,
    error: suggestionsError,
    refetch: refetchSuggestions,
  } = useAsyncData(
    async () => {
      if (!organization?.id) return { suggestions: [] };
      const res = await organizationAPI.getSuggestions(organization.id);
      return { suggestions: res?.data?.suggestions || [] };
    },
    [organization?.id],
    { initialData: { suggestions: [] } }
  );
  const polls = pollsData?.polls || [];
  const suggestions = suggestionsData?.suggestions || [];
  const supportsOfficialPosts = OFFICIAL_POST_ORG_TYPES.includes(organization?.type);
  const canSeeAnalytics = canManageMembers;
  const tabs = useMemo(
    () => {
      const tabKeys = supportsOfficialPosts ? [...BASE_TABS, ...OFFICIAL_POST_TABS] : BASE_TABS;
      return tabKeys.filter((tab) => tab !== 'tab_analytics' || canSeeAnalytics);
    },
    [canSeeAnalytics, supportsOfficialPosts]
  );
  const canCreateOfficialPosts = canManageMembers;

  const {
    data: officialPostsData,
    loading: officialPostsLoading,
    error: officialPostsError,
    refetch: refetchOfficialPosts,
  } = useAsyncData(
    async () => {
      if (!organization?.id || !supportsOfficialPosts) return { officialPosts: [] };
      const res = await organizationAPI.getOfficialPosts(organization.id);
      return { officialPosts: res?.data?.officialPosts || [] };
    },
    [organization?.id, supportsOfficialPosts],
    { initialData: { officialPosts: [] } }
  );
  const officialPosts = officialPostsData?.officialPosts || [];

  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAsyncData(
    async () => {
      if (!organization?.id || !canSeeAnalytics) return { analytics: [] };
      const res = await organizationAPI.getAnalytics(organization.id);
      return { analytics: res?.data?.analytics || [] };
    },
    [organization?.id, canSeeAnalytics],
    { initialData: { analytics: [] } }
  );
  const analytics = analyticsData?.analytics || [];

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useAsyncData(
    async () => {
      if (!organization?.id) return { roles: [] };
      const res = await organizationAPI.getRoles(organization.id, showHistoricalRoles ? { all: 'true' } : {});
      return { roles: res?.data?.roles || [] };
    },
    [organization?.id, showHistoricalRoles],
    { initialData: { roles: [] } }
  );
  const orgRoles = rolesData?.roles || [];

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

  useEffect(() => {
    if (!supportsOfficialPosts && activeTab === 'tab_official_posts') {
      setActiveTab('tab_info');
    }
  }, [activeTab, supportsOfficialPosts]);

  useEffect(() => {
    if (!canSeeAnalytics && activeTab === 'tab_analytics') {
      setActiveTab('tab_info');
    }
  }, [activeTab, canSeeAnalytics]);

  const roleLabel = (role) => t(`role_${role}`);
  const statusLabel = (status) => t(`status_${status}`);
  const canEdit = user && ['admin', 'moderator'].includes(user.role);
  const canLeave = myMembership?.status === 'active' && myMembership?.role !== 'owner';
  const profileDetail = TYPE_PROFILE_DETAILS[organization?.type] || TYPE_PROFILE_DETAILS.organization;
  const ProfileTypeIcon = profileDetail.icon;
  const activeMemberCount = members.filter((member) => member.status === 'active').length;
  const currentRoleCount = orgRoles.filter((role) => role.isCurrent !== false).length;
  const roleTemplates = ROLE_TEMPLATES[organization?.type] || ROLE_TEMPLATES.organization;

  const applyRoleTemplate = (titleKey, categoryKey) => {
    setRoleForm((current) => ({
      ...current,
      title: t(titleKey),
      category: t(categoryKey),
    }));
  };

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
    if (!inviteSelectedUser) {
      setMemberActionError(t('invite_no_user_selected'));
      return;
    }

    await runMemberAction(() => organizationAPI.inviteMember(organization.id, inviteSelectedUser.id), t('invite_success'));
    setInviteSelectedUser(null);
    setInviteDisplayName('');
    setInviteSearchError('');
  };

  const handleInviteSearchChange = (e) => {
    setInviteDisplayName(e.target.value);
    // Clear selection when the user modifies the search text
    setInviteSelectedUser(null);
    setInviteSearchError('');
  };

  const handleInviteSelect = (result) => {
    const isRealUser = result.entityType === 'user';
    // A person profile is invitable only when it has been claimed by a real user
    // (claimStatus === 'claimed' ensures the claim was approved, and claimedByUserId
    // must be a positive integer ID for the actual invitable user account).
    const isClaimed = result.entityType === 'person' && result.claimStatus === 'claimed'
      && typeof result.claimedByUserId === 'number' && result.claimedByUserId > 0;

    if (!isRealUser && !isClaimed) {
      setInviteSearchError(t('invite_not_a_user'));
      setInviteSelectedUser(null);
      return;
    }

    const userId = isRealUser ? result.id : result.claimedByUserId;
    // Build display name: prefer native names, fall back to English names, then username
    const nativeName = (`${result.firstNameNative || ''} ${result.lastNameNative || ''}`).trim();
    const englishName = (`${result.firstNameEn || ''} ${result.lastNameEn || ''}`).trim();
    const displayName = nativeName || englishName || result.username || '';
    setInviteDisplayName(displayName);
    setInviteSelectedUser({ id: userId, displayName });
    setInviteSearchError('');
  };

  const runContentAction = async (action, successMessage, failureMessage, onSuccessRefetch) => {
    setContentActionLoading(true);
    setContentActionError('');
    setContentActionSuccess('');
    try {
      await action();
      setContentActionSuccess(successMessage);
      if (typeof onSuccessRefetch === 'function') {
        await onSuccessRefetch();
      }
    } catch (actionError) {
      setContentActionError(actionError?.message || failureMessage);
    } finally {
      setContentActionLoading(false);
    }
  };

  const handleCreatePoll = async (event) => {
    event.preventDefault();
    if (!organization?.id) return;
    await runContentAction(
      () => organizationAPI.createPoll(organization.id, pollForm),
      t('org_poll_create_success'),
      t('org_poll_create_failed'),
      refetchPolls
    );
    setPollForm({ title: '', description: '', deadline: '', visibility: 'members_only' });
    setShowPollForm(false);
  };

  const handleCreateSuggestion = async (event) => {
    event.preventDefault();
    if (!organization?.id) return;
    await runContentAction(
      () => organizationAPI.createSuggestion(organization.id, suggestionForm),
      t('org_suggestion_create_success'),
      t('org_suggestion_create_failed'),
      refetchSuggestions
    );
    setSuggestionForm({ type: 'idea', title: '', body: '', visibility: 'members_only' });
    setShowSuggestionForm(false);
  };

  const handleCreateOfficialPost = async (event) => {
    event.preventDefault();
    if (!organization?.id) return;
    await runContentAction(
      () => organizationAPI.createOfficialPost(organization.id, officialPostForm),
      t('official_post_create_success'),
      t('official_post_create_failed'),
      refetchOfficialPosts
    );
    setOfficialPostForm({
      contentType: 'suggestion',
      title: '',
      body: '',
      officialPostScope: 'platform',
      visibility: 'public',
    });
  };

  const resetRoleForm = () => {
    setRoleForm({ title: '', category: '', description: '', sortOrder: 0, isCurrent: true });
    setRoleAssignType('vacant');
    setRoleAssignDisplayName('');
    setRoleAssignSelected(null);
    setEditingRole(null);
    setShowRoleForm(false);
    setRoleActionError('');
  };

  const openRoleCreate = () => {
    resetRoleForm();
    setShowRoleForm(true);
  };

  const openRoleEdit = (role) => {
    setEditingRole(role);
    setRoleForm({
      title: role.title || '',
      category: role.category || '',
      description: role.description || '',
      sortOrder: role.sortOrder ?? 0,
      isCurrent: role.isCurrent !== false,
    });
    // Determine assign type from existing role data
    if (role.userId) {
      setRoleAssignType('user');
      const u = role.user;
      const nativeName = (`${u?.firstNameNative || ''} ${u?.lastNameNative || ''}`).trim();
      const enName = (`${u?.firstNameEn || ''} ${u?.lastNameEn || ''}`).trim();
      setRoleAssignDisplayName(nativeName || enName || u?.username || '');
      setRoleAssignSelected({ id: role.userId, entityType: 'user', displayName: nativeName || enName || u?.username || '' });
    } else if (role.personId) {
      setRoleAssignType('person');
      const p = role.personProfile;
      const nativeName = (`${p?.firstNameNative || ''} ${p?.lastNameNative || ''}`).trim();
      const enName = (`${p?.firstNameEn || ''} ${p?.lastNameEn || ''}`).trim();
      setRoleAssignDisplayName(nativeName || enName || '');
      setRoleAssignSelected({ id: role.personId, entityType: 'person', displayName: nativeName || enName || '' });
    } else {
      setRoleAssignType('vacant');
      setRoleAssignDisplayName('');
      setRoleAssignSelected(null);
    }
    setRoleActionError('');
    setShowRoleForm(true);
  };

  const handleRoleAssignSelect = (result) => {
    const nativeName = (`${result.firstNameNative || ''} ${result.lastNameNative || ''}`).trim();
    const enName = (`${result.firstNameEn || ''} ${result.lastNameEn || ''}`).trim();
    const displayName = nativeName || enName || result.username || '';
    setRoleAssignDisplayName(displayName);
    setRoleAssignSelected({ ...result, displayName });
  };

  const handleSubmitRole = async (event) => {
    event.preventDefault();
    if (!organization?.id) return;
    if (!roleForm.title.trim()) {
      setRoleActionError(t('role_title') + ' ' + t('is_required', 'is required'));
      return;
    }

    setRoleActionLoading(true);
    setRoleActionError('');
    setRoleActionSuccess('');

    try {
      const payload = {
        title: roleForm.title.trim(),
        category: roleForm.category.trim() || null,
        description: roleForm.description.trim() || null,
        sortOrder: Number(roleForm.sortOrder) || 0,
        isCurrent: roleForm.isCurrent,
        userId: null,
        personId: null,
      };

      if (roleAssignType === 'user' && roleAssignSelected?.entityType === 'user') {
        payload.userId = roleAssignSelected.id;
      } else if (roleAssignType === 'person' && roleAssignSelected?.entityType === 'person') {
        payload.personId = roleAssignSelected.id;
      }

      if (editingRole) {
        await organizationAPI.updateRole(organization.id, editingRole.id, payload);
        setRoleActionSuccess(t('role_updated'));
      } else {
        await organizationAPI.createRole(organization.id, payload);
        setRoleActionSuccess(t('role_created'));
      }
      resetRoleForm();
      await refetchRoles();
    } catch (err) {
      setRoleActionError(err?.message || (editingRole ? t('role_update_failed') : t('role_create_failed')));
    } finally {
      setRoleActionLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!organization?.id || !window.confirm(t('role_delete_confirm'))) return;
    setRoleActionLoading(true);
    setRoleActionError('');
    setRoleActionSuccess('');
    try {
      await organizationAPI.deleteRole(organization.id, roleId);
      setRoleActionSuccess(t('role_deleted'));
      await refetchRoles();
    } catch (err) {
      setRoleActionError(err?.message || t('role_delete_failed'));
    } finally {
      setRoleActionLoading(false);
    }
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

                <div className={`mt-5 rounded-lg border p-4 ${profileDetail.panel}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${profileDetail.iconBox}`}>
                      <ProfileTypeIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{t(`type_focus_title_${organization.type}`)}</p>
                      <p className="mt-1 text-sm leading-5">{t(`type_focus_body_${organization.type}`)}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <div className="rounded bg-white/70 px-2 py-1.5">
                          <span className="block font-semibold text-gray-900">{activeMemberCount}</span>
                          <span className="text-gray-600">{t('summary_active_members')}</span>
                        </div>
                        <div className="rounded bg-white/70 px-2 py-1.5">
                          <span className="block font-semibold text-gray-900">{currentRoleCount}</span>
                          <span className="text-gray-600">{t('summary_roles')}</span>
                        </div>
                        <div className="rounded bg-white/70 px-2 py-1.5">
                          <span className="block font-semibold text-gray-900">{polls.length + suggestions.length}</span>
                          <span className="text-gray-600">{t('summary_civic_items')}</span>
                        </div>
                        <div className="rounded bg-white/70 px-2 py-1.5">
                          <span className="block font-semibold text-gray-900">{children.length}</span>
                          <span className="text-gray-600">{t('summary_branches')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto py-3">
              {tabs.map((tab) => (
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
            {contentActionError && <AlertMessage message={contentActionError} />}
            {contentActionSuccess && <AlertMessage tone="success" message={contentActionSuccess} />}

            {activeTab === 'tab_info' && (
              <div className="space-y-3 text-sm text-gray-700">
                {organization.description && <p><span className="font-semibold">{t('description')}:</span> {organization.description}</p>}
                {organization.website && <p><span className="font-semibold">{t('website')}:</span> <a className="text-blue-600 hover:underline" href={organization.website} target="_blank" rel="noopener noreferrer">{organization.website}</a></p>}
                {organization.contactEmail && <p><span className="font-semibold">{t('contact_email')}:</span> <a className="text-blue-600 hover:underline" href={`mailto:${organization.contactEmail}`}>{organization.contactEmail}</a></p>}
                {organization.location && <p><span className="font-semibold">{t('location')}:</span> <Link className="text-blue-600 hover:underline" href={`/locations/${organization.location.slug}`}>{organization.location.name}</Link></p>}
                {organization.createdBy && <p><span className="font-semibold">{t('created_by')}:</span> <Link className="text-blue-600 hover:underline" href={`/users/${organization.createdBy.username}`}>@{organization.createdBy.username}</Link></p>}
                {organization.parent && (
                  <p>
                    <span className="font-semibold">{t('part_of')}:</span>{' '}
                    <Link className="text-blue-600 hover:underline" href={`/organizations/${organization.parent.slug}`}>
                      {organization.parent.name}
                    </Link>
                  </p>
                )}
                <div>
                  <p className="font-semibold">{t('sub_organizations')}:</p>
                  {childrenLoading && <SkeletonLoader count={2} type="list" />}
                  {!childrenLoading && childrenError && <AlertMessage message={childrenError} />}
                  {!childrenLoading && !childrenError && children.length === 0 && (
                    <p className="text-sm text-gray-500">{t('no_sub_organizations')}</p>
                  )}
                  {!childrenLoading && !childrenError && children.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 space-y-1">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link className="text-blue-600 hover:underline" href={`/organizations/${child.slug}`}>
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tab_roles' && (
              <div className="space-y-4">
                {roleActionError && <AlertMessage message={roleActionError} />}
                {roleActionSuccess && <AlertMessage tone="success" message={roleActionSuccess} />}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-800">{t('roles')}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHistoricalRoles((v) => !v)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      {showHistoricalRoles ? t('hide_historical_roles') : t('show_historical_roles')}
                    </button>
                    {canManageMembers && !showRoleForm && (
                      <button
                        type="button"
                        onClick={openRoleCreate}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                        {t('add_role')}
                      </button>
                    )}
                  </div>
                </div>

                {canManageMembers && showRoleForm && (
                  <form onSubmit={handleSubmitRole} className="p-4 rounded-lg border border-blue-100 bg-blue-50 space-y-3">
                    <p className="text-sm font-semibold text-blue-800">{editingRole ? t('edit_role') : t('add_role')}</p>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('role_title')} *</label>
                      <input
                        type="text"
                        value={roleForm.title}
                        onChange={(e) => setRoleForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder={t('role_title_placeholder')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        maxLength={255}
                        required
                      />
                    </div>

                    {!editingRole && roleTemplates.length > 0 && (
                      <div className="rounded-lg border border-blue-200 bg-white p-3">
                        <p className="text-xs font-semibold text-gray-700">{t('role_templates_label')}</p>
                        <p className="mt-1 text-xs text-gray-500">{t(`role_templates_help_${organization.type}`)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {roleTemplates.map(([titleKey, categoryKey]) => (
                            <button
                              key={`${titleKey}-${categoryKey}`}
                              type="button"
                              onClick={() => applyRoleTemplate(titleKey, categoryKey)}
                              className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              {t(titleKey)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('role_category')}</label>
                        <input
                          type="text"
                          value={roleForm.category}
                          onChange={(e) => setRoleForm((f) => ({ ...f, category: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('role_sort_order')}</label>
                        <input
                          type="number"
                          value={roleForm.sortOrder}
                          onChange={(e) => setRoleForm((f) => ({ ...f, sortOrder: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          min={0}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('role_description')}</label>
                      <textarea
                        value={roleForm.description}
                        onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="role-is-current"
                        type="checkbox"
                        checked={roleForm.isCurrent}
                        onChange={(e) => setRoleForm((f) => ({ ...f, isCurrent: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <label htmlFor="role-is-current" className="text-sm text-gray-700">{t('role_is_current')}</label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('assign_user')} / {t('assign_person')}</label>
                      <div className="flex gap-2 mb-2">
                        {['vacant', 'user', 'person'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => { setRoleAssignType(type); setRoleAssignDisplayName(''); setRoleAssignSelected(null); }}
                            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${roleAssignType === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                          >
                            {type === 'vacant' ? t('roles_vacant') : type === 'user' ? t('assign_user') : t('assign_person')}
                          </button>
                        ))}
                      </div>
                      {(roleAssignType === 'user' || roleAssignType === 'person') && (
                        <PersonSearch
                          placeholder={roleAssignType === 'user' ? t('assign_user') : t('assign_person')}
                          value={roleAssignDisplayName}
                          onChange={(e) => { setRoleAssignDisplayName(e.target.value); setRoleAssignSelected(null); }}
                          onSelect={(result) => {
                            const isUser = result.entityType === 'user';
                            const isPerson = result.entityType === 'person';
                            if (roleAssignType === 'user' && !isUser) { setRoleActionError(t('role_assign_must_be_user')); return; }
                            if (roleAssignType === 'person' && !isPerson) { setRoleActionError(t('role_assign_must_be_person')); return; }
                            handleRoleAssignSelect(result);
                          }}
                        />
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={roleActionLoading}
                        className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {editingRole ? t('edit_role') : t('add_role')}
                      </button>
                      <button
                        type="button"
                        onClick={resetRoleForm}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </form>
                )}

                {rolesLoading && <SkeletonLoader count={3} type="list" />}
                {!rolesLoading && rolesError && <AlertMessage message={rolesError} />}
                {!rolesLoading && !rolesError && orgRoles.length === 0 && (
                  <p className="text-sm text-gray-500 py-4">{t('roles_empty')}</p>
                )}
                {!rolesLoading && !rolesError && orgRoles.length > 0 && (
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                    {orgRoles.map((role) => {
                      const assignee = role.user || role.personProfile || null;
                      const nativeName = assignee ? (`${assignee.firstNameNative || ''} ${assignee.lastNameNative || ''}`).trim() : '';
                      const enName = assignee ? (`${assignee.firstNameEn || ''} ${assignee.lastNameEn || ''}`).trim() : '';
                      const displayName = nativeName || enName || assignee?.username || '';
                      const profileHref = role.user ? `/users/${role.user.username}` : role.personProfile ? `/persons/${role.personProfile.slug}` : null;

                      return (
                        <div key={role.id} className="flex items-start gap-3 p-3 bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0 mt-0.5">
                            {assignee?.avatar ? (
                              <img src={assignee.avatar} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-medium text-sm text-gray-900">{role.title}</span>
                              {role.category && (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">{role.category}</span>
                              )}
                              {!role.isCurrent && (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-700">{t('role_historical_badge')}</span>
                              )}
                            </div>
                            {assignee ? (
                              <div className="mt-0.5 text-sm text-gray-700">
                                {profileHref ? (
                                  <Link href={profileHref} className="hover:text-blue-600 hover:underline">{displayName}</Link>
                                ) : (
                                  <span>{displayName}</span>
                                )}
                              </div>
                            ) : (
                              <p className="mt-0.5 text-sm text-gray-400 italic">{t('roles_vacant')}</p>
                            )}
                            {role.description && (
                              <p className="mt-1 text-xs text-gray-500 whitespace-pre-line">{role.description}</p>
                            )}
                          </div>
                          {canManageMembers && (
                            <div className="flex-shrink-0 flex gap-1">
                              <button
                                type="button"
                                onClick={() => openRoleEdit(role)}
                                className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                                aria-label={t('edit_role')}
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id)}
                                disabled={roleActionLoading}
                                className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                aria-label={t('delete_role')}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tab_members' && (
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
                    <div className="space-y-2">
                      <div className={inviteSearchError ? 'ring-1 ring-red-400 rounded-lg' : undefined}>
                        <PersonSearch
                          placeholder={t('invite_user_id_placeholder')}
                          value={inviteDisplayName}
                          onChange={handleInviteSearchChange}
                          onSelect={handleInviteSelect}
                        />
                      </div>
                      {inviteSearchError && (
                        <p className="text-xs text-red-600">{inviteSearchError}</p>
                      )}
                      <button
                        type="button"
                        onClick={handleInvite}
                        disabled={actionLoading || !inviteSelectedUser}
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

            {activeTab === 'tab_polls' && (
              <div className="space-y-4">
                {!isActiveMember && organization.isPublic && <AlertMessage message={t('members_only_gate')} />}

                {isActiveMember && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowPollForm((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors mb-3"
                    >
                      {showPollForm ? <ChevronUpIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                      {t('create_poll')}
                    </button>

                    {showPollForm && (
                      <form onSubmit={handleCreatePoll} className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
                        <p className="text-sm font-semibold text-blue-800">{t('create_poll')}</p>
                        <input
                          type="text"
                          value={pollForm.title}
                          onChange={(e) => setPollForm((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder={t('poll_title')}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={pollForm.description}
                          onChange={(e) => setPollForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder={t('description')}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">{t('poll_deadline')}</label>
                            <input
                              type="datetime-local"
                              value={pollForm.deadline}
                              onChange={(e) => setPollForm((prev) => ({ ...prev, deadline: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">{t('poll_visibility')}</label>
                            <select
                              value={pollForm.visibility}
                              onChange={(e) => setPollForm((prev) => ({ ...prev, visibility: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            >
                              {ORG_VISIBILITY_OPTIONS.map((visibility) => (
                                <option key={visibility} value={visibility}>{t(`visibility_${visibility}`)}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={contentActionLoading}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {t('create_poll')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPollForm(false)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {pollsLoading && <SkeletonLoader count={3} type="card" />}
                {!pollsLoading && pollsError && <AlertMessage message={pollsError} />}
                {!pollsLoading && !pollsError && polls.length > 0 && (
                  <SearchInput
                    name="poll_search"
                    placeholder={t('polls_voting')}
                    value={pollSearch}
                    onChange={(e) => setPollSearch(e.target.value)}
                    className="w-full md:max-w-sm"
                  />
                )}
                {!pollsLoading && !pollsError && polls.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-500">{t('polls_empty')}</p>
                  </div>
                )}
                {!pollsLoading && !pollsError && polls.length > 0 && (() => {
                  const filtered = pollSearch.trim()
                    ? polls.filter((p) => p.title?.toLowerCase().includes(pollSearch.toLowerCase()))
                    : polls;
                  return filtered.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('polls_empty')}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filtered.map((poll) => (
                        <PollCard key={poll.id} poll={poll} variant="grid" />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'tab_suggestions' && (
              <div className="space-y-4">
                {!isActiveMember && organization.isPublic && <AlertMessage message={t('members_only_gate')} />}

                {isActiveMember && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSuggestionForm((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors mb-3"
                    >
                      {showSuggestionForm ? <ChevronUpIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                      {t('create_suggestion')}
                    </button>

                    {showSuggestionForm && (
                      <form onSubmit={handleCreateSuggestion} className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4 mb-4">
                        <p className="text-sm font-semibold text-purple-800">{t('create_suggestion')}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">{t('suggestion_type')}</label>
                            <select
                              value={suggestionForm.type}
                              onChange={(e) => setSuggestionForm((prev) => ({ ...prev, type: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            >
                              {ORG_SUGGESTION_TYPES.map((type) => (
                                <option key={type} value={type}>{t(`suggestion_type_${type}`)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">{t('suggestion_visibility')}</label>
                            <select
                              value={suggestionForm.visibility}
                              onChange={(e) => setSuggestionForm((prev) => ({ ...prev, visibility: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            >
                              {ORG_VISIBILITY_OPTIONS.map((visibility) => (
                                <option key={visibility} value={visibility}>{t(`visibility_${visibility}`)}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={suggestionForm.title}
                          onChange={(e) => setSuggestionForm((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder={t('suggestion_title')}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={suggestionForm.body}
                          onChange={(e) => setSuggestionForm((prev) => ({ ...prev, body: e.target.value }))}
                          placeholder={t('suggestion_body')}
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={contentActionLoading}
                            className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                          >
                            {t('create_suggestion')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSuggestionForm(false)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {suggestionsLoading && <SkeletonLoader count={3} type="card" />}
                {!suggestionsLoading && suggestionsError && <AlertMessage message={suggestionsError} />}
                {!suggestionsLoading && !suggestionsError && suggestions.length > 0 && (
                  <SearchInput
                    name="suggestion_search"
                    placeholder={t('suggestions')}
                    value={suggestionSearch}
                    onChange={(e) => setSuggestionSearch(e.target.value)}
                    className="w-full md:max-w-sm"
                  />
                )}
                {!suggestionsLoading && !suggestionsError && suggestions.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <BuildingOffice2Icon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">{t('suggestions_empty')}</p>
                  </div>
                )}
                {!suggestionsLoading && !suggestionsError && suggestions.length > 0 && (() => {
                  const filtered = suggestionSearch.trim()
                    ? suggestions.filter((s) => s.title?.toLowerCase().includes(suggestionSearch.toLowerCase()))
                    : suggestions;
                  return filtered.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('suggestions_empty')}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filtered.map((suggestion) => (
                        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'tab_analytics' && (
              <div className="space-y-4">
                {analyticsLoading && <SkeletonLoader count={3} type="table" />}
                {!analyticsLoading && analyticsError && <AlertMessage message={analyticsError} />}
                {!analyticsLoading && !analyticsError && analytics.length === 0 && (
                  <p className="text-sm text-gray-500">{t('analytics_empty')}</p>
                )}
                {!analyticsLoading && !analyticsError && analytics.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left">{t('analytics_date')}</th>
                          <th className="px-3 py-2 text-left">{t('analytics_members')}</th>
                          <th className="px-3 py-2 text-left">{t('analytics_active_members')}</th>
                          <th className="px-3 py-2 text-left">{t('analytics_polls')}</th>
                          <th className="px-3 py-2 text-left">{t('analytics_suggestions')}</th>
                          <th className="px-3 py-2 text-left">{t('analytics_official_posts')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100">
                            <td className="px-3 py-2">{row.date}</td>
                            <td className="px-3 py-2">{row.memberCount}</td>
                            <td className="px-3 py-2">{row.activeMemberCount}</td>
                            <td className="px-3 py-2">{row.pollCount}</td>
                            <td className="px-3 py-2">{row.suggestionCount}</td>
                            <td className="px-3 py-2">{row.officialPostCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tab_official_posts' && (
              <div className="space-y-4">
                {!supportsOfficialPosts && <AlertMessage message={t('official_posts_not_supported')} />}

                {supportsOfficialPosts && canCreateOfficialPosts && (
                  <form onSubmit={handleCreateOfficialPost} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">{t('create_official_post')}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">{t('official_post_type')}</label>
                        <select
                          value={officialPostForm.contentType}
                          onChange={(e) => setOfficialPostForm((prev) => ({ ...prev, contentType: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="suggestion">{t('official_post_type_suggestion')}</option>
                          <option value="poll">{t('official_post_type_poll')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">{t('official_post_scope')}</label>
                        <select
                          value={officialPostForm.officialPostScope}
                          onChange={(e) => setOfficialPostForm((prev) => ({ ...prev, officialPostScope: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="platform">{t('official_post_scope_platform')}</option>
                          <option value="organization">{t('official_post_scope_organization')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">{t('official_post_visibility')}</label>
                        <select
                          value={officialPostForm.visibility}
                          onChange={(e) => setOfficialPostForm((prev) => ({ ...prev, visibility: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          {ORG_VISIBILITY_OPTIONS.map((visibility) => (
                            <option key={visibility} value={visibility}>{t(`visibility_${visibility}`)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={officialPostForm.title}
                      onChange={(e) => setOfficialPostForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder={t('official_post_title')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={officialPostForm.body}
                      onChange={(e) => setOfficialPostForm((prev) => ({ ...prev, body: e.target.value }))}
                      placeholder={t('official_post_body')}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={contentActionLoading}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {t('create_official_post')}
                    </button>
                  </form>
                )}

                {supportsOfficialPosts && !canCreateOfficialPosts && (
                  <AlertMessage message={t('official_posts_manage_gate')} />
                )}

                {supportsOfficialPosts && officialPostsLoading && <SkeletonLoader count={3} type="list" />}
                {supportsOfficialPosts && !officialPostsLoading && officialPostsError && <AlertMessage message={officialPostsError} />}
                {supportsOfficialPosts && !officialPostsLoading && !officialPostsError && officialPosts.length === 0 && (
                  <p className="text-sm text-gray-500">{t('official_posts_empty')}</p>
                )}
                {supportsOfficialPosts && !officialPostsLoading && !officialPostsError && officialPosts.length > 0 && (
                  <div className="space-y-3">
                    {officialPosts.map((post) => (
                      <div key={`${post.contentType}-${post.id}`} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-gray-900">{post.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                              {t(`official_post_type_${post.contentType}`)}
                            </span>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              {t(`official_post_scope_${post.officialPostScope || 'platform'}`)}
                            </span>
                            <span className={`rounded px-2 py-0.5 text-xs ${post.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {t(`visibility_${post.visibility || 'public'}`)}
                            </span>
                          </div>
                        </div>
                        {post.body && <p className="mt-2 text-sm text-gray-700">{post.body}</p>}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <BuildingOffice2Icon className="h-3.5 w-3.5" />
                          <span className="font-medium">{post.organization?.name || organization?.name}</span>
                          {post.createdAt && (
                            <span className="text-gray-400">· {new Date(post.createdAt).toLocaleDateString('el-GR')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
