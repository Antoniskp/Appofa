'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import VideoEmbedField from '@/components/articles/VideoEmbedField';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';
import { articleAPI, locationAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import categoriesConfig from '@/config/articleCategories.json';

const videoCategories = categoriesConfig.articleTypes?.video?.categories || [];

/**
 * VideoPostForm – A streamlined form for fast video posting.
 *
 * Optimised for a "paste URL → submit" workflow.  The VideoEmbedField
 * auto-fills the title and summary from video metadata so users can
 * publish with minimal interaction.
 */
export default function VideoPostForm() {
  const router = useRouter();
  const { addToast } = useToast();

  // ── Core form state ────────────────────────────────────────────────
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [linkedLocationId, setLinkedLocationId] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // ── Dirty-tracking (prevent auto-fill overwrite) ───────────────────
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [isSummaryDirty, setIsSummaryDirty] = useState(false);

  // ── Submission state ───────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Handlers ───────────────────────────────────────────────────────

  /** Called by VideoEmbedField when metadata resolves (or URL is cleared). */
  const handleEmbedChange = useCallback(
    (data) => {
      if (!data) {
        // URL was cleared
        setPreviewData(null);
        setVideoUrl('');
        if (!isTitleDirty) setTitle('');
        if (!isSummaryDirty) setSummary('');
        return;
      }

      setPreviewData(data);
      setVideoUrl(data.url || '');

      // Auto-fill summary from author name (unless user edited it)
      if (!isSummaryDirty && data.authorName) {
        setSummary(data.authorName);
      }
    },
    [isTitleDirty, isSummaryDirty],
  );

  /** Called by VideoEmbedField to suggest a title from metadata. */
  const handleTitleSuggest = useCallback(
    (suggestedTitle) => {
      if (!isTitleDirty && suggestedTitle) {
        setTitle(suggestedTitle);
      }
    },
    [isTitleDirty],
  );

  /** Submit the video post. */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!previewData) {
      setError('Παρακαλώ επικολλήστε ένα έγκυρο URL βίντεο.');
      return;
    }
    if (!title.trim()) {
      setError('Ο τίτλος είναι υποχρεωτικός.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        content: summary.trim() || '',
        summary: summary.trim() || '',
        type: 'video',
        status: 'published',
        category: category || undefined,
        sourceUrl: previewData.url,
        sourceProvider: previewData.provider,
        sourceMeta: {
          title: previewData.title,
          authorName: previewData.authorName,
          thumbnailUrl: previewData.thumbnailUrl,
        },
        embedUrl: previewData.embedUrl,
        embedHtml: previewData.embedHtml || null,
      };

      const response = await articleAPI.create(payload);

      if (!response.success) {
        setError(response.message || 'Αποτυχία δημοσίευσης βίντεο.');
        return;
      }

      const articleId = response.data?.article?.id;

      // Link location if one was selected
      if (articleId && linkedLocationId) {
        try {
          await locationAPI.link('article', articleId, linkedLocationId);
        } catch (locErr) {
          // Non-blocking – the video was created, location linking can be retried later
          console.error('Failed to link location:', locErr);
        }
      }

      addToast('Το βίντεο δημοσιεύτηκε!', { type: 'success' });

      if (articleId) {
        router.push(`/articles/${articleId}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(`Αποτυχία δημοσίευσης: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────
  const canSubmit = !!previewData && !!title.trim() && !submitting;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 1 ── Video URL (primary input) ──────────────────────────── */}
      <div>
        <VideoEmbedField
          value={videoUrl}
          onChange={handleEmbedChange}
          onTitleSuggest={handleTitleSuggest}
          isTitleDirty={isTitleDirty}
        />
      </div>

      {/* 2 ── Title ──────────────────────────────────────────────── */}
      <div>
        <label htmlFor="video-title" className="block text-sm font-medium text-gray-700 mb-1">
          Τίτλος
          {!isTitleDirty && title && (
            <span className="ml-2 text-xs text-gray-400">(αυτόματο)</span>
          )}
        </label>
        <input
          id="video-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsTitleDirty(true);
          }}
          placeholder="Τίτλος βίντεο"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      {/* 3 ── Summary ────────────────────────────────────────────── */}
      <div>
        <label htmlFor="video-summary" className="block text-sm font-medium text-gray-700 mb-1">
          Περιγραφή{' '}
          <span className="text-gray-400 font-normal">(προαιρετικό)</span>
          {!isSummaryDirty && summary && (
            <span className="ml-2 text-xs text-gray-400">(αυτόματο)</span>
          )}
        </label>
        <input
          id="video-summary"
          type="text"
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            setIsSummaryDirty(true);
          }}
          placeholder="Σύντομη περιγραφή ή όνομα δημιουργού"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 4 ── Category ───────────────────────────────────────────── */}
      {videoCategories.length > 0 && (
        <div>
          <label htmlFor="video-category" className="block text-sm font-medium text-gray-700 mb-1">
            Κατηγορία{' '}
            <span className="text-gray-400 font-normal">(προαιρετικό)</span>
          </label>
          <select
            id="video-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— Επιλογή κατηγορίας —</option>
            {videoCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 5 ── Location ───────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Τοποθεσία{' '}
          <span className="text-gray-400 font-normal">(προαιρετικό)</span>
        </label>
        <CascadingLocationSelector
          value={linkedLocationId}
          onChange={setLinkedLocationId}
          placeholder="Επιλογή τοποθεσίας"
          allowClear={true}
        />
      </div>

      {/* 6 ── Submit ─────────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full rounded-md px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
            canSubmit
              ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Δημοσίευση…' : 'Δημοσίευση Βίντεο'}
        </button>
      </div>
    </form>
  );
}
