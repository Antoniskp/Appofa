'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';
import { useAdminQueues } from '@/hooks/useAdminQueues';
import { getVisibleAdminNavSections } from './adminNav';

function AdminQueueBadge({ count }) {
  const t = useTranslations('adminWorkspace');
  if (count === null) return <span className="ml-auto text-amber-700" title={t('unavailable')}>!</span>;
  if (!count || count < 1) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-red-700"
      aria-label={t('pendingCount', { count })}
      title={t('pendingCount', { count })}
    >
      {label}
    </span>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations('adminWorkspace');
  const { data: queueCounts } = useAdminQueues(user?.role);
  const navSections = getVisibleAdminNavSections(user?.role);

  const activeHref = navSections.flatMap((section) => section.items)
    .filter(({ href }) => pathname === href || (href !== '/admin' && pathname.startsWith(href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const navContent = (
    <nav className="flex flex-col gap-4 p-3" aria-label={t('navigation')}>
      {navSections.map((section) => {
        return (
          <div key={t(`nav.${section.label.replace(/[^a-zA-Z]/g, '')}`)}>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {t(`nav.${section.label.replace(/[^a-zA-Z]/g, '')}`)}
            </div>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="truncate">{t(`nav.${item.label.replace(/[^a-zA-Z]/g, '')}`)}</span>
                    <AdminQueueBadge count={queueCounts[item.href]} />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          aria-label={t('toggleNavigation')} aria-expanded={mobileOpen}
        >
          {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-30 h-screen
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        overflow-y-auto
      `}>
        <div className="p-4 border-b border-gray-200">
          <Link href="/admin" className="text-lg font-bold text-gray-900" onClick={() => setMobileOpen(false)}>
            {t('admin')}
          </Link>
        </div>
        {navContent}
      </aside>
    </>
  );
}
