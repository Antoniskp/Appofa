'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messageAPI, locationAPI } from '@/lib/api';
import { 
  DocumentTextIcon, 
  MapPinIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function BecomeModeratorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    locationId: '',
    message: '',
    experience: ''
  });
  
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationAPI.getAll();
      if (response.success) {
        // Sort locations by type and name
        const sorted = (response.locations || []).sort((a, b) => {
          const typeOrder = { international: 0, country: 1, prefecture: 2, municipality: 3 };
          const typeCompare = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
          if (typeCompare !== 0) return typeCompare;
          return a.name.localeCompare(b.name);
        });
        setLocations(sorted);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Πρέπει να συνδεθείς για να υποβάλεις αίτηση.');
      return;
    }

    if (!formData.locationId) {
      setError('Παρακαλώ επίλεξε την περιοχή που θέλεις να συντονίσεις.');
      return;
    }

    if (!formData.message || formData.message.trim().length < 50) {
      setError('Παρακαλώ γράψε μια αναλυτική αιτιολόγηση (τουλάχιστον 50 χαρακτήρες).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Combine message and experience into one message
      let fullMessage = formData.message;
      if (formData.experience && formData.experience.trim()) {
        fullMessage += '\n\nΕμπειρία/Προσόντα:\n' + formData.experience;
      }

      const response = await messageAPI.create({
        type: 'moderator_application',
        subject: `Αίτηση Συντονιστή - Περιοχή ID: ${formData.locationId}`,
        message: fullMessage,
        locationId: parseInt(formData.locationId),
        metadata: {
          userId: user.id,
          username: user.username,
          email: user.email
        }
      });

      if (response.success) {
        setSuccess(true);
        setFormData({ locationId: '', message: '', experience: '' });
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(response.message || 'Αποτυχία υποβολής αίτησης. Προσπάθησε ξανά.');
      }
    } catch (err) {
      setError(err.message || 'Σφάλμα κατά την υποβολή αίτησης.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 py-12">
        <div className="app-container">
          <div className="text-center">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 py-12">
        <div className="app-container">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <ExclamationCircleIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Απαιτείται Σύνδεση</h1>
            <p className="text-gray-600 mb-6">
              Πρέπει να συνδεθείς για να υποβάλεις αίτηση συντονιστή.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/login" className="btn-primary">
                Σύνδεση
              </a>
              <a href="/register" className="btn-secondary">
                Εγγραφή
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 py-12">
        <div className="app-container">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4 text-green-700">Η Αίτησή σου Υποβλήθηκε!</h1>
            <p className="text-gray-600 mb-4">
              Ευχαριστούμε για το ενδιαφέρον σου να γίνεις συντονιστής. Θα επικοινωνήσουμε μαζί σου σύντομα.
            </p>
            <p className="text-sm text-gray-500">
              Θα ανακατευθυνθείς στην αρχική σελίδα σε λίγα δευτερόλεπτα...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 py-12">
      <div className="app-container">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Γίνε Συντονιστής
          </h1>
          <p className="text-xl text-gray-600">
            Βοήθησε να οργανώσουμε και να διαχειριστούμε το περιεχόμενο της τοπικής κοινότητας
          </p>
        </div>

        {/* Role Information */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Τι κάνει ένας Συντονιστής;</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <DocumentTextIcon className="w-10 h-10 mb-3" />
                <h3 className="font-bold mb-2">Διαχείριση Άρθρων & Ψηφοφοριών</h3>
                <p className="text-sm text-blue-50">
                  Έγκριση και επιμέλεια περιεχομένου που αφορά την περιοχή σου
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <MapPinIcon className="w-10 h-10 mb-3" />
                <h3 className="font-bold mb-2">Δημιουργία Τοποθεσιών</h3>
                <p className="text-sm text-blue-50">
                  Προσθήκη νέων περιοχών και οργάνωση της γεωγραφικής δομής
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <UserGroupIcon className="w-10 h-10 mb-3" />
                <h3 className="font-bold mb-2">Συντονισμός Κοινότητας</h3>
                <p className="text-sm text-blue-50">
                  Υποστήριξη χρηστών και προώθηση της συμμετοχής στην κοινότητα
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Απαιτήσεις</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Να είσαι κάτοικος ή να γνωρίζεις καλά την περιοχή που θέλεις να συντονίσεις</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Διαθεσιμότητα για τακτική επιμέλεια περιεχομένου (τουλάχιστον 2-3 ώρες την εβδομάδα)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Ενδιαφέρον για τοπικά θέματα και κοινωνική συμμετοχή</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Δέσμευση για αντικειμενική και δίκαιη διαχείριση περιεχομένου</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Application Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Φόρμα Αίτησης</h2>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Info Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-gray-700">Στοιχεία Χρήστη</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Όνομα Χρήστη:</span>
                    <span className="ml-2 font-medium">{user.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{user.email}</span>
                  </div>
                  {user.firstName && (
                    <div>
                      <span className="text-gray-600">Όνομα:</span>
                      <span className="ml-2 font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Selection */}
              <div>
                <label htmlFor="locationId" className="block text-sm font-semibold mb-2 text-gray-700">
                  Επίλεξε Περιοχή <span className="text-red-500">*</span>
                </label>
                <select
                  id="locationId"
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  required
                  disabled={loadingLocations}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">-- Επίλεξε περιοχή --</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.type})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Επίλεξε την περιοχή που θέλεις να συντονίσεις
                </p>
              </div>

              {/* Motivation Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2 text-gray-700">
                  Γιατί θέλεις να γίνεις συντονιστής; <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  minLength={50}
                  placeholder="Περίγραψε τα κίνητρά σου, τη σχέση σου με την περιοχή και πώς μπορείς να συνεισφέρεις στην κοινότητα... (τουλάχιστον 50 χαρακτήρες)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.message.length} χαρακτήρες (ελάχιστο: 50)
                </p>
              </div>

              {/* Experience (Optional) */}
              <div>
                <label htmlFor="experience" className="block text-sm font-semibold mb-2 text-gray-700">
                  Σχετική Εμπειρία ή Προσόντα (προαιρετικό)
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Αναφέρε τυχόν σχετική εμπειρία σε διαχείριση περιεχομένου, κοινοτική εργασία, ή άλλα σχετικά προσόντα..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || loadingLocations}
                  className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                >
                  {submitting ? 'Υποβολή...' : 'Υποβολή Αίτησης'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-8 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition text-gray-700"
                >
                  Ακύρωση
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Process Overview */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Τι θα συμβεί μετά;</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">1.</span>
                <span>Η αίτησή σου θα εξεταστεί από την ομάδα διαχείρισης</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">2.</span>
                <span>Θα επικοινωνήσουμε μαζί σου εντός 5-7 εργάσιμων ημερών</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">3.</span>
                <span>Αν εγκριθείς, θα λάβεις οδηγίες και πρόσβαση στα εργαλεία συντονιστή</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">4.</span>
                <span>Θα ξεκινήσεις με υποστήριξη από έμπειρους συντονιστές</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
