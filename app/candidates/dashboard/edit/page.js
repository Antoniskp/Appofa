'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { personAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';

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

export default function EditCandidateProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    photo: '',
    contactEmail: '',
    manifesto: '',
  });
  const [socialLinks, setSocialLinks] = useState(
    Object.fromEntries(SOCIAL_LINK_KEYS.map(({ key }) => [key, '']))
  );
  const [politicalPositions, setPoliticalPositions] = useState([{ key: '', value: '' }]);
  const [profileId, setProfileId] = useState(null);

  // Person location cascading picker
  const [personPrefectures, setPersonPrefectures] = useState([]);
  const [personMunicipalities, setPersonMunicipalities] = useState([]);
  const [personSelectedPrefectureId, setPersonSelectedPrefectureId] = useState('');
  const [personSelectedMunicipalityId, setPersonSelectedMunicipalityId] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: profile, loading } = useAsyncData(
    async () => {
      if (!user) return null;
      const res = await personAPI.getDashboard();
      return res.data?.profile || null;
    },
    [user],
    { initialData: null }
  );

  // Load prefectures on mount
  useEffect(() => {
    locationAPI.getAll({ type: 'prefecture', limit: 500 })
      .then((res) => setPersonPrefectures(res.locations || []))
      .catch(() => {});
  }, []);

  // Load municipalities when prefecture changes
  useEffect(() => {
    if (!personSelectedPrefectureId) { setPersonMunicipalities([]); return; }
    locationAPI.getAll({ type: 'municipality', parent_id: personSelectedPrefectureId, limit: 500 })
      .then((res) => setPersonMunicipalities(res.locations || []))
      .catch(() => {});
  }, [personSelectedPrefectureId]);

  useEffect(() => {
    if (profile) {
      setProfileId(profile.id);
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        bio: profile.bio || '',
        photo: profile.photo || '',
        contactEmail: profile.contactEmail || '',
        manifesto: profile.manifesto || '',
      });

      // Social links
      const sl = profile.socialLinks || {};
      setSocialLinks(Object.fromEntries(SOCIAL_LINK_KEYS.map(({ key }) => [key, sl[key] || ''])));

      // Political positions
      const pp = profile.politicalPositions || {};
      const ppPairs = Object.entries(pp).map(([k, v]) => ({ key: k, value: v }));
      setPoliticalPositions(ppPairs.length > 0 ? ppPairs : [{ key: '', value: '' }]);
    }
  }, [profile]);

  if (!authLoading && !user) {
    router.replace('/login?redirect=/candidates/dashboard/edit');
    return null;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePairChange = (index, field, value) => {
    setPoliticalPositions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
    setSaving(true);

    try {
      const locationId = personSelectedMunicipalityId || personSelectedPrefectureId || undefined;

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio || undefined,
        photo: form.photo || undefined,
        contactEmail: form.contactEmail || undefined,
        manifesto: form.manifesto || undefined,
      };
      if (locationId) payload.locationId = parseInt(locationId, 10);

      // Social links — only non-empty
      const slObj = {};
      SOCIAL_LINK_KEYS.forEach(({ key }) => {
        if (socialLinks[key]) slObj[key] = socialLinks[key];
      });
      payload.socialLinks = slObj;

      // Political positions
      const ppObj = pairsToObject(politicalPositions);
      if (Object.keys(ppObj).length > 0) payload.politicalPositions = ppObj;

      await personAPI.updateProfile(profileId, payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Αποτυχία αποθήκευσης. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="app-container py-10"><p className="text-gray-500">Φόρτωση...</p></div>;

  if (!profile) {
    return (
      <div className="app-container py-10 text-center">
        <p className="text-gray-500">Δεν βρέθηκε προφίλ υποψηφίου.</p>
        <Link href="/candidates/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">← Επιστροφή στον Πίνακα</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl mx-auto">
        <Link href="/candidates/dashboard" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Πίνακας</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Επεξεργασία Προφίλ</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Name fields side by side */}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Φωτογραφία (URL)</label>
            <input
              type="url"
              value={form.photo}
              onChange={(e) => handleChange('photo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
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

          {/* Location cascading picker */}
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
                <option value="">Επιλέξτε Περιφέρεια</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Βιογραφικό</label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Πολιτικό Πρόγραμμα</label>
            <textarea
              value={form.manifesto}
              onChange={(e) => handleChange('manifesto', e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Political Positions key-value UI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Πολιτικές Θέσεις</label>
            <div className="space-y-2">
              {politicalPositions.map((pair, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => handlePairChange(index, 'key', e.target.value)}
                    placeholder="π.χ. Οικονομία"
                    className="w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => handlePairChange(index, 'value', e.target.value)}
                    placeholder="..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setPoliticalPositions((prev) => prev.filter((_, i) => i !== index))}
                    disabled={politicalPositions.length === 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-1 text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPoliticalPositions((prev) => [...prev, { key: '', value: '' }])}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Προσθήκη
              </button>
            </div>
          </div>

          {/* Social Links fixed inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Σύνδεσμοι</label>
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

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Το προφίλ ενημερώθηκε επιτυχώς!</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
          </button>
        </form>
      </div>
    </div>
  );
}
