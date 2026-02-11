'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StaticPageLayout from '@/components/StaticPageLayout';
import LocationSelector from '@/components/LocationSelector';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import { moderatorApplicationAPI } from '@/lib/api';

export default function BecomeModeratorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    locationId: null,
    reason: '',
    experience: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect non-authenticated users
  if (!authLoading && !user) {
    router.push('/login?redirect=/become-moderator');
    return null;
  }

  const validateForm = () => {
    const newErrors = {};

    if (!formData.locationId) {
      newErrors.locationId = 'Παρακαλώ επιλέξτε μια τοποθεσία';
    }

    if (!formData.reason || formData.reason.trim().length < 20) {
      newErrors.reason = 'Ο λόγος πρέπει να είναι τουλάχιστον 20 χαρακτήρες';
    }

    if (!formData.experience || formData.experience.trim().length < 20) {
      newErrors.experience = 'Η εμπειρία πρέπει να είναι τουλάχιστον 20 χαρακτήρες';
    }

    if (!agreed) {
      newErrors.agreed = 'Πρέπει να συμφωνήσετε με τους όρους';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Παρακαλώ διορθώστε τα σφάλματα στη φόρμα');
      return;
    }

    setSubmitting(true);

    try {
      const response = await moderatorApplicationAPI.create({
        locationId: formData.locationId,
        reason: formData.reason.trim(),
        experience: formData.experience.trim()
      });

      if (response.success) {
        toast.success('Η αίτησή σας υποβλήθηκε επιτυχώς! Θα σας ενημερώσουμε σύντομα.');
        router.push('/profile');
      } else {
        toast.error(response.message || 'Αποτυχία υποβολής αίτησης');
      }
    } catch (error) {
      toast.error(error.message || 'Παρουσιάστηκε σφάλμα');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <StaticPageLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Φόρτωση...</p>
        </div>
      </StaticPageLayout>
    );
  }

  return (
    <StaticPageLayout maxWidth="max-w-5xl">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Γίνε Moderator</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Βοήθησε την τοπική σου κοινότητα να οργανωθεί καλύτερα και να παραμείνει ενημερωμένη
        </p>
      </section>

      {/* Why Become a Moderator */}
      <section>
        <h2 className="text-3xl font-semibold mb-6 text-gray-900">Γιατί να γίνεις Moderator;</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Βοήθησε την Κοινότητά σου</h3>
                <p className="text-gray-700">
                  Συμβάλλεις στην οργάνωση και την ενημέρωση της τοπικής σου περιοχής
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Ειδικά Προνόμια</h3>
                <p className="text-gray-700">
                  Πρόσβαση σε εργαλεία διαχείρισης και ειδικό badge moderator
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Διασφάλισε την Ποιότητα</h3>
                <p className="text-gray-700">
                  Βοήθησε στη διατήρηση υψηλών προτύπων περιεχομένου
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Οργάνωσε Εκδηλώσεις</h3>
                <p className="text-gray-700">
                  Δημιούργησε και προώθησε τοπικές εκδηλώσεις και πρωτοβουλίες
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section>
        <h2 className="text-3xl font-semibold mb-6 text-gray-900">Προϋποθέσεις</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <strong className="text-gray-900">Εγγεγραμμένος χρήστης:</strong>
                <span className="text-gray-700"> Πρέπει να έχετε λογαριασμό στην πλατφόρμα</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <strong className="text-gray-900">Ενεργός στην περιοχή:</strong>
                <span className="text-gray-700"> Να γνωρίζετε καλά την περιοχή που θέλετε να διαχειριστείτε</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <strong className="text-gray-900">Υπεύθυνος και δίκαιος:</strong>
                <span className="text-gray-700"> Να είστε αντικειμενικός και να σέβεστε όλες τις απόψεις</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <strong className="text-gray-900">Διαθέσιμος χρόνος:</strong>
                <span className="text-gray-700"> Να μπορείτε να αφιερώνετε χρόνο στην τακτική διαχείριση</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Responsibilities */}
      <section>
        <h2 className="text-3xl font-semibold mb-6 text-gray-900">Αρμοδιότητες</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Διαχείριση Περιεχομένου
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span>•</span>
                <span>Έγκριση και επεξεργασία άρθρων</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Δημιουργία τοπικών ψηφοφοριών</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Διαγραφή ακατάλληλου περιεχομένου</span>
              </li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🗺️</span>
              Οργάνωση Τοποθεσίας
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span>•</span>
                <span>Διαχείριση πληροφοριών τοποθεσίας</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Σύνδεση περιεχομένου με την περιοχή</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Ενημέρωση στατιστικών</span>
              </li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Moderation Συζητήσεων
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span>•</span>
                <span>Επίβλεψη σχολίων και συζητήσεων</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Απάντηση σε ερωτήματα χρηστών</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Επίλυση διενέξεων</span>
              </li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              Αναφορά Προβλημάτων
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span>•</span>
                <span>Αναφορά σοβαρών παραβάσεων</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Συνεργασία με admins</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Τήρηση των κανόνων της πλατφόρμας</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section>
        <h2 className="text-3xl font-semibold mb-6 text-gray-900">Φόρμα Αίτησης</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Τοποθεσία που θέλετε να διαχειριστείτε *
            </label>
            <LocationSelector
              value={formData.locationId}
              onChange={(value) => {
                setFormData({ ...formData, locationId: value });
                setErrors({ ...errors, locationId: null });
              }}
              placeholder="Επιλέξτε τοποθεσία..."
              className="w-full"
            />
            {errors.locationId && (
              <p className="mt-2 text-sm text-red-600">{errors.locationId}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-gray-900 mb-2">
              Γιατί θέλετε να γίνετε moderator αυτής της περιοχής; *
            </label>
            <textarea
              id="reason"
              rows={6}
              value={formData.reason}
              onChange={(e) => {
                setFormData({ ...formData, reason: e.target.value });
                setErrors({ ...errors, reason: null });
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.reason ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Εξηγήστε γιατί θέλετε να γίνετε moderator και πώς μπορείτε να βοηθήσετε την κοινότητα..."
            />
            <div className="flex justify-between mt-2">
              {errors.reason && (
                <p className="text-sm text-red-600">{errors.reason}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {formData.reason.length} / 20 minimum χαρακτήρες
              </p>
            </div>
          </div>

          {/* Experience */}
          <div>
            <label htmlFor="experience" className="block text-sm font-semibold text-gray-900 mb-2">
              Εμπειρία και Υπόβαθρο *
            </label>
            <textarea
              id="experience"
              rows={6}
              value={formData.experience}
              onChange={(e) => {
                setFormData({ ...formData, experience: e.target.value });
                setErrors({ ...errors, experience: null });
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.experience ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Περιγράψτε την εμπειρία σας (moderation, οργάνωση κοινότητας, κλπ.)..."
            />
            <div className="flex justify-between mt-2">
              {errors.experience && (
                <p className="text-sm text-red-600">{errors.experience}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {formData.experience.length} / 20 minimum χαρακτήρες
              </p>
            </div>
          </div>

          {/* Agreement */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setErrors({ ...errors, agreed: null });
                }}
                className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Συμφωνώ να τηρώ τους{' '}
                <a href="/rules" className="text-indigo-600 hover:text-indigo-700 underline">
                  κανόνες της πλατφόρμας
                </a>
                {' '}και να εκτελώ τις αρμοδιότητές μου ως moderator με υπευθυνότητα και αμεροληψία.
                Καταλαβαίνω ότι η θέση μπορεί να ανακληθεί αν δεν τηρούνται οι κανόνες.
              </span>
            </label>
            {errors.agreed && (
              <p className="mt-2 text-sm text-red-600">{errors.agreed}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Υποβολή...
                </span>
              ) : (
                'Υποβολή Αίτησης'
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Additional Info */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Τι συμβαίνει μετά την υποβολή;</h3>
            <p className="text-gray-700">
              Η αίτησή σας θα αξιολογηθεί από την ομάδα των διαχειριστών. Θα λάβετε ειδοποίηση μέσω email
              σχετικά με την κατάσταση της αίτησής σας εντός 3-7 εργάσιμων ημερών. Αν εγκριθείτε, θα σας
              δοθούν οδηγίες για τα επόμενα βήματα και πρόσβαση στα εργαλεία moderator.
            </p>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
