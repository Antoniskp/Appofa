'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import { adminAPI } from '@/lib/api';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '-');

const relationLabels = {
  amends: 'Amends',
  applies: 'Applies',
  mentions: 'Mentions',
  repeals: 'Repeals',
  replaces: 'Replaces',
};

function StatBlock({ label, value }) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function WorkerStatus({ status, loading, onRefresh }) {
  const legalWorkers = status?.legalWorkers || [];
  const connected = Boolean(status?.connected);

  return (
    <section className="border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Worker Connection</h2>
          <p className="mt-1 text-sm text-gray-600">
            Appofa uses Appofasistis for import, parsing, and reference extraction.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          loading={loading}
          icon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StatBlock label="Legal Worker" value={connected ? 'Online' : 'Offline'} />
        <StatBlock label="Connected Workers" value={status?.workers?.length ?? 0} />
        <StatBlock label="Legal Workers" value={legalWorkers.length} />
      </div>

      {legalWorkers.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Worker ID</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Last Heartbeat</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Capabilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {legalWorkers.map((worker) => (
                <tr key={worker.workerId}>
                  <td className="px-3 py-2 font-medium text-gray-900">{worker.workerId}</td>
                  <td className="px-3 py-2 text-gray-700">{worker.name || '-'}</td>
                  <td className="px-3 py-2 text-gray-700">{formatDateTime(worker.lastHeartbeat)}</td>
                  <td className="px-3 py-2 text-gray-700">{worker.capabilities?.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-amber-700">
          No connected worker is advertising the Greek law import capabilities yet.
        </p>
      )}
    </section>
  );
}

function ImportControls({ form, setForm, disabled, loading, onSubmit }) {
  return (
    <section className="border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <DocumentArrowDownIcon className="h-5 w-5 text-blue-700" />
        <h2 className="text-lg font-semibold text-gray-900">Parliament Import</h2>
      </div>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 lg:grid-cols-[120px_120px_1fr_140px_auto]">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="legal-page-no">
            Page
          </label>
          <input
            id="legal-page-no"
            type="number"
            min="1"
            value={form.pageNo}
            onChange={(event) => setForm((current) => ({ ...current, pageNo: event.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="legal-page-size">
            Size
          </label>
          <input
            id="legal-page-size"
            type="number"
            min="1"
            max="50"
            value={form.pageSize}
            onChange={(event) => setForm((current) => ({ ...current, pageSize: event.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="legal-title">
            Title Filter
          </label>
          <input
            id="legal-title"
            type="text"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="στεγαστικής, εργασία, ενέργεια"
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="legal-law-num">
            Law No.
          </label>
          <input
            id="legal-law-num"
            type="text"
            value={form.lawNum}
            onChange={(event) => setForm((current) => ({ ...current, lawNum: event.target.value }))}
            placeholder="5329"
            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={disabled}
            loading={loading}
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            className="w-full"
          >
            Import
          </Button>
        </div>
      </form>
    </section>
  );
}

function DocumentList({ documents, selectedId, onSelect }) {
  if (!documents.length) {
    return (
      <div className="border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
        Import a page to preview normalized legal documents.
      </div>
    );
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Imported Documents</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {documents.map((item) => {
          const doc = item.document || {};
          const selected = doc.canonical_id === selectedId;
          return (
            <button
              key={doc.canonical_id}
              type="button"
              onClick={() => onSelect(doc.canonical_id)}
              className={`block w-full px-5 py-4 text-left transition ${
                selected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-medium text-blue-800">{doc.canonical_id}</span>
                <span>{doc.document_type || doc.type}</span>
                {doc.fek_raw ? <span>FEK {doc.fek_raw}</span> : null}
              </div>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">{doc.title || doc.title_official}</h3>
              <p className="mt-2 text-xs text-gray-600">
                {item.stats?.reference_count ?? 0} references, {item.attachments?.length ?? 0} attachments
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ReferencePanel({ document }) {
  const references = document?.references || [];

  return (
    <section className="border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <LinkIcon className="h-5 w-5 text-blue-700" />
        <h2 className="text-lg font-semibold text-gray-900">References</h2>
      </div>

      {references.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">No references were detected in this record.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {references.slice(0, 12).map((reference) => (
            <div key={reference.id} className="border border-gray-200 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-gray-900">{relationLabels[reference.relation_type] || reference.relation_type}</span>
                <span className="text-gray-500">{reference.raw_text}</span>
                <span className={reference.resolved ? 'text-green-700' : 'text-amber-700'}>
                  {reference.resolved ? 'resolved' : 'unresolved'}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-blue-800">{reference.target_canonical_id}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailsPanel({ document }) {
  if (!document) {
    return (
      <section className="border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-600">Select a document to inspect its graph payload.</p>
      </section>
    );
  }

  const doc = document.document || {};
  const attachments = document.attachments || [];
  const units = document.units || [];

  return (
    <div className="space-y-5">
      <section className="border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <ScaleIcon className="h-5 w-5 text-blue-700" />
          <h2 className="text-lg font-semibold text-gray-900">Document</h2>
        </div>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-gray-500">ID</dt>
            <dd className="font-medium text-gray-900">{doc.canonical_id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Ministry</dt>
            <dd className="font-medium text-gray-900">{doc.ministry || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Voted</dt>
            <dd className="font-medium text-gray-900">{doc.date_voted || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">FEK</dt>
            <dd className="font-medium text-gray-900">{doc.fek_raw || doc.fek_canonical_id || '-'}</dd>
          </div>
        </dl>
        <h3 className="mt-4 text-base font-semibold text-gray-900">{doc.title || doc.title_official}</h3>
      </section>

      <ReferencePanel document={document} />

      <section className="border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
        {attachments.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No source files were reported.</p>
        ) : (
          <div className="mt-3 divide-y divide-gray-100">
            {attachments.slice(0, 10).map((attachment) => (
              <a
                key={`${attachment.source_field}-${attachment.position}-${attachment.url}`}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="block py-3 text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-blue-800">{attachment.file_type || attachment.source_field}</span>
                <span className="ml-2 text-gray-500">{attachment.source_field}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Units</h2>
        <p className="mt-2 text-sm text-gray-600">
          {units.length} unit{units.length === 1 ? '' : 's'} returned. Full article splitting appears when the worker receives complete law text.
        </p>
      </section>
    </div>
  );
}

function LegalAdminContent() {
  const [workerStatus, setWorkerStatus] = useState(null);
  const [workerError, setWorkerError] = useState('');
  const [importError, setImportError] = useState('');
  const [loadingWorker, setLoadingWorker] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    pageNo: '1',
    pageSize: '5',
    title: '',
    lawNum: '',
  });

  const documents = useMemo(() => importResult?.result?.documents || [], [importResult]);
  const selectedDocument = useMemo(
    () => documents.find((item) => item.document?.canonical_id === selectedId) || documents[0] || null,
    [documents, selectedId],
  );

  const loadWorkerStatus = async () => {
    setLoadingWorker(true);
    setWorkerError('');
    try {
      const response = await adminAPI.getLegalWorkerStatus();
      setWorkerStatus(response?.data || null);
    } catch (error) {
      setWorkerStatus(null);
      setWorkerError(error.message || 'Failed to load worker status.');
    } finally {
      setLoadingWorker(false);
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    setImporting(true);
    setImportError('');
    try {
      const response = await adminAPI.importParliamentLaws({
        pageNo: Number.parseInt(form.pageNo, 10) || 1,
        pageSize: Number.parseInt(form.pageSize, 10) || 5,
        title: form.title.trim() || undefined,
        lawNum: form.lawNum.trim() || undefined,
      });
      setImportResult(response?.data || null);
      const firstId = response?.data?.result?.documents?.[0]?.document?.canonical_id;
      setSelectedId(firstId || '');
    } catch (error) {
      setImportResult(null);
      setSelectedId('');
      setImportError(error.message || 'Failed to import laws.');
    } finally {
      setImporting(false);
      loadWorkerStatus();
    }
  };

  useEffect(() => {
    loadWorkerStatus();
  }, []);

  const page = importResult?.result?.page;
  const stats = importResult?.result?.stats;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Greek Laws</h1>
            <p className="mt-1 text-gray-600">Manage imports and inspect the legal graph returned by Appofasistis.</p>
          </div>

          {workerError ? <p className="text-sm text-red-600" role="alert">{workerError}</p> : null}
          {importError ? <p className="text-sm text-red-600" role="alert">{importError}</p> : null}

          <WorkerStatus status={workerStatus} loading={loadingWorker} onRefresh={loadWorkerStatus} />
          <ImportControls
            form={form}
            setForm={setForm}
            disabled={!workerStatus?.connected}
            loading={importing}
            onSubmit={handleImport}
          />

          {page || stats ? (
            <section className="grid gap-3 md:grid-cols-5">
              <StatBlock label="Page" value={page?.page_no ?? '-'} />
              <StatBlock label="Page Size" value={page?.page_size ?? '-'} />
              <StatBlock label="Total Records" value={page?.total_records ?? '-'} />
              <StatBlock label="Documents" value={stats?.document_count ?? '-'} />
              <StatBlock label="References" value={stats?.reference_count ?? '-'} />
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
            <DocumentList
              documents={documents}
              selectedId={selectedDocument?.document?.canonical_id || selectedId}
              onSelect={setSelectedId}
            />
            <DetailsPanel document={selectedDocument} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function LegalAdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <LegalAdminContent />
    </ProtectedRoute>
  );
}
