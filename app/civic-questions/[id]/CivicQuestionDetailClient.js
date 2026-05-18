'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShareIcon } from '@heroicons/react/24/outline';
import { civicQuestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import CivicQuestionVoting from '@/components/civicQuestions/CivicQuestionVoting';
import CivicQuestionResults from '@/components/civicQuestions/CivicQuestionResults';
import CommentsThread from '@/components/comments/CommentsThread';
import {
  getCivicQuestionLifecycleStatus,
  getCivicQuestionStatusBadgeVariant,
} from '@/components/civicQuestions/statusUtils';
import { useLocale, useTranslations } from 'next-intl';
import ShareModal from '@/components/ui/ShareModal';
import { getEmbedPath } from '@/lib/utils/embed';

const toDisplayDate = (value, locale, withTime = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return withTime ? date.toLocaleString(locale) : date.toLocaleDateString(locale);
};

export default function CivicQuestionDetailClient() {
  const t = useTranslations('civicQuestions');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [civicQuestion, setCivicQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const questionId = parseInt(params.id, 10);

  const fetchQuestion = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await civicQuestionAPI.getById(questionId);
      if (response.success) {
        setCivicQuestion(response.data);
      }
    } catch (err) {
      setError(err.message || t('detail.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) fetchQuestion();
  }, [questionId]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-5xl">
          <SkeletonLoader type="card" count={1} />
        </div>
      </div>
    );
  }

  if (error || !civicQuestion) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-5xl">
          <EmptyState
            type="error"
            title={t('detail.not_found_title')}
            description={error || t('detail.not_found_description')}
            action={{ label: t('detail.back_list'), href: '/civic-questions' }}
          />
        </div>
      </div>
    );
  }

  const isCreator = user && civicQuestion.creatorId === user.id;
  const canEdit = isCreator || user?.role === 'admin';
  const lifecycleStatus = getCivicQuestionLifecycleStatus(civicQuestion);
  const canVote = user && lifecycleStatus === 'open';

  const sectionCardClass = 'bg-white border border-gray-200 rounded-lg p-5';

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-5xl space-y-6">
        {/* Header card */}
        <div className={`${sectionCardClass} space-y-3`}>
          <div className="flex flex-wrap items-start gap-2">
            <Badge variant={getCivicQuestionStatusBadgeVariant(lifecycleStatus)}>{t(`status.${lifecycleStatus}`)}</Badge>
            <Badge variant="primary">{t(`source_types.${civicQuestion.sourceType}`)}</Badge>
            {civicQuestion.category && <Badge variant="purple">{civicQuestion.category}</Badge>}
            {civicQuestion.visibility === 'locals_only' && <Badge variant="warning">{t('local_badge')}</Badge>}
            {civicQuestion.officialIdentifier && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                🏛 {civicQuestion.officialIdentifier}
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{civicQuestion.title}</h1>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t('detail.share')}
                title={t('detail.share')}
                onClick={() => setShowShareModal(true)}
                className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
              {canEdit && (
                <button
                  type="button"
                  aria-label={t('detail.edit')}
                  title={t('detail.edit')}
                  onClick={() => router.push(`/civic-questions/${civicQuestion.id}/edit`)}
                  className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Compact merged metadata card */}
        <section className={sectionCardClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
            {/* Left column: source / origin */}
            <dl className="space-y-2">
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-0.5">{t('detail.source_type')}</dt>
                <dd>{t(`source_types.${civicQuestion.sourceType}`)}</dd>
              </div>
              {civicQuestion.sourceName && (
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-0.5">{t('detail.source')}</dt>
                  <dd>{civicQuestion.sourceName}</dd>
                </div>
              )}
              {civicQuestion.commissionRequirement && (
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-0.5">{t('detail.commission_requirement')}</dt>
                  <dd className="text-blue-700">{civicQuestion.commissionRequirement}</dd>
                </div>
              )}
              {civicQuestion.originalLink && (
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-0.5">{t('detail.original_link')}</dt>
                  <dd>
                    <a href={civicQuestion.originalLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                      {civicQuestion.originalLink}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {/* Right column: dates / location */}
            <dl className="space-y-2">
              <div>
                <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-0.5">{t('detail.location')}</dt>
                <dd>{civicQuestion.location?.name || t('detail.no_location')}</dd>
              </div>
              {civicQuestion.dateAsked && (
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-0.5">{t('detail.date_asked')}</dt>
                  <dd>{toDisplayDate(civicQuestion.dateAsked, locale, true)}</dd>
                </div>
              )}
              {civicQuestion.deadline && (
                <div>
                  <dt className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-0.5">{t('detail.deadline')}</dt>
                  <dd>{toDisplayDate(civicQuestion.deadline, locale, true)}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {civicQuestion.simplified && (
          <section className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('detail.simplified')}</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{civicQuestion.simplified}</p>
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-1.5">
              <span aria-hidden="true">✅</span> {t('detail.pros')}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{civicQuestion.pros || t('detail.pros_empty')}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-1.5">
              <span aria-hidden="true">❌</span> {t('detail.cons')}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{civicQuestion.cons || t('detail.cons_empty')}</p>
          </div>
        </section>

        {canVote && (
          <div className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('detail.vote')}</h2>
            <CivicQuestionVoting civicQuestion={civicQuestion} onVoteSuccess={() => fetchQuestion()} />
          </div>
        )}

        <div className={sectionCardClass}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('detail.results')}</h2>
          <CivicQuestionResults civicQuestion={civicQuestion} />
        </div>

        <div className={sectionCardClass}>
          <CommentsThread
            entityType="civic_question"
            entityId={civicQuestion.id}
            commentsEnabled={civicQuestion.commentsEnabled !== false}
            commentsLocked={civicQuestion.commentsLocked === true}
          />
        </div>

        <Link href="/civic-questions" className="inline-block text-blue-600 hover:text-blue-800 font-medium">
          ← {t('detail.back_list')}
        </Link>
      </div>
      {showShareModal && (
        <ShareModal
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={civicQuestion.title}
          shareText={t('detail.share_text')}
          embedPath={getEmbedPath('civic-questions', civicQuestion.id)}
          embedHeight={620}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
