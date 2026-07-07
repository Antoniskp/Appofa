'use client';

import Link from 'next/link';
import {
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  NewspaperIcon,
  PlusCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { saveReturnTo } from '@/lib/auth-redirect';

const statToneClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
};

const guestBenefits = [
  'Κράτησε την περιοχή σου στο προφίλ',
  'Λάβε ενημερώσεις για νέες ψηφοφορίες και προτάσεις',
  'Χτίσε δημόσια παρουσία με τοπική συμμετοχή',
];

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
      className={`flex min-h-[64px] w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-default disabled:opacity-70 ${statToneClasses[tone]}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-current/20 bg-white/70">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-gray-600">
          <span className="font-semibold text-gray-900">{disabled ? '-' : value}</span> {helper}
        </span>
      </span>
    </button>
  );
}

function GuestLocationBridge({ counts }) {
  const hasActivity = counts.polls > 0 || counts.suggestions > 0 || counts.news > 0 || counts.articles > 0;
  const handleAuthClick = () => saveReturnTo();

  return (
    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700">
            <BellAlertIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-950">
              {hasActivity
                ? 'Μην χάσεις όσα αλλάζουν σε αυτή την περιοχή.'
                : 'Γίνε από τους πρώτους που θα ενεργοποιήσουν αυτή την περιοχή.'}
            </p>
            <div className="mt-2 grid gap-2 text-sm text-emerald-900 md:grid-cols-3">
              {guestBenefits.map((benefit) => (
                <span key={benefit} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{benefit}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            href="/register"
            onClick={handleAuthClick}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            <UserPlusIcon className="h-4 w-4" />
            Εγγραφή και επιλογή περιοχής
          </Link>
          <Link
            href="/newsletter"
            className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Ενημερώσεις email
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LocationActionSummary({ counts, loading, isAuthenticated, onTabSelect }) {
  const contentCount = counts.news + counts.articles;
  const stats = [
    {
      label: 'Ψηφοφορίες',
      value: counts.polls,
      helper: 'ενεργές',
      icon: ClipboardDocumentListIcon,
      tone: 'blue',
      tab: 'polls',
    },
    {
      label: 'Προτάσεις',
      value: counts.suggestions,
      helper: 'ανοιχτές',
      icon: ChatBubbleLeftRightIcon,
      tone: 'emerald',
      tab: 'suggestions',
    },
    {
      label: 'Νέα και άρθρα',
      value: contentCount,
      helper: `σύνολο (${counts.news} ειδήσεις, ${counts.articles} άρθρα)`,
      icon: NewspaperIcon,
      tone: 'purple',
      tab: counts.news > 0 ? 'news' : 'articles',
    },
    {
      label: 'Τοπικοί χρήστες',
      value: counts.users,
      helper: 'συνδεδεμένοι',
      icon: UserGroupIcon,
      tone: 'slate',
      tab: 'users',
    },
  ];

  return (
    <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Τοπική δραστηριότητα</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Τι συμβαίνει εδώ τώρα;</h2>
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
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <SummaryStat
            key={stat.label}
            {...stat}
            disabled={loading}
            onTabSelect={onTabSelect}
          />
        ))}
      </div>
      {!isAuthenticated && <GuestLocationBridge counts={counts} />}
    </section>
  );
}
