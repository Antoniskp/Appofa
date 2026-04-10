'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon, PencilSquareIcon, MapPinIcon, EnvelopeIcon,
  UserGroupIcon, XCircleIcon, FlagIcon, StarIcon, PhotoIcon, HeartIcon,
  Bars3Icon, XMarkIcon, DocumentTextIcon, ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: HomeIcon },
  { href: '/editor', label: 'Create Article', icon: PencilSquareIcon },
  { href: '/admin/locations', label: 'Locations', icon: MapPinIcon },
  { href: '/admin/messages', label: 'Messages', icon: EnvelopeIcon },
  { href: '/admin/persons', label: 'Persons', icon: UserGroupIcon },
  { href: '/admin/manifests', label: 'Manifests', icon: DocumentTextIcon },
  { href: '/admin/removal-requests', label: 'Removals', icon: XCircleIcon },
  { href: '/admin/reports', label: 'Reports', icon: FlagIcon },
  { href: '/admin/dream-team', label: 'Dream Team', icon: StarIcon },
  { href: '/admin/hero', label: 'Hero Settings', icon: PhotoIcon },
  { href: '/admin/ip-rules', label: 'IP Rules', icon: ShieldExclamationIcon },
  { href: '/admin/status', label: 'System Health', icon: HeartIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const navContent = (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map(item => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          aria-label="Toggle admin navigation"
        >
          {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile: slide-in overlay, desktop: static */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-30 h-screen
        w-56 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        overflow-y-auto
      `}>
        <div className="p-4 border-b border-gray-200">
          <Link href="/admin" className="text-lg font-bold text-gray-900" onClick={() => setMobileOpen(false)}>
            ⚙️ Admin
          </Link>
        </div>
        {navContent}
      </aside>
    </>
  );
}
