'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { newsletterAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

const INITIAL_FORM = {
  subject: '',
  previewText: '',
  htmlContent: '',
  textContent: '',
  audienceFilters: {
    locale: '',
    source: '',
    tag: '',
  },
};

function AdminNewsletterCampaignCreateContent() {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const setAudienceValue = (field, value) => {
    setForm((prev) => ({
      ...prev,
      audienceFilters: {
        ...prev.audienceFilters,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const response = await newsletterAPI.adminCreateCampaign({
        subject: form.subject,
        previewText: form.previewText || undefined,
        htmlContent: form.htmlContent,
        textContent: form.textContent || undefined,
        audienceFilters: {
          ...(form.audienceFilters.locale ? { locale: form.audienceFilters.locale } : {}),
          ...(form.audienceFilters.source ? { source: form.audienceFilters.source } : {}),
          ...(form.audienceFilters.tag ? { tag: form.audienceFilters.tag } : {}),
        },
      });

      addToast('Campaign draft created.', { type: 'success' });
      router.push(`/admin/newsletter/campaigns/${response?.data?.campaign?.id}`);
    } catch (error) {
      addToast(error.message || 'Failed to create campaign.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-4xl">
          <AdminHeader title="New Newsletter Campaign" subtitle="Create a draft campaign" />

          <div className="mb-4">
            <Link href="/admin/newsletter/campaigns" className="text-sm text-blue-600 hover:text-blue-700">
              ← Back to campaigns
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="campaign-subject">Subject</label>
              <input
                id="campaign-subject"
                type="text"
                required
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="campaign-preview">Preview text</label>
              <input
                id="campaign-preview"
                type="text"
                value={form.previewText}
                onChange={(event) => setForm((prev) => ({ ...prev, previewText: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="campaign-html">HTML content</label>
              <textarea
                id="campaign-html"
                required
                value={form.htmlContent}
                onChange={(event) => setForm((prev) => ({ ...prev, htmlContent: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[220px] font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="campaign-text">Text content (optional)</label>
              <textarea
                id="campaign-text"
                value={form.textContent}
                onChange={(event) => setForm((prev) => ({ ...prev, textContent: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[140px]"
              />
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Audience filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="campaign-audience-locale">Locale</label>
                  <select
                    id="campaign-audience-locale"
                    value={form.audienceFilters.locale}
                    onChange={(event) => setAudienceValue('locale', event.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All locales</option>
                    <option value="el">el</option>
                    <option value="en">en</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="campaign-audience-source">Source</label>
                  <select
                    id="campaign-audience-source"
                    value={form.audienceFilters.source}
                    onChange={(event) => setAudienceValue('source', event.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All sources</option>
                    <option value="website">website</option>
                    <option value="admin_manual">admin_manual</option>
                    <option value="import">import</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="campaign-audience-tag">Tag</label>
                  <input
                    id="campaign-audience-tag"
                    type="text"
                    value={form.audienceFilters.tag}
                    onChange={(event) => setAudienceValue('tag', event.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. advertising"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Create draft'}
              </button>
              <Link
                href="/admin/newsletter/campaigns"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminNewsletterCampaignCreatePage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminNewsletterCampaignCreateContent />
    </ProtectedRoute>
  );
}
