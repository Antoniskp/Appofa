'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { civicQuestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import CivicQuestionVoting from '@/components/civicQuestions/CivicQuestionVoting';
import CivicQuestionResults from '@/components/civicQuestions/CivicQuestionResults';
import {
  getCivicQuestionLifecycleStatus,
  getCivicQuestionStatusBadgeVariant,
} from '@/components/civicQuestions/statusUtils';
import { useLocale, useTranslations } from 'next-intl';

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
        <div className={`${sectionCardClass} space-y-4`}>
          <div className="flex flex-wrap gap-2">
            <Badge variant={getCivicQuestionStatusBadgeVariant(lifecycleStatus)}>{t(`status.${lifecycleStatus}`)}</Badge>
            <Badge variant="primary">{t(`source_types.${civicQuestion.sourceType}`)}</Badge>
            {civicQuestion.category && <Badge variant="purple">{civicQuestion.category}</Badge>}
            {civicQuestion.visibility === 'locals_only' && <Badge variant="warning">{t('local_badge')}</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{civicQuestion.title}</h1>
          {canEdit && (
            <button
              type="button"
              onClick={() => router.push(`/civic-questions/${civicQuestion.id}/edit`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {t('detail.edit')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('detail.source_origin')}</h2>
            <dl className="space-y-2 text-sm text-gray-700">
              <div>
                <dt className="font-medium">{t('detail.source_type')}</dt>
                <dd>{t(`source_types.${civicQuestion.sourceType}`)}</dd>
              </div>
              {civicQuestion.sourceName && (
                <div>
                  <dt className="font-medium">{t('detail.source')}</dt>
                  <dd>{civicQuestion.sourceName}</dd>
                </div>
              )}
              {civicQuestion.officialIdentifier && (
                <div>
                  <dt className="font-medium">{t('detail.official_identifier')}</dt>
                  <dd>{civicQuestion.officialIdentifier}</dd>
                </div>
              )}
              {civicQuestion.originalLink && (
                <div>
                  <dt className="font-medium">{t('detail.original_link')}</dt>
                  <dd>
                    <a href={civicQuestion.originalLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                      {civicQuestion.originalLink}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('detail.important_dates')}</h2>
            <dl className="space-y-2 text-sm text-gray-700">
              <div>
                <dt className="font-medium">{t('detail.status')}</dt>
                <dd>{t(`status.${lifecycleStatus}`)}</dd>
              </div>
              <div>
                <dt className="font-medium">{t('detail.location')}</dt>
                <dd>{civicQuestion.location?.name || t('detail.no_location')}</dd>
              </div>
              {civicQuestion.dateAsked && (
                <div>
                  <dt className="font-medium">{t('detail.date_asked')}</dt>
                  <dd>{toDisplayDate(civicQuestion.dateAsked, locale, true)}</dd>
                </div>
              )}
              {civicQuestion.deadline && (
                <div>
                  <dt className="font-medium">{t('detail.deadline')}</dt>
                  <dd>{toDisplayDate(civicQuestion.deadline, locale, true)}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {civicQuestion.simplified && (
          <section className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('detail.simplified')}</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{civicQuestion.simplified}</p>
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-green-700 mb-3">{t('detail.pros')}</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{civicQuestion.pros || t('detail.pros_empty')}</p>
          </div>
          <div className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-red-700 mb-3">{t('detail.cons')}</h2>
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

        <Link href="/civic-questions" className="inline-block text-blue-600 hover:text-blue-800 font-medium">
          ← {t('detail.back_list')}
        </Link>
      </div>
    </div>
  );
}
