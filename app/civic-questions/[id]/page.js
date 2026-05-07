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
import { useTranslations } from 'next-intl';

export default function CivicQuestionDetailPage() {
  const t = useTranslations('civicQuestions');
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
        <div className="app-container max-w-4xl">
          <SkeletonLoader type="card" count={1} />
        </div>
      </div>
    );
  }

  if (error || !civicQuestion) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-4xl">
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
  const now = Date.now();
  const canVote = user && civicQuestion.status === 'open' && (!civicQuestion.deadline || new Date(civicQuestion.deadline).getTime() > now);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant={civicQuestion.status === 'open' ? 'success' : 'gray'}>{t(`status.${civicQuestion.status}`)}</Badge>
            <Badge variant="primary">{t(`source_types.${civicQuestion.sourceType}`)}</Badge>
            {civicQuestion.category && <Badge variant="purple">{civicQuestion.category}</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{civicQuestion.title}</h1>
          {civicQuestion.simplified && <p className="text-gray-700 whitespace-pre-wrap mb-4">{civicQuestion.simplified}</p>}
          <div className="text-sm text-gray-600 space-y-1">
            {civicQuestion.sourceName && <p>{t('detail.source')}: {civicQuestion.sourceName}</p>}
            {civicQuestion.originalLink && (
              <p>
                {t('detail.original_link')}:{' '}
                <a href={civicQuestion.originalLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {civicQuestion.originalLink}
                </a>
              </p>
            )}
            {civicQuestion.location?.name && <p>{t('detail.location')}: {civicQuestion.location.name}</p>}
            {civicQuestion.dateAsked && <p>{t('detail.date_asked')}: {new Date(civicQuestion.dateAsked).toLocaleDateString('el-GR')}</p>}
            {civicQuestion.deadline && <p>{t('detail.deadline')}: {new Date(civicQuestion.deadline).toLocaleString('el-GR')}</p>}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => router.push(`/civic-questions/${civicQuestion.id}/edit`)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {t('detail.edit')}
            </button>
          )}
        </div>

        {canVote && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('detail.vote')}</h2>
            <CivicQuestionVoting civicQuestion={civicQuestion} onVoteSuccess={() => fetchQuestion()} />
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
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
