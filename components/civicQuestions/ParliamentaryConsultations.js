'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { BuildingLibraryIcon, ChatBubbleLeftRightIcon, ClipboardDocumentCheckIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import { civicQuestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import Pagination from '@/components/ui/Pagination';
import AlertMessage from '@/components/ui/AlertMessage';

const steps = [
  { name: 'questionStep', icon: ChatBubbleLeftRightIcon },
  { name: 'voteStep', icon: HandRaisedIcon },
  { name: 'decisionStep', icon: ClipboardDocumentCheckIcon },
];

function PublishQuestion({ publisherName }) {
  const t = useTranslations('consultations');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function publish(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError('');
    try {
      const result = await civicQuestionAPI.publishConsultation({ ...fields, deadline: new Date(fields.deadline).toISOString() });
      router.push(`/civic-questions/${result.data.id}`);
    } catch (err) {
      setError(err.message || t('publishError'));
      setSaving(false);
    }
  }

  return (
    <details className="rounded-2xl border border-teal-200 bg-white p-5 sm:p-6">
      <summary className="cursor-pointer font-semibold text-teal-900">{t('publishQuestion')}</summary>
      <form onSubmit={publish} className="mt-4 space-y-4">
        <p className="text-sm text-slate-600">{t('publishingAs', { name: publisherName })}</p>
        <AlertMessage message={error} />
        <label className="block text-sm font-semibold">{t('question')}
          <input name="title" required minLength={5} maxLength={200} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 font-normal" />
        </label>
        <label className="block text-sm font-semibold">{t('context')}
          <textarea name="simplified" required minLength={10} maxLength={20000} rows={4} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 font-normal" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {['pros', 'cons'].map(field => <label key={field} className="block text-sm font-semibold">{t(field)}
            <textarea name={field} minLength={3} maxLength={20000} rows={3} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 font-normal" />
          </label>)}
          <label className="block text-sm font-semibold">{t('sourceLink')}
            <input name="originalLink" type="url" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 font-normal" />
          </label>
          <label className="block text-sm font-semibold">{t('deadlineLocal')}
            <input name="deadline" type="datetime-local" required className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 font-normal" />
          </label>
        </div>
        <p className="text-sm text-slate-600">{t('fixedQuestion')}</p>
        <button disabled={saving} className="min-h-11 rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white disabled:opacity-60">{t(saving ? 'saving' : 'publishQuestion')}</button>
      </form>
    </details>
  );
}

export default function ParliamentaryConsultations() {
  const t = useTranslations('consultations');
  const tFounding = useTranslations('foundingInitiative');
  const format = useFormatter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useAsyncData(
    () => civicQuestionAPI.getAll({ parliamentaryConsultations: true, page }), [page],
  );
  const { data: publisher } = useAsyncData(
    () => user ? civicQuestionAPI.getConsultationPublisher() : null, [user?.id],
  );

  return (
    <main className="bg-slate-50 py-8 sm:py-12">
      <div className="app-container max-w-5xl space-y-8">
        <header className="rounded-3xl bg-teal-950 p-6 text-white sm:px-10 sm:py-9">
          <BuildingLibraryIcon className="mb-5 h-9 w-9 text-teal-200" aria-hidden="true" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-teal-50">{t('intro')}</p>
          <ol className="mt-7 grid gap-4 border-t border-teal-800 pt-5 sm:grid-cols-3">
            {steps.map(({ name, icon: Icon }) => <li key={name} className="flex items-center gap-2.5 text-sm font-semibold">
              <Icon className="h-5 w-5 shrink-0 text-teal-200" aria-hidden="true" />{t(name)}
            </li>)}
          </ol>
        </header>

        <section className="flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-teal-950">{tFounding('nav')}</h2>
            <p className="mt-1 text-sm text-slate-700">{tFounding('consultationsInvite')}</p>
          </div>
          <Link href="/founding-initiative" className="inline-flex min-h-11 shrink-0 items-center self-start rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900 sm:self-center">{tFounding('openInitiative')} →</Link>
        </section>

        {publisher?.data?.publisherName && <PublishQuestion publisherName={publisher.data.publisherName} />}

        <section aria-labelledby="consultations-list">
          <h2 id="consultations-list" className="mb-4 text-xl font-semibold text-slate-900">{t('questionsHeading')}</h2>
          {loading ? <p role="status" className="text-slate-600">{t('loading')}</p> : error ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-5">
              <AlertMessage message={t('loadError')} />
              <button type="button" onClick={() => refetch()} className="mt-2 min-h-11 font-semibold text-teal-800 underline">{t('retry')}</button>
            </div>
          ) : data?.data?.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.data.map(question => {
                const { publisherName, response } = question.parliamentaryConsultation;
                const closed = question.status !== 'open' || new Date(question.deadline) <= new Date();
                return <li key={question.id}>
                  <Link href={`/civic-questions/${question.id}`} className="block h-full rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-500 focus-visible:outline-2 focus-visible:outline-teal-700">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-semibold text-teal-800">{t(response ? 'decisionPublished' : closed ? 'awaitingDecision' : 'votingOpen')}</span>
                      <span className="text-slate-600">{publisherName}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{question.title}</h3>
                    {!closed && <p className="mt-2 text-sm text-slate-600">{t('closesAt', { date: format.dateTime(new Date(question.deadline), { dateStyle: 'medium', timeStyle: 'short' }) })}</p>}
                    <span className="mt-4 block text-sm font-semibold text-teal-800">{t(response ? 'seeDecision' : closed ? 'seeResults' : 'openQuestion')} →</span>
                  </Link>
                </li>;
              })}
            </ul>
          ) : <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">{t('empty')}</p>}
          {!loading && !error && data?.pagination?.totalPages > 1 && <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} onPrevious={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
        </section>
      </div>
    </main>
  );
}
