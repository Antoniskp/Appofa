'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { notificationAPI } from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import PushNotificationEnable from '@/components/notifications/PushNotificationEnable';

function relativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'μόλις τώρα';
  if (mins < 60) return `${mins} λεπτά πριν`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ώρ${hours === 1 ? 'α' : 'ες'} πριν`;
  const days = Math.floor(hours / 24);
  return `${days} μέρ${days === 1 ? 'α' : 'ες'} πριν`;
}

const TYPE_ICONS = {
  article_approved: '📰', article_commented: '💬', article_liked: '❤️',
  new_follower: '👤', badge_earned: '🏆', endorsement_received: '🤝',
  poll_result: '📊', mention: '@', report_resolved: '✅', system_announcement: '📣',
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ page, limit: 20, unreadOnly });
      setNotifications(res.data?.notifications ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }, [user, page, unreadOnly]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Keep unread count in sync
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      } catch {
        // silently fail
      }
    }
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const totalPages = Math.ceil(total / 20);

  if (authLoading) {
    return (
      <div className="app-container py-8">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-container py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <BellIcon className="h-7 w-7" />
          Ειδοποιήσεις
        </h1>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          Μαρκάρισμα όλων
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setUnreadOnly(false); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !unreadOnly ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Όλες
        </button>
        <button
          type="button"
          onClick={() => { setUnreadOnly(true); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            unreadOnly ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Αδιάβαστες
        </button>
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-50 rounded-lg h-16 border border-gray-100" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BellIcon className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-base">
              {unreadOnly ? 'Δεν έχεις αδιάβαστες ειδοποιήσεις' : 'Δεν έχεις ειδοποιήσεις'}
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`group relative flex gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors hover:bg-seafoam/20 ${
                !n.isRead
                  ? 'border-blue-200 bg-blue-50 border-l-4 border-l-blue-500'
                  : 'border-gray-100 bg-white'
              }`}
              onClick={() => handleClick(n)}
            >
              <span className="text-xl leading-none mt-1" aria-hidden="true">
                {TYPE_ICONS[n.type] || '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'font-semibold text-blue-900' : 'text-gray-800'}`}>
                  {n.title}
                </p>
                {n.body && <p className="text-xs text-gray-500 truncate">{n.body}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{relativeTime(n.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(e, n.id)}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                aria-label="Διαγραφή ειδοποίησης"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Notification preferences */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 list-none">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            Ρυθμίσεις ειδοποιήσεων
          </summary>
          <div className="mt-4">
            {/* Enable push / Home Screen badge (iOS PWA user-gesture flow) */}
            <PushNotificationEnable />
            <div className="mt-6">
              <NotificationPreferences />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
