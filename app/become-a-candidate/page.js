'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { candidateAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const SOCIAL_LINK_KEYS = [
  { key: 'website', label: 'Ιστοσελίδα' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
];

export default function BecomeACandidatePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    constituencyId: '',
    bio: '',
    contactEmail: '',
    manifesto: '',
    supportingStatement: ''
  });
  const [socialLinks, setSocialLinks] = useState(
    Object.fromEntries(SOCIAL_LINK_KEYS.map(({ key }) => [key, '']))
  );
  const [politicalPositions, setPoliticalPositions] = useState([{ key: '', value: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Constituency cascading picker
  const [prefectures, setPrefectures] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState('');

  // Person location cascading picker (always shown)
  const [personPrefectures, setPersonPrefectures] = useState([]);
  const [personMunicipalities, setPersonMunicipalities] = useState([]);
  const [personSelectedPrefectureId, setPersonSelectedPrefectureId] = useState('');
  const [personSelectedMunicipalityId, setPersonSelectedMunicipalityId] = useState('');

  // Load person location prefectures on mount
  useEffect(() => {
    locationAPI.getAll({ type: 'prefecture', limit: 500 })
      .then((res) => setPersonPrefectures(res.locations || []))
      .catch(() => {});
  }, []);

  // Load person municipalities when prefecture changes
  useEffect(() => {
    if (!personSelectedPrefectureId) { setPersonMunicipalities([]); return; }
    locationAPI.getAll({ type: 'municipality', parent_id: personSelectedPrefectureId, limit: 500 })
      .then((res) => setPersonMunicipalities(res.locations || []))
      .catch(() => {});
  }, [personSelectedPrefectureId]);

  // Fetch constituency prefectures whenever position changes
  useEffect(() => {
    setSelectedPrefectureId('');
    setMunicipalities([]);
    if (!form.position) {
      setPrefectures([]);
      return;
    }
    locationAPI.getAll({ type: 'prefecture', limit: 500 }).then((res) => {
      setPrefectures(res.locations || []);
    }).catch(() => {
      setPrefectures([]);
    });
  }, [form.position]);

  // Fetch municipalities when a prefecture is selected (mayor only)
  useEffect(() => {
    if (form.position !== 'mayor' || !selectedPrefectureId) {
      setMunicipalities([]);
      return;
    }
    locationAPI.getAll({ type: 'municipality', parent_id: selectedPrefectureId, limit: 500 }).then((res) => {
      setMunicipalities(res.locations || []);
    }).catch(() => {
      setMunicipalities([]);
    });
  }, [form.position, selectedPrefectureId]);

  if (!authLoading && !user) {
    router.replace('/login?redirect=/become-a-candidate');
    return null;
  }

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset constituency when position changes
      if (field === 'position') {
        updated.constituencyId = '';
        setSelectedPrefectureId('');
        setMunicipalities([]);
      }
      return updated;
    });
  };

  const handlePairChange = (setter, index, field, value) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPair = (setter) => {
    setter((prev) => [...prev, { key: '', value: '' }]);
  };

  const removePair = (setter, index) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const pairsToObject = (pairs) => {
    const obj = {};
    pairs.forEach(({ key, value }) => {
      if (key.trim()) obj[key.trim()] = value.trim();
    });
    return obj;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Determine locationId for the person
      const locationId = personSelectedMunicipalityId || personSelectedPrefectureId || undefined;

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        supportingStatement: form.supportingStatement,
        constituencyId: form.constituencyId || undefined,
        bio: form.bio || undefined,
        contactEmail: form.contactEmail || undefined,
        manifesto: form.manifesto || undefined,
        position: form.position || undefined,
      };

      if (locationId) payload.locationId = parseInt(locationId, 10);

      // Social links — fixed keys, only non-empty
      const slObj = {};
      SOCIAL_LINK_KEYS.forEach(({ key }) => {
        if (socialLinks[key]) slObj[key] = socialLinks[key];
      });
      if (Object.keys(slObj).length > 0) payload.socialLinks = slObj;

      const ppObj = pairsToObject(politicalPositions);
      if (Object.keys(ppObj).length > 0) payload.politicalPositions = ppObj;

      await candidateAPI.apply(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Αποτυχία υποβολής αίτησης. Παρακαλώ δοκιμάστε ξανά.');
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="app-container py-10"><p className="text-gray-500">Φόρτωση...</p></div>;

  if (success) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-lg mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Η Αίτησή σας Υποβλήθηκε!</h1>
            <p className="text-gray-600 mb-6">Η αίτησή σας για να γίνετε υποψήφιος έχει υποβληθεί. Ένας συντονιστής θα την εξετάσει σύντομα.</p>
            <Link href="/my-application" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Δείτε την Αίτησή μου
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Γίνετε Υποψήφιος</h1>
        <p className="text-gray-500 mb-6">Υποβάλετε αίτηση για να συμμετάσχετε στο Appofa ως ανεξάρτητος υποψήφιος.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* First/Last Name side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Επώνυμο <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Person Location (always shown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Τοποθεσία</label>
            <div className="space-y-2">
              <select
                value={personSelectedPrefectureId}
                onChange={(e) => {
                  setPersonSelectedPrefectureId(e.target.value);
                  setPersonSelectedMunicipalityId('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Επιλέξτε Περιφέρεια (προαιρετικό)</option>
                {personPrefectures.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {personSelectedPrefectureId && (
                <select
                  value={personSelectedMunicipalityId}
                  onChange={(e) => setPersonSelectedMunicipalityId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Επιλέξτε Δήμο (προαιρετικό)</option>
                  {personMunicipalities.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Θέση <span className="text-red-500">*</span></label>
            <select
              value={form.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Επιλέξτε θέση</option>
              <option value="parliamentary">Βουλευτής</option>
              <option value="prefect">Περιφερειάρχης</option>
              <option value="mayor">Δήμαρχος</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Εκλογική Περιφέρεια</label>
            <div className="space-y-2">
              <select
                value={selectedPrefectureId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPrefectureId(val);
                  if (form.position !== 'mayor') {
                    handleChange('constituencyId', val);
                  } else {
                    handleChange('constituencyId', '');
                  }
                }}
                disabled={!form.position}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Επιλέξτε Περιφέρεια</option>
                {prefectures.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>

              {form.position === 'mayor' && selectedPrefectureId && (
                <select
                  value={form.constituencyId}
                  onChange={(e) => handleChange('constituencyId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Επιλέξτε Δήμο</option>
                  {municipalities.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Επικοινωνίας</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Βιογραφικό</label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Πείτε στους ψηφοφόρους για εσάς..."
            />
          </div>

          {/* Political Positions - key/value UI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Πολιτικές Θέσεις</label>
            <div className="space-y-2">
              {politicalPositions.map((pair, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => handlePairChange(setPoliticalPositions, index, 'key', e.target.value)}
                    placeholder="π.χ. Οικονομία"
                    className="w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => handlePairChange(setPoliticalPositions, index, 'value', e.target.value)}
                    placeholder="..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removePair(setPoliticalPositions, index)}
                    disabled={politicalPositions.length === 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addPair(setPoliticalPositions)}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Προσθήκη
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Πολιτικό Πρόγραμμα</label>
            <textarea
              value={form.manifesto}
              onChange={(e) => handleChange('manifesto', e.target.value)}
              rows={5}
              placeholder="Το πρόγραμμα και το όραμά σας..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Γιατί είστε υποψήφιος; <span className="text-red-500">*</span></label>
            <textarea
              value={form.supportingStatement}
              onChange={(e) => handleChange('supportingStatement', e.target.value)}
              rows={4}
              placeholder="Η δήλωση υποστήριξής σας — γιατί θέλετε να γίνετε υποψήφιος..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Social Links — fixed labeled inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Σύνδεσμοι Κοινωνικών Δικτύων</label>
            <div className="space-y-2">
              {SOCIAL_LINK_KEYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-600 flex-shrink-0">{label}</span>
                  <input
                    type="url"
                    value={socialLinks[key]}
                    onChange={(e) => setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Υποβολή...' : 'Υποβολή Αίτησης'}
          </button>
        </form>
      </div>
    </div>
  );
}
