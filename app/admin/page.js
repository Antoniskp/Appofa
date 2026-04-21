'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { DocumentTextIcon, UserGroupIcon, ShieldCheckIcon, UserIcon, MapPinIcon, EnvelopeIcon, FlagIcon, StarIcon, PhotoIcon, HeartIcon, UsersIcon, GlobeEuropeAfricaIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI, notificationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Card, { StatsCard } from '@/components/ui/Card';
import { useAsyncData } from '@/hooks/useAsyncData';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLayout from '@/components/admin/AdminLayout';

function AdminDashboardContent() {
  const tAdmin = useTranslations('admin');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    total: 0,
    byRole: {
      admin: 0,
      moderator: 0,
      editor: 0,
      viewer: 0,
    },
  });

  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '', actionUrl: '', targetRole: '' });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null); // { success, message }

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim()) return;
    setBroadcastLoading(true);
    setBroadcastResult(null);
    try {
      const res = await notificationAPI.broadcast({
        title: broadcastForm.title,
        body: broadcastForm.body || undefined,
        actionUrl: broadcastForm.actionUrl || undefined,
        targetRole: broadcastForm.targetRole || undefined,
      });
      setBroadcastResult({ success: true, message: res.data?.message || tAdmin('broadcast_sent_count', { count: res.data?.count ?? 0 }) });
      setBroadcastForm({ title: '', body: '', actionUrl: '', targetRole: '' });
      setTimeout(() => setBroadcastResult(null), 5000);
    } catch (err) {
      setBroadcastResult({ success: false, message: err.message || tAdmin('broadcast_failed') });
    } finally {
      setBroadcastLoading(false);
    }
  };

  useAsyncData(
    async () => {
      const response = await authAPI.getAdminUsers({ page: 1, limit: 1 });
      if (response.success && response.data?.stats) {
        return response.data.stats;
      }
      return null;
    },
    [],
    {
      initialData: null,
      transform: (s) => {
        if (s) setUserStats(s);
        return s;
      },
    }
  );

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminHeader title={tAdmin('title')} />

          {/* Welcome Message */}
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{tAdmin('welcome', { username: user?.username || '' })}</h2>
            <p className="text-gray-600">
              {tAdmin('role_access', {
                role: user?.role || '',
                permissions: user?.role === 'admin' ? tAdmin('role_admin_permissions') : tAdmin('role_moderator_permissions'),
              })}
            </p>
          </Card>

          {/* User Statistics Cards — linked to /admin/users */}
          <Link href="/admin/users" className="block mb-8 group">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <StatsCard
                title={tAdmin('total_users')}
                value={userStats.total}
                icon={UserGroupIcon}
              />
              <StatsCard
                title={tAdmin('admins')}
                value={userStats.byRole.admin}
                icon={ShieldCheckIcon}
              />
              <StatsCard
                title={tAdmin('moderators')}
                value={userStats.byRole.moderator}
                icon={UserIcon}
              />
              <StatsCard
                title={tAdmin('editors')}
                value={userStats.byRole.editor}
                icon={UserIcon}
              />
              <StatsCard
                title={tAdmin('viewers')}
                value={userStats.byRole.viewer}
                icon={UserIcon}
              />
            </div>
          </Link>

          {/* Quick Actions */}
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{tAdmin('quick_actions')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { href: '/admin/users', label: tAdmin('manage_users'), icon: UsersIcon },
                { href: '/admin/articles', label: tAdmin('all_articles'), icon: DocumentTextIcon },
                { href: '/articles', label: tAdmin('view_articles'), icon: DocumentTextIcon },
                { href: '/admin/locations', label: tAdmin('manage_locations'), icon: MapPinIcon },
                { href: '/admin/messages', label: tAdmin('manage_messages'), icon: EnvelopeIcon },
                { href: '/admin/persons', label: tAdmin('manage_persons'), icon: UserGroupIcon },
                { href: '/admin/reports', label: tAdmin('reports'), icon: FlagIcon },
                { href: '/admin/dream-team', label: tAdmin('dream_team'), icon: StarIcon },
                { href: '/admin/manifests', label: tAdmin('manage_manifests'), icon: DocumentTextIcon },
                { href: '/admin/hero', label: tAdmin('hero_settings'), icon: PhotoIcon },
                {
                  href: '/admin/geo',
                  label: tAdmin('geo_countries'),
                  description: tAdmin('geo_countries_description'),
                  icon: GlobeEuropeAfricaIcon,
                },
                { href: '/admin/status', label: tAdmin('system_health'), icon: HeartIcon },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
                >
                  <action.icon className="h-8 w-8 text-gray-500 group-hover:text-blue-600 transition" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 text-center">{action.label}</span>
                  {action.description && (
                    <span className="text-xs text-gray-500 text-center">{action.description}</span>
                  )}
                </Link>
              ))}
            </div>
          </Card>

          {/* Broadcast panel — admin only */}
          {user?.role === 'admin' && (
            <Card className="mt-8" header={<h2 className="text-xl font-semibold flex items-center gap-2">{tAdmin('announcements')}</h2>}>
              <form onSubmit={handleBroadcast} className="space-y-4 max-w-xl">
                <div>
                  <label htmlFor="broadcastTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    {tAdmin('announcement_title')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="broadcastTitle"
                    type="text"
                    maxLength={200}
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={tAdmin('announcement_title_placeholder')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-0.5 text-right" aria-live="polite">{broadcastForm.title.length}/200</p>
                </div>
                <div>
                  <label htmlFor="broadcastBody" className="block text-sm font-medium text-gray-700 mb-1">
                    {tAdmin('announcement_content')} <span className="text-gray-400 text-xs">({tCommon('optional')})</span>
                  </label>
                  <textarea
                    id="broadcastBody"
                    maxLength={500}
                    rows={3}
                    value={broadcastForm.body}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder={tAdmin('announcement_content_placeholder')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-0.5 text-right" aria-live="polite">{broadcastForm.body.length}/500</p>
                </div>
                <div>
                  <label htmlFor="broadcastActionUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    {tAdmin('action_url')} <span className="text-gray-400 text-xs">({tCommon('optional')})</span>
                  </label>
                  <input
                    id="broadcastActionUrl"
                    type="text"
                    value={broadcastForm.actionUrl}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, actionUrl: e.target.value }))}
                    placeholder="/notifications"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="broadcastTargetRole" className="block text-sm font-medium text-gray-700 mb-1">
                    {tAdmin('audience')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="broadcastTargetRole"
                    value={broadcastForm.targetRole}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, targetRole: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{tAdmin('audience_all')}</option>
                    <option value="citizen">{tAdmin('audience_citizens')}</option>
                    <option value="candidate">{tAdmin('audience_candidates')}</option>
                    <option value="admin">{tAdmin('audience_admins')}</option>
                    <option value="moderator">{tAdmin('audience_moderators')}</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={broadcastLoading || !broadcastForm.title.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {broadcastLoading ? tCommon('sending') : tAdmin('send_announcement')}
                  </button>
                  {broadcastResult && (
                    <span className={`text-sm ${broadcastResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {broadcastResult.success ? '✓ ' : '✗ '}{broadcastResult.message}
                    </span>
                  )}
                </div>
              </form>
            </Card>
          )}
        </div>
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
