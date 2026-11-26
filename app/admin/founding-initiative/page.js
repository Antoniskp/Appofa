'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/ui/Pagination';
import AlertMessage from '@/components/ui/AlertMessage';
import { useAsyncData } from '@/hooks/useAsyncData';
import { foundingInitiativeAPI } from '@/lib/api/foundingInitiative';

const statuses = ['requested', 'contacted', 'received'];
const allowedRoles = ['admin'];
const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2';
const buttonClass = 'min-h-10 rounded-lg border border-brand-border px-3 text-sm font-semibold text-[var(--brand-hover)] hover:bg-ivory disabled:opacity-60';

function SigningDocument({ document, govGrEnabled, loading, submit }) {
  const t = useTranslations('foundingInitiative.signatures');
  const tGov = useTranslations('foundingInitiative.digitalSigning');
  return <section className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="font-semibold text-slate-900">{t('finalDocument')}</h2>
    {document ? (
      <div className="space-y-1 text-sm text-slate-700">
        <a href={document.pdfUrl} className="font-medium text-[var(--brand-hover)] underline">{t('viewDocument', { version: document.version })}</a>
        <p className="break-all font-mono text-xs">SHA-256 {document.sha256}</p>
        {govGrEnabled ? (
          <button type="button" disabled={loading} className={`mt-3 ${buttonClass}`} onClick={() => submit(() => foundingInitiativeAPI.setGovGrSigning(false))}>{tGov('disable')}</button>
        ) : (
          <form onSubmit={event => {
            event.preventDefault();
            submit(() => foundingInitiativeAPI.setGovGrSigning(true));
          }}>
            <fieldset disabled={loading} className="mt-3 space-y-2">
              <label className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <input type="checkbox" required className="mt-1 accent-[var(--brand)]" />
                {tGov('filingConfirmation')}
              </label>
              <button className={buttonClass}>{tGov('enable')}</button>
            </fieldset>
          </form>
        )}
      </div>
    ) : !loading && (
      <form onSubmit={event => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        submit(() => foundingInitiativeAPI.lockSigningDocument({
          version: fields.get('version'), pdfUrl: fields.get('pdfUrl'), sha256: fields.get('sha256'),
          confirmFinal: fields.has('confirmFinal'),
        }));
      }} className="space-y-3">
        <p className="text-sm leading-6 text-slate-700">{t('lockHelp')}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm font-medium">{t('documentVersion')}
            <input name="version" required maxLength={100} className={inputClass} />
          </label>
          <label className="text-sm font-medium">{t('documentUrl')}
            <input name="pdfUrl" type="url" required maxLength={500} className={inputClass} />
          </label>
          <label className="text-sm font-medium">SHA-256
            <input name="sha256" required pattern="[a-fA-F0-9]{64}" maxLength={64} spellCheck={false} className={inputClass} />
          </label>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input name="confirmFinal" type="checkbox" required className="mt-1 accent-[var(--brand)]" />
          {t('confirmFinal')}
        </label>
        <button className={buttonClass}>{t('lockDocument')}</button>
      </form>
    )}
  </section>;
}

function VerificationForm({ userId, govVerificationCode, document, saving, submit }) {
  const t = useTranslations('foundingInitiative.signatures');
  const tGov = useTranslations('foundingInitiative.digitalSigning');
  return (
    <form className="w-full space-y-3 border-t border-slate-200 pt-3" onSubmit={event => {
      event.preventDefault();
      const fields = new FormData(event.currentTarget);
      submit(() => foundingInitiativeAPI.verifySignature(userId, {
        legalName: fields.get('legalName'), recordReference: fields.get('recordReference'),
        confirmSignature: fields.has('confirmSignature'),
        govVerificationCode,
      }));
    }}>
      <fieldset disabled={saving} className="space-y-3">
        <legend className="mb-2 text-sm font-semibold text-slate-900">{t('verifySignature')}</legend>
        {govVerificationCode && (
          <div className="space-y-1 rounded-lg bg-ivory p-3 text-sm text-slate-700">
            <p>{tGov('reviewInstructions')}</p>
            <p className="break-all font-mono font-semibold text-slate-900">{govVerificationCode}</p>
            <a href="https://docs.gov.gr/validate/" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center font-semibold text-[var(--brand-hover)] underline">{tGov('verifyAtGovGr')}</a>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">{t('legalName')}
            <input name="legalName" required maxLength={160} className={inputClass} />
          </label>
          <label className="text-sm font-medium">{t('archiveReference')}
            <input name="recordReference" required maxLength={80} placeholder="F-001" aria-describedby={`founding-record-help-${userId}`} className={inputClass} />
          </label>
        </div>
        <p id={`founding-record-help-${userId}`} className="text-xs text-slate-600">{t('archiveHelp')}</p>
        <label className="flex items-start gap-2 text-sm leading-6 text-slate-700">
          <input name="confirmSignature" type="checkbox" required className="mt-1 accent-[var(--brand)]" />
          {t('confirmSignature', { version: document.version })}
        </label>
        <button className={buttonClass}>{t('verifyAction')}</button>
      </fieldset>
    </form>
  );
}

function FoundingRequests() {
  const t = useTranslations('foundingInitiative');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState(null);
  const { data, loading, error, refetch } = useAsyncData(() => foundingInitiativeAPI.listInterests(page, filter), [page, filter]);
  const { data: progress, loading: loadingDocument, error: documentError, refetch: refetchProgress } = useAsyncData(() => foundingInitiativeAPI.getProgress(), []);
  const document = progress?.data?.document;

  async function save(action) {
    setSaving(true);
    setSaveError('');
    setNotice(false);
    try {
      await action();
      await Promise.all([refetch(), refetchProgress()]);
      setConfirmRemoval(null);
      setNotice(true);
    } catch (err) {
      setSaveError([400, 409].includes(err.status) ? err.message : err.status === 404 ? t('requestGone') : t('saveError'));
      if ([404, 409].includes(err.status)) await Promise.all([refetch(), refetchProgress()]);
    } finally {
      setSaving(false);
    }
  }

  return <AdminLayout>
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <AdminHeader title={t('adminTitle')} subtitle={t('adminIntro')} />
      <Link href="/founding-initiative" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand)] underline">{t('openPublicPage')}</Link>
      {documentError ? <AlertMessage message={t('loadError')} />
        : <SigningDocument document={document} govGrEnabled={progress?.data?.govGrEnabled} loading={loadingDocument || saving} submit={save} />}
      {progress?.data && <p className="mt-4 text-sm font-semibold text-[var(--brand-hover)]">{t('signatures.progressCount', { count: progress.data.verifiedCount, goal: progress.data.goal })}</p>}
      <div className="mt-3 space-y-4">
        <label className="block text-sm font-medium text-slate-800">{t('filterRequests')}
          <select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); setNotice(false); setSaveError(''); setConfirmRemoval(null); }} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2">
            {['all', ...statuses, 'verified', 'volunteer'].map(item => <option key={item} value={item}>{t(`status_${item}`)}</option>)}
          </select>
        </label>
        {notice && <p role="status" className="text-sm text-[var(--brand-hover)]">{t('statusSaved')}</p>}
        {saveError && <AlertMessage message={saveError} />}
        {loading ? <p role="status" className="text-sm text-slate-600">{t('loading')}</p> : error ? (
          <div><AlertMessage message={t('loadError')} /><button type="button" onClick={refetch} className="mt-2 min-h-11 text-sm font-semibold text-[var(--brand)] underline">{t('retry')}</button></div>
        ) : data?.data?.length ? (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {filter === 'verified' ? data.data.map(row => <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-900">{row.legalName}</p>
                <p className="break-words text-sm text-slate-700">{t('signatures.archiveReference')} {row.recordReference}</p>
                <p className="text-xs text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</p>
              </div>
              {confirmRemoval === row.id ? <div className="space-y-2">
                <p className="text-sm text-slate-700">{t('signatures.confirmRemoval')}</p>
                <button type="button" disabled={saving} className={buttonClass}
                  onClick={() => save(() => foundingInitiativeAPI.removeVerification(row.id))}>{t('signatures.removeVerification')}</button>
                <button type="button" onClick={() => setConfirmRemoval(null)} className="ml-3 min-h-10 text-sm underline">{t('signatures.cancel')}</button>
              </div> : <button type="button" disabled={saving} className={buttonClass} onClick={() => setConfirmRemoval(row.id)}>{t('signatures.removeVerification')}</button>}
            </li>) : data.data.map(row => <li key={row.userId} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-900">{row.participant.username}</p>
                <a href={`mailto:${encodeURIComponent(row.participant.email)}`} className="break-all text-sm text-[var(--brand)] underline">{row.participant.email}</a>
                {row.contactPhone && <p className="text-sm text-slate-700">{row.contactPhone}</p>}
                {row.wantsToVolunteer && <p className="mt-1 text-xs text-slate-600">{t('status_volunteer')}</p>}
                {row.wantsToSign && <p className="mt-1 text-xs text-slate-600">{t('preferredMethod', { method: t(`method_${row.signingPreference || 'either'}`) })}</p>}
              </div>
              {row.wantsToSign && row.signingStatus === 'verified' && <p className="text-sm font-semibold text-[var(--brand-hover)]">{t('status_verified')}</p>}
              {row.wantsToSign && row.signingStatus !== 'verified' && <form key={row.signingStatus} onSubmit={event => {
                event.preventDefault();
                const status = new FormData(event.currentTarget).get('signingStatus');
                save(() => foundingInitiativeAPI.updateSigningStatus(row.userId, status));
              }} className="flex flex-wrap items-end gap-2">
                <label className="text-sm font-medium text-slate-800">{t('signingStatus')}
                  <select name="signingStatus" defaultValue={row.signingStatus} disabled={saving} className="mt-1 block min-h-10 rounded-lg border border-slate-300 bg-white px-2">
                    {statuses.map(status => <option key={status} value={status}>{t(`status_${status}`)}</option>)}
                  </select>
                </label>
                <button disabled={saving} className={buttonClass}>{t('saveStatus')}</button>
              </form>}
              {row.wantsToSign && row.signingStatus === 'received' && document && (
                <VerificationForm key={row.govVerificationCode || row.userId} userId={row.userId}
                  govVerificationCode={row.govVerificationCode} document={document} saving={saving} submit={save} />
              )}
            </li>)}
          </ul>
        ) : <p className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600">{t('noRequests')}</p>}
        {!loading && !error && data?.pagination?.totalPages > 1 && <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} onPrevious={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
        {!loading && !error && page > 1 && data?.pagination?.totalPages < page && <button type="button" onClick={() => setPage(1)} className="min-h-11 text-sm font-semibold text-[var(--brand)] underline">{t('firstPage')}</button>}
      </div>
    </div>
  </AdminLayout>;
}

export default function FoundingInitiativeAdminPage() {
  return <ProtectedRoute allowedRoles={allowedRoles}><FoundingRequests /></ProtectedRoute>;
}
