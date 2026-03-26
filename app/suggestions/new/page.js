'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { suggestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
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

const BODY_PLACEHOLDERS = {
  idea: 'Περιγράψτε αναλυτικά την ιδέα σας...',
  problem: 'Περιγράψτε το πρόβλημα που αντιμετωπίζετε...',
  problem_request: 'Διατυπώστε το ερώτημα που θέλετε να απευθύνετε στην κοινότητα...',
  location_suggestion: 'Περιγράψτε αναλυτικά το αίτημά σας για συγκεκριμένο χώρο...',
};

export default function NewSuggestionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({ title: '', body: '', type: 'idea', locationId: null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">Πρέπει να συνδεθείτε για να δημιουργήσετε πρόταση.</p>
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

  const isPrivileged = user && ['admin', 'moderator'].includes(user.role);
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
        ...(form.locationId ? { locationId: form.locationId } : { locationId: null }),
      };
      const res = await suggestionAPI.create(payload);
      if (res.success) {
        addToast('Η πρόταση δημιουργήθηκε επιτυχώς!', { type: 'success' });
        router.push(`/suggestions/${res.data.id}`);
      } else {
        addToast(res.message || 'Σφάλμα κατά τη δημιουργία.', { type: 'error' });
      }
    } catch (err) {
      addToast(err.message || 'Σφάλμα κατά τη δημιουργία.', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl">
        {/* Back link */}
        <Link
          href="/suggestions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Πίσω στις Προτάσεις
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Νέα Πρόταση</h1>

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
                placeholder="π.χ. Χρειαζόμαστε πεζοδρόμιο στην οδό Ελευθερίας"
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
                placeholder={BODY_PLACEHOLDERS[form.type] || 'Περιγράψτε αναλυτικά...'}
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
                onChange={(locationId) => setForm((prev) => ({ ...prev, locationId: locationId || null }))}
                allowClear
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/suggestions"
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Ακύρωση
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Υποβολή...' : 'Δημοσίευση Πρότασης'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
