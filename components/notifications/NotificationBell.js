'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// Simple relative time helper (Greek locale)
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

// Type icon mapping
function typeIcon(type) {
  const icons = {
    article_approved: '📰',
    article_commented: '💬',
    article_liked: '❤️',
    new_follower: '👤',
    badge_earned: '🏆',
    endorsement_received: '🤝',
    poll_result: '📊',
    mention: '@',
    report_resolved: '✅',
    system_announcement: '📣',
  };
  return icons[type] || '🔔';
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const router = useRouter();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data?.count ?? 0);
    } catch {
      // silently fail
    }
  }, []);

  // Poll unread count every 30s and on window focus
  useEffect(() => {
    if (!user) {
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(() => {});
      }
      return;
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    window.addEventListener('focus', fetchUnreadCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchUnreadCount);
    };
  }, [fetchUnreadCount, user]);

  // Update PWA app icon badge whenever unread count changes
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return;
    if (unreadCount > 0) {
      navigator.setAppBadge(unreadCount).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [unreadCount]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    notificationAPI.getAll({ limit: 8 })
      .then(res => setNotifications(res.data?.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    setIsOpen(false);
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch {
        // silently fail
      }
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // silently fail
    }
  };

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 text-blue-900 hover:text-blue-700 hover:bg-seafoam/40 rounded-md transition-colors"
        aria-label={`Ειδοποιήσεις${unreadCount > 0 ? ` (${unreadCount} αδιάβαστες)` : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {displayCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-30 mt-2 w-80 rounded-md border border-seafoam bg-white shadow-lg"
          role="dialog"
          aria-label="Ειδοποιήσεις"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-seafoam px-4 py-2">
            <span className="text-sm font-semibold text-blue-900">Ειδοποιήσεις</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Μαρκάρισμα όλων
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <BellIcon className="h-8 w-8 mb-2 opacity-40" />
                <span className="text-sm">Δεν έχεις ειδοποιήσεις</span>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-seafoam/30 transition-colors ${
                    !n.isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <span className="text-lg leading-none mt-0.5" aria-hidden="true">
                    {typeIcon(n.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.isRead ? 'font-semibold text-blue-900' : 'text-gray-800'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-gray-500 truncate">{n.body}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{relativeTime(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-seafoam px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Δες όλες τις ειδοποιήσεις →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
