'use client';

import Link from 'next/link';
import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  NewspaperIcon,
  PlusCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

const statToneClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
};

function SummaryStat({ label, value, helper, icon: Icon, tone, tab, onTabSelect, disabled }) {
  const handleClick = () => {
    if (disabled || !tab) return;
    onTabSelect(tab);
    document.getElementById('location-content')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !tab}
      className={`flex min-h-[96px] w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors disabled:cursor-default disabled:opacity-70 ${statToneClasses[tone]}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold leading-none text-gray-900">{disabled ? '-' : value}</span>
        <span className="mt-1 block text-sm font-semibold text-gray-900">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-gray-600">{helper}</span>
      </span>
    </button>
  );
}

export default function LocationActionSummary({ counts, loading, isAuthenticated, onTabSelect }) {
  const contentCount = counts.news + counts.articles;
  const stats = [
    {
      label: 'Ψηφοφορίες',
      value: counts.polls,
      helper: 'ενεργές για αυτή την περιοχή',
      icon: ClipboardDocumentListIcon,
      tone: 'blue',
      tab: 'polls',
    },
    {
      label: 'Προτάσεις',
      value: counts.suggestions,
      helper: 'ιδέες και προβλήματα πολιτών',
      icon: ChatBubbleLeftRightIcon,
      tone: 'emerald',
      tab: 'suggestions',
    },
    {
      label: 'Νέα και άρθρα',
      value: contentCount,
      helper: `${counts.news} ειδήσεις, ${counts.articles} άρθρα`,
      icon: NewspaperIcon,
      tone: 'purple',
      tab: counts.news > 0 ? 'news' : 'articles',
    },
    {
      label: 'Τοπικοί χρήστες',
      value: counts.users,
      helper: 'μέλη που συνδέονται με την περιοχή',
      icon: UserGroupIcon,
      tone: 'slate',
      tab: 'users',
    },
  ];

  return (
    <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Τοπική δραστηριότητα</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Τι συμβαίνει εδώ τώρα;</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Γρήγορη εικόνα για ψηφοφορίες, προτάσεις, περιεχόμενο και ανθρώπους που συνδέονται με αυτή την περιοχή.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAuthenticated ? (
            <>
              <Link
                href="/polls/create"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <PlusCircleIcon className="h-5 w-5" />
                Νέα ψηφοφορία
              </Link>
              <Link
                href="/suggestions/new"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
                Νέα πρόταση
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <UserPlusIcon className="h-5 w-5" />
                Εγγραφή
              </Link>
              <Link
                href="/polls?voteRestriction=anyone"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
                Ψήφος χωρίς εγγραφή
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <SummaryStat
            key={stat.label}
            {...stat}
            disabled={loading}
            onTabSelect={onTabSelect}
          />
        ))}
      </div>
    </section>
  );
}
