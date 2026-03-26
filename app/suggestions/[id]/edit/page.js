'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { suggestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import CascadingLocationSelector from '@/components/CascadingLocationSelector';

const BASE_SUGGESTION_TYPES = [
  { value: 'idea', label: 'Ιδέα – Πρόταση βελτίωσης' },
  { value: 'problem', label: 'Πρόβλημα – Αναφορά ζητήματος' },
  { value: 'location_suggestion', label: 'Τοποθεσία – Αίτημα για συγκεκριμένο χώρο' },
];

const PRIVILEGED_SUGGESTION_TYPES = [
  ...BASE_SUGGESTION_TYPES,
  { value: 'problem_request', label: 'Ερώτημα Κοινότητας – Ζητώ από χρήστες να αναφέρουν προβλήματα' },
];

const SUGGESTION_STATUSES = [
  { value: 'open', label: 'Ανοιχτό' },
  { value: 'under_review', label: 'Σε Εξέταση' },
  { value: 'implemented', label: 'Υλοποιήθηκε' },
  { value: 'rejected', label: 'Απορρίφθηκε' },
];

export default function EditSuggestionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const suggestionId = parseInt(params.id, 10);

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchSuggestion = useCallback(async () => {
    const res = await suggestionAPI.getById(suggestionId);
    if (res.success) return res.data;
    throw new Error(res.message || 'Σφάλμα φόρτωσης');
  }, [suggestionId]);

  const { loading, error } = useAsyncData(fetchSuggestion, [suggestionId], {
    onSuccess: (data) => {
      setForm({
        title: data.title,
        body: data.body,
        type: data.type,
        status: data.status,
        locationId: data.locationId || null,
      });
    },
  });

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-2xl">
          <SkeletonLoader count={3} type="card" />
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-2xl">
          <EmptyState
            title="Η πρόταση δεν βρέθηκε"
            description={error || 'Η πρόταση που ζητήσατε δεν υπάρχει.'}
            action={{ label: 'Πίσω στις Προτάσεις', href: '/suggestions' }}
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">Πρέπει να συνδεθείτε για να επεξεργαστείτε πρόταση.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Σύνδεση
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPrivileged = ['admin', 'moderator'].includes(user.role);
  const suggestionTypes = isPrivileged ? PRIVILEGED_SUGGESTION_TYPES : BASE_SUGGESTION_TYPES;

  const validate = () => {
    const errs = {};
    if (!form.title.trim() || form.title.trim().length < 5) {
      errs.title = 'Ο τίτλος πρέπει να έχει τουλάχιστον 5 χαρακτήρες.';
    }
    if (!form.body.trim() || form.body.trim().length < 10) {
      errs.body = 'Η περιγραφή πρέπει να έχει τουλάχιστον 10 χαρακτήρες.';
    }
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleLocationChange = (locationId) => {
    setForm((prev) => ({ ...prev, locationId: locationId || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        type: form.type,
        locationId: form.locationId,
      };
      if (isPrivileged) {
        payload.status = form.status;
      }
      const res = await suggestionAPI.update(suggestionId, payload);
      if (res.success) {
        addToast('Η πρόταση ενημερώθηκε επιτυχώς!', { type: 'success' });
        router.push(`/suggestions/${suggestionId}`);
      } else {
        addToast(res.message || 'Σφάλμα κατά την ενημέρωση.', { type: 'error' });
      }
    } catch (err) {
      addToast(err.message || 'Σφάλμα κατά την ενημέρωση.', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl">
        {/* Back link */}
        <Link
          href={`/suggestions/${suggestionId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Πίσω στην Πρόταση
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Επεξεργασία Πρότασης</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Τύπος Πρότασης
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {suggestionTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Τίτλος <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={200}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Περιγραφή <span className="text-red-500">*</span>
              </label>
              <textarea
                name="body"
                value={form.body}
                onChange={handleChange}
                rows={6}
                maxLength={10000}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[120px] ${
                  errors.body ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.body && (
                <p className="text-red-500 text-xs mt-1">{errors.body}</p>
              )}
              <p className="text-xs text-gray-400 mt-1 text-right">
                {form.body.length}/10000
              </p>
            </div>

            {/* Location (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Τοποθεσία <span className="text-gray-400 font-normal">(προαιρετικό)</span>
              </label>
              <CascadingLocationSelector
                value={form.locationId}
                onChange={handleLocationChange}
                allowClear
              />
            </div>

            {/* Status – only for admins/moderators */}
            {isPrivileged && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Κατάσταση
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SUGGESTION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href={`/suggestions/${suggestionId}`}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Ακύρωση
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
