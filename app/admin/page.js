'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, CheckIcon, TrashIcon, PencilIcon, DocumentTextIcon, UserGroupIcon, NewspaperIcon, ArchiveBoxIcon, ShieldCheckIcon, UserIcon, MapPinIcon, EnvelopeIcon, XCircleIcon, FlagIcon, StarIcon, PhotoIcon, HeartIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI, authAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Card, { StatsCard } from '@/components/ui/Card';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import AdminTable from '@/components/admin/AdminTable';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import { TooltipIconButton } from '@/components/ui/Tooltip';
import Tooltip from '@/components/ui/Tooltip';
import Pagination from '@/components/ui/Pagination';
import articleCategories from '@/config/articleCategories.json';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLayout from '@/components/admin/AdminLayout';

function AdminDashboardContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    pendingNews: 0,
  });
  const [userStats, setUserStats] = useState({
    total: 0,
    byRole: {
      admin: 0,
      moderator: 0,
      editor: 0,
      viewer: 0,
    },
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [moderatorLocationOverrides, setModeratorLocationOverrides] = useState({});
  const [verifyingUserId, setVerifyingUserId] = useState(null);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [roleChangeNewRole, setRoleChangeNewRole] = useState('');
  const [selectedLocationForRole, setSelectedLocationForRole] = useState('');
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [sortBy, setSortBy] = useState('lastModified'); // 'lastModified' | 'title' | 'createdAt'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 20;
  const articlesTableRef = useRef(null);

  const { data: articles, loading, refetch } = useAsyncData(
    async () => {
      let orderBy = 'updatedAt';
      if (sortBy === 'title') orderBy = 'title';
      else if (sortBy === 'createdAt') orderBy = 'createdAt';
      
      const params = {
        page,
        limit: 20,
        orderBy,
        order: sortOrder
      };
      
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      
      const response = await articleAPI.getAll(params);
      if (response.success) {
        const allArticles = response.data.articles || [];
        // Update total pages for pagination and accurate total from server
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setStats(prev => ({
            ...prev,
            total: response.data.pagination.totalItems ?? response.data.pagination.total ?? allArticles.length,
          }));
        }
        return allArticles;
      }
      return [];
    },
    [sortBy, sortOrder, statusFilter, categoryFilter, page],
    {
      initialData: [],
      transform: (allArticles) => {
        // Per-page status breakdown (reflects the current page only)
        setStats(prev => ({
          ...prev,
          published: allArticles.filter(a => a.status === 'published').length,
          draft: allArticles.filter(a => a.status === 'draft').length,
          archived: allArticles.filter(a => a.status === 'archived').length,
          pendingNews: allArticles.filter(a => a.isNews && !a.newsApprovedAt).length,
        }));
        return allArticles;
      },
      onError: (error) => {
        console.error('Failed to fetch articles:', error);
      }
    }
  );

  const { data: users, loading: usersLoading, refetch: refetchUsers } = useAsyncData(
    async () => {
      const usersResponse = await authAPI.getUsers();
      if (usersResponse.success) {
        return usersResponse;
      }
      return { data: { users: [], stats: null } };
    },
    [],
    {
      initialData: [],
      transform: (response) => {
        const usersList = response.data.users || [];
        if (response.data.stats) {
          setUserStats(response.data.stats);
        }
        return usersList;
      },
      onError: (error) => {
        console.error('Failed to fetch users:', error);
      }
    }
  );

  const filteredUsers = useMemo(() => {
    let result = users || [];

    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase().trim();
      result = result.filter(u =>
        u.username?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.firstNameNative?.toLowerCase().includes(query) ||
        u.lastNameNative?.toLowerCase().includes(query) ||
        `${u.firstNameNative || ''} ${u.lastNameNative || ''}`.toLowerCase().includes(query)
      );
    }

    if (userRoleFilter) {
      result = result.filter(u => u.role === userRoleFilter);
    }

    return result;
  }, [users, userSearchQuery, userRoleFilter]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * USERS_PER_PAGE,
    userPage * USERS_PER_PAGE
  );

  const { data: locations } = useAsyncData(
    async () => {
      const response = await locationAPI.getAll({ limit: 500 });
      if (response.success) {
        return response.locations || [];
      }
      return [];
    },
    [],
    {
      initialData: [],
      onError: (error) => {
        console.error('Failed to fetch locations:', error);
      }
    }
  );

  const handleDelete = async () => {
    if (!selectedArticle) return;
    
    try {
      await articleAPI.delete(selectedArticle.id);
      refetch();
      addToast('Article deleted successfully', { type: 'success' });
    } catch (error) {
      addToast(`Failed to delete article: ${error.message}`, { type: 'error' });
    }
  };

  const handleApproveNews = async () => {
    if (!selectedArticle) return;
    
    try {
      const response = await articleAPI.approveNews(selectedArticle.id);
      if (response.success) {
        refetch();
        addToast('News approved and published successfully!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Failed to approve news: ${error.message}`, { type: 'error' });
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (newRole === 'moderator') {
      // Open dialog to pick a location instead of window.prompt
      setRoleChangeTarget(targetUser);
      setRoleChangeNewRole(newRole);
      const defaultLocationId = targetUser.homeLocationId ? String(targetUser.homeLocationId) : '';
      setSelectedLocationForRole(defaultLocationId);
      setRoleChangeDialogOpen(true);
      return;
    }

    try {
      const response = await authAPI.updateUserRole(targetUser.id, newRole);
      if (response.success) {
        await refetchUsers();
        addToast('User role updated successfully!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Failed to update user role: ${error.message}`, { type: 'error' });
    }
  };

  const confirmRoleChange = async () => {
    if (!roleChangeTarget || !roleChangeNewRole) return;

    let locationId;
    if (roleChangeNewRole === 'moderator') {
      const parsed = Number.parseInt(selectedLocationForRole, 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        addToast('Valid location is required for moderator role.', { type: 'error' });
        return;
      }
      locationId = parsed;
    }

    setRoleChangeDialogOpen(false);
    try {
      const response = await authAPI.updateUserRole(roleChangeTarget.id, roleChangeNewRole, locationId);
      if (response.success) {
        await refetchUsers();
        addToast('User role updated successfully!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Failed to update user role: ${error.message}`, { type: 'error' });
    } finally {
      setRoleChangeTarget(null);
      setRoleChangeNewRole('');
      setSelectedLocationForRole('');
    }
  };

  const handleModeratorLocationChange = async (targetUser, nextLocationId) => {
    const parsed = Number.parseInt(nextLocationId, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      addToast('Please select a valid location.', { type: 'error' });
      return;
    }

    try {
      const response = await authAPI.updateUserRole(targetUser.id, 'moderator', parsed);
      if (response.success) {
        setModeratorLocationOverrides((previous) => ({
          ...previous,
          [targetUser.id]: parsed
        }));
        await refetchUsers();
        addToast('Moderator location updated successfully!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Failed to update moderator location: ${error.message}`, { type: 'error' });
    }
  };

  const getModeratorLocationOptions = (targetUser) => {
    const baseLocations = Array.isArray(locations) ? locations : [];
    const overriddenLocationId = moderatorLocationOverrides[targetUser?.id];
    const effectiveHomeLocationId = overriddenLocationId || targetUser?.homeLocationId;

    if (!effectiveHomeLocationId) {
      return baseLocations;
    }

    const hasCurrentLocation = baseLocations.some(
      (location) => Number(location.id) === Number(effectiveHomeLocationId)
    );

    if (hasCurrentLocation) {
      return baseLocations;
    }

    if (!overriddenLocationId && targetUser.homeLocation?.id && targetUser.homeLocation?.name) {
      return [
        {
          id: targetUser.homeLocation.id,
          name: targetUser.homeLocation.name,
          type: targetUser.homeLocation.type,
          slug: targetUser.homeLocation.slug
        },
        ...baseLocations
      ];
    }

    return [
      {
        id: effectiveHomeLocationId,
        name: `Location #${effectiveHomeLocationId}`
      },
      ...baseLocations
    ];
  };

  // Combine article and news categories from config
  const allCategories = [...new Set([
    ...articleCategories.articleTypes.articles.categories,
    ...articleCategories.articleTypes.news.categories
  ])];

  const handleVerifyUser = async (targetUser, isVerified) => {
    setVerifyingUserId(targetUser.id);
    try {
      const response = await authAPI.verifyUser(targetUser.id, isVerified);
      if (response.success) {
        await refetchUsers();
        addToast(isVerified ? 'User verified successfully!' : 'User unverified successfully!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Failed to update verification: ${error.message}`, { type: 'error' });
    } finally {
      setVerifyingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      await authAPI.adminDeleteUser(deleteUserTarget.id);
      await refetchUsers();
      addToast('User deleted successfully.', { type: 'success' });
    } catch (error) {
      addToast(`Failed to delete user: ${error.message}`, { type: 'error' });
    } finally {
      setDeleteUserDialogOpen(false);
      setDeleteUserTarget(null);
    }
  };

  // Determine if the current user can verify a target user
  const canVerifyUser = (targetUser) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'moderator' && user.homeLocationId && targetUser.homeLocationId) {
      // Optimistic: show button; server will enforce scope
      return true;
    }
    return false;
  };

  // Scroll to top of table when page changes
  useEffect(() => {
    if (articlesTableRef.current) {
      articlesTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);
  return (
    <AdminLayout>
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader title="Admin Dashboard" />

        {/* Welcome Message */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.username}!</h2>
          <p className="text-gray-600">
            You have {user?.role} access. You can {user?.role === 'admin' ? 'create, edit, and delete all articles' : 'approve news submissions and manage content'}.
          </p>
        </Card>

        {/* Article Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Articles"
            value={stats.total}
            icon={DocumentTextIcon}
          />
          <StatsCard
            title="Published"
            value={stats.published}
            icon={CheckIcon}
          />
          <StatsCard
            title="Drafts"
            value={stats.draft}
            icon={PencilIcon}
          />
          <StatsCard
            title="Archived"
            value={stats.archived}
            icon={ArchiveBoxIcon}
          />
          <StatsCard
            title="Pending News"
            value={stats.pendingNews}
            icon={NewspaperIcon}
            variant="elevated"
          />
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={userStats.total}
            icon={UserGroupIcon}
          />
          <StatsCard
            title="Admins"
            value={userStats.byRole.admin}
            icon={ShieldCheckIcon}
          />
          <StatsCard
            title="Moderators"
            value={userStats.byRole.moderator}
            icon={UserIcon}
          />
          <StatsCard
            title="Editors"
            value={userStats.byRole.editor}
            icon={UserIcon}
          />
          <StatsCard
            title="Viewers"
            value={userStats.byRole.viewer}
            icon={UserIcon}
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { href: '/editor', label: 'Create Article', icon: PencilSquareIcon },
              { href: '/articles', label: 'View Articles', icon: DocumentTextIcon },
              { href: '/admin/locations', label: 'Manage Locations', icon: MapPinIcon },
              { href: '/admin/messages', label: 'Manage Messages', icon: EnvelopeIcon },
              { href: '/admin/persons', label: 'Manage Persons', icon: UserGroupIcon },
              { href: '/admin/removal-requests', label: 'Removal Requests', icon: XCircleIcon },
              { href: '/admin/reports', label: 'Reports', icon: FlagIcon },
              { href: '/admin/dream-team', label: 'Dream Team', icon: StarIcon },
              { href: '/admin/manifests', label: 'Manage Manifests', icon: DocumentTextIcon },
              { href: '/admin/hero', label: 'Hero Settings', icon: PhotoIcon },
              { href: '/admin/status', label: 'System Health', icon: HeartIcon },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
              >
                <action.icon className="h-8 w-8 text-gray-500 group-hover:text-blue-600 transition" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Articles Table */}
        <Card 
          ref={articlesTableRef}
          className="overflow-hidden"
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl font-semibold">All Articles</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  id="statusFilter"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                
                <select
                  id="categoryFilter"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Categories</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <label htmlFor="sortBy" className="text-sm mr-1">Sort by:</label>
                <select
                  id="sortBy"
                  className="border rounded px-2 py-1 text-sm"
                  value={sortBy}
                  onChange={e => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="lastModified">Last Modified</option>
                  <option value="createdAt">Created Date</option>
                  <option value="title">Alphabetical</option>
                </select>
                <button
                  className="ml-1 px-2 py-1 border rounded text-sm"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    setPage(1);
                  }}
                  aria-label="Toggle sort order"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          }
        >
          
          <AdminTable
            columns={[
              {
                key: 'actions',
                header: 'Actions',
                width: 'w-24',
                render: (article) => (
                  <div className="flex gap-2 items-center justify-end">
                    <TooltipIconButton
                      icon={EyeIcon}
                      tooltip="Προβολή άρθρου"
                      onClick={() => router.push(article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`)}
                    />
                    {article.isNews && !article.newsApprovedAt && (
                      <TooltipIconButton
                        icon={CheckIcon}
                        tooltip="Έγκριση άρθρου"
                        onClick={() => {
                          setSelectedArticle(article);
                          setApproveDialogOpen(true);
                        }}
                        variant="primary"
                      />
                    )}
                    <TooltipIconButton
                      icon={TrashIcon}
                      tooltip="Διαγραφή άρθρου"
                      onClick={() => {
                        setSelectedArticle(article);
                        setDeleteDialogOpen(true);
                      }}
                      variant="danger"
                    />
                  </div>
                )
              },
              {
                key: 'title',
                header: 'Title',
                className: 'whitespace-normal',
                render: (article) => (
                  <Link
                    href={article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`}
                    className="text-blue-600 hover:text-blue-800 line-clamp-2 block"
                    title={article.title}
                  >
                    {article.title}
                  </Link>
                )
              },
              {
                key: 'author',
                header: 'Author',
                width: 'w-28',
                render: (article) => (article.hideAuthor ? 'Anonymous' : (article.author?.username || 'Unknown'))
              },
              {
                key: 'status',
                header: 'Status',
                width: 'w-24',
                render: (article) => <StatusBadge status={article.status} />
              },
              {
                key: 'newsStatus',
                header: 'News Status',
                width: 'w-28',
                render: (article) => (
                  article.isNews ? (
                    <Badge variant={article.newsApprovedAt ? 'success' : 'warning'}>
                      {article.newsApprovedAt ? '✓ Approved' : '⏳ Pending'}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )
                )
              },
              {
                key: 'category',
                header: 'Category',
                width: 'w-32',
                render: (article) => article.category || '-'
              },
              {
                key: 'tags',
                header: 'Tags',
                width: 'w-40',
                render: (article) => Array.isArray(article.tags) && article.tags.length > 0 ? article.tags.join(', ') : '-'
              },
              {
                key: 'createdAt',
                header: 'Created',
                width: 'w-28',
                render: (article) => new Date(article.createdAt).toLocaleDateString()
              }
            ]}
            data={articles}
            loading={loading}
            emptyMessage="No articles found."
            actions={false}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onPrevious={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
          />
        </Card>

        {/* Users Table */}
        <Card 
          className="overflow-hidden mt-8"
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl font-semibold">
                Users {filteredUsers.length !== (users || []).length && (
                  <span className="text-sm font-normal text-gray-500">
                    ({filteredUsers.length} of {(users || []).length})
                  </span>
                )}
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setUserPage(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
          }
        >

          <AdminTable
            columns={[
              {
                key: 'username',
                header: 'Username',
              },
              {
                key: 'email',
                header: 'Email',
              },
              {
                key: 'name',
                header: 'Name',
                render: (user) => [user.firstNameNative, user.lastNameNative].filter(Boolean).join(' ') || '-'
              },
              {
                key: 'role',
                header: 'Role',
                render: (user) => (
                  <Tooltip content="Αλλαγή ρόλου χρήστη" position="top">
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user, event.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </Tooltip>
                )
              },
              {
                key: 'moderationLocation',
                header: 'Moderator Location',
                render: (user) => {
                  if (user.role !== 'moderator') {
                    return '-';
                  }

                  const locationOptions = getModeratorLocationOptions(user);
                  const selectedLocationId = moderatorLocationOverrides[user.id] || user.homeLocationId;

                  return (
                    <select
                      value={selectedLocationId ? String(selectedLocationId) : ''}
                      onChange={(event) => handleModeratorLocationChange(user, event.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm max-w-[220px]"
                    >
                      <option value="">Select location</option>
                      {locationOptions.map((location) => (
                        <option key={location.id} value={String(location.id)}>
                          {location.name} (#{location.id})
                        </option>
                      ))}
                    </select>
                  );
                }
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (user) => new Date(user.createdAt).toLocaleDateString()
              },
              {
                key: 'verified',
                header: 'Verified',
                render: (targetUser) => {
                  if (!canVerifyUser(targetUser)) {
                    return targetUser.isVerified ? '✓' : '-';
                  }
                  return (
                    <button
                      onClick={() => handleVerifyUser(targetUser, !targetUser.isVerified)}
                      disabled={verifyingUserId === targetUser.id}
                      className={`px-2 py-1 text-xs rounded border transition ${
                        targetUser.isVerified
                          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {verifyingUserId === targetUser.id
                        ? '...'
                        : targetUser.isVerified ? '✓ Verified' : 'Verify'}
                    </button>
                  );
                }
              },
              {
                key: 'deleteAction',
                header: '',
                width: 'w-12',
                render: (targetUser) => {
                  if (targetUser.role === 'admin' || targetUser.id === user?.id) return null;
                  return (
                    <TooltipIconButton
                      icon={TrashIcon}
                      tooltip="Delete user"
                      onClick={() => {
                        setDeleteUserTarget(targetUser);
                        setDeleteUserDialogOpen(true);
                      }}
                      variant="danger"
                    />
                  );
                }
              }
            ]}
            data={paginatedUsers}
            loading={usersLoading}
            emptyMessage="No users found."
            actions={false}
          />
          <Pagination
            currentPage={userPage}
            totalPages={userTotalPages}
            onPageChange={setUserPage}
            onPrevious={() => setUserPage(p => Math.max(1, p - 1))}
            onNext={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
          />
        </Card>
      </div>

      {/* Role Change Dialog — location picker for moderator role */}
      <Modal
        isOpen={roleChangeDialogOpen}
        onClose={() => {
          setRoleChangeDialogOpen(false);
          setRoleChangeTarget(null);
          setRoleChangeNewRole('');
          setSelectedLocationForRole('');
        }}
        title="Assign Moderator Location"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setRoleChangeDialogOpen(false);
                setRoleChangeTarget(null);
                setRoleChangeNewRole('');
                setSelectedLocationForRole('');
              }}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRoleChange}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Confirm
            </button>
          </>
        }
      >
        <label htmlFor="roleLocationSelect" className="text-gray-700 mb-2 block">
          Select the location this moderator will manage:
        </label>
        <select
          id="roleLocationSelect"
          aria-label="Moderator location"
          value={selectedLocationForRole}
          onChange={(e) => setSelectedLocationForRole(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Select a location</option>
          {(locations ?? []).map((loc) => (
            <option key={loc.id} value={String(loc.id)}>
              {loc.name} (#{loc.id})
            </option>
          ))}
        </select>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteUserDialogOpen}
        onClose={() => { setDeleteUserDialogOpen(false); setDeleteUserTarget(null); }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to permanently delete user "${deleteUserTarget?.username}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Approve News Dialog */}
      <ConfirmDialog
        isOpen={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        onConfirm={handleApproveNews}
        title="Approve News"
        message="Approve this article as news and publish it?"
        confirmText="Approve & Publish"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
    </AdminLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
