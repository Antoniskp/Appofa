'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  PencilSquareIcon,
  NewspaperIcon,
  ChartBarIcon,
  LightBulbIcon,
  PlusCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { authAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

// Contribution type config
const TYPE_CONFIG = {
  articles: {
    key: 'articles',
    icon: NewspaperIcon,
    createHref: '/articles/create',
    viewHref: '/articles',
    userHref: (id) => `/articles/${id}`,
    colorClass: 'text-blue-600 bg-blue-50',
  },
  polls: {
    key: 'polls',
    icon: ChartBarIcon,
    createHref: '/polls/create',
    viewHref: '/polls',
    userHref: (id) => `/polls/${id}`,
    colorClass: 'text-emerald-600 bg-emerald-50',
  },
  suggestions: {
    key: 'suggestions',
    icon: LightBulbIcon,
    createHref: '/civic-questions/create',
    viewHref: '/suggestions',
    userHref: (id) => `/suggestions/${id}`,
    colorClass: 'text-amber-600 bg-amber-50',
  },
};

const ARTICLE_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-700',
};
const POLL_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
  archived: 'bg-red-100 text-red-700',
};
const SUGGESTION_STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  implemented: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
};

const DEFAULT_STATUS_COLOR = 'bg-gray-100 text-gray-700';

function statusColor(type, status) {
  if (type === 'articles') return ARTICLE_STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
  if (type === 'polls') return POLL_STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
  return SUGGESTION_STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
}

function ContributionList({ type, items = [], total = 0, t, onLoadMore, loading }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <section className="mb-8" aria-labelledby={`section-${type}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-md p-1.5 ${cfg.colorClass}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id={`section-${type}`} className="text-base font-semibold text-gray-800">
            {t(`type_${type}`)}
            <span className="ml-2 text-sm font-normal text-gray-500">({total})</span>
          </h2>
        </div>
        <Link
          href={cfg.createHref}
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <PlusCircleIcon className="h-4 w-4" aria-hidden="true" />
          {t('create_new')}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 pl-1">{t('empty_state', { type: t(`type_${type}`) })}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white overflow-hidden" role="list">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <Link
                  href={cfg.userHref(item.id)}
                  className="font-medium text-gray-900 hover:text-indigo-600 truncate block"
                >
                  {item.title || t('untitled')}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(item.updatedAt || item.createdAt).toLocaleDateString('el-GR')}
                </p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(type, item.status)}`}>
                {t(`status_${type}_${item.status}`) || item.status}
              </span>
              <Link
                href={cfg.userHref(item.id)}
                aria-label={`${t('view')} ${item.title}`}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CreatorWorkspaceContent() {
  const t = useTranslations('creator');
  const { user } = useAuth();

  const { data, loading, error } = useAsyncData(
    async () => {
      if (!user?.id) return null;
      const res = await authAPI.getMyContributions({ type: 'all' });
      if (res.success) return res.data;
      return null;
    },
    [user?.id],
    { initialData: null }
  );

  const articles = data?.articles?.items || [];
  const polls = data?.polls?.items || [];
  const suggestions = data?.suggestions?.items || [];

  const totalContributions =
    (data?.articles?.total || 0) +
    (data?.polls?.total || 0) +
    (data?.suggestions?.total || 0);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AlertMessage type="error" message={t('load_error')} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <PencilSquareIcon className="h-8 w-8 text-indigo-600" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      </div>
      <p className="text-gray-600 mb-6">{t('subtitle')}</p>

      {/* Summary stats */}
      <div
        className="grid grid-cols-3 gap-4 mb-8 text-center"
        role="region"
        aria-label={t('stats_label')}
      >
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-2xl font-bold text-gray-900">{data?.articles?.total ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('type_articles')}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-2xl font-bold text-gray-900">{data?.polls?.total ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('type_polls')}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-2xl font-bold text-gray-900">{data?.suggestions?.total ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('type_suggestions')}</p>
        </div>
      </div>

      {totalContributions === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center mb-8">
          <PencilSquareIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" aria-hidden="true" />
          <p className="text-gray-600 font-medium">{t('no_contributions_title')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('no_contributions_body')}</p>
          <Link
            href="/articles/create"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('create_first_cta')}
          </Link>
        </div>
      )}

      <ContributionList type="articles" items={articles} total={data?.articles?.total ?? 0} t={t} />
      <ContributionList type="polls" items={polls} total={data?.polls?.total ?? 0} t={t} />
      <ContributionList type="suggestions" items={suggestions} total={data?.suggestions?.total ?? 0} t={t} />

      {/* Editor note */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">{t('editor_note')}</p>
        <Link href="/reporters" className="mt-1 text-sm font-medium text-blue-700 hover:underline">
          {t('editor_note_link')}
        </Link>
      </div>
    </div>
  );
}

export default function CreatorWorkspacePage() {
  return (
    <ProtectedRoute>
      <CreatorWorkspaceContent />
    </ProtectedRoute>
  );
}
