'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AdjustmentsHorizontalIcon,
  Bars3Icon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FlagIcon,
  GlobeEuropeAfricaIcon,
  HeartIcon,
  HomeIcon,
  IdentificationIcon,
  MapPinIcon,
  PhotoIcon,
  ShieldExclamationIcon,
  StarIcon,
  UserGroupIcon,
  UserMinusIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: HomeIcon },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/users', label: 'Users', icon: UsersIcon },
      { href: '/admin/persons', label: 'Persons', icon: UserGroupIcon },
      { href: '/admin/persons/claims', label: 'Person Claims', icon: IdentificationIcon },
      { href: '/admin/removal-requests', label: 'Removal Requests', icon: UserMinusIcon },
      { href: '/admin/organizations', label: 'Organizations', icon: BuildingOfficeIcon },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/homepage', label: 'Homepage', icon: AdjustmentsHorizontalIcon },
      { href: '/admin/hero', label: 'Hero Settings', icon: PhotoIcon },
      { href: '/admin/articles', label: 'Articles', icon: DocumentTextIcon },
      { href: '/admin/manifests', label: 'Manifests', icon: DocumentTextIcon },
      { href: '/admin/dream-team', label: 'Dream Team', icon: StarIcon },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: FlagIcon },
      { href: '/admin/messages', label: 'Messages', icon: EnvelopeIcon },
      { href: '/admin/newsletter', label: 'Newsletter', icon: EnvelopeIcon },
    ],
  },
  {
    label: 'Locations & Access',
    items: [
      { href: '/admin/locations', label: 'Locations', icon: MapPinIcon },
      { href: '/admin/geo', label: 'Geo & Countries', icon: GlobeEuropeAfricaIcon, adminOnly: true },
      { href: '/admin/ip-rules', label: 'IP Rules', icon: ShieldExclamationIcon, adminOnly: true },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/status', label: 'System Health', icon: HeartIcon, adminOnly: true },
      { href: '/admin/worker-status', label: 'Worker Status', icon: HeartIcon, adminOnly: true },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const navContent = (
    <nav className="flex flex-col gap-4 p-3" aria-label="Admin navigation">
      {navSections.map((section) => {
        const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin);
        if (visibleItems.length === 0) return null;

        return (
          <div key={section.label}>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {section.label}
            </div>
            <div className="flex flex-col gap-1">
              {visibleItems.map((item) => {
                const active = isActive(item.href);
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
                    <span className="truncate">{item.label}</span>
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
          aria-label="Toggle admin navigation"
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
            Admin
          </Link>
        </div>
        {navContent}
      </aside>
    </>
  );
}
