'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { personAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { EXPERTISE_AREAS } from '@/lib/constants/expertiseAreas';
import { getAllParties } from '@/lib/utils/politicalParties';
import { AVATAR_ACCEPTED_TYPES, isAcceptedAvatarFile } from '@/lib/utils/avatarFileValidation';
import { normalizeUploadImage, isHeicFile } from '@/lib/utils/normalizeUploadImage';
import NationalitySelector from '@/components/ui/NationalitySelector';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';

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

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

function CreatePersonProfilePageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const photoFileRef = useRef(null);

  // Section 1 — Basic person fields
  const [form, setForm] = useState({
    firstNameNative: '',
    lastNameNative: '',
    firstNameEn: '',
    lastNameEn: '',
    nickname: '',
    nationality: '',
    photo: '',
    bio: '',
    contactEmail: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [socialLinks, setSocialLinks] = useState(
    Object.fromEntries(SOCIAL_LINK_KEYS.map(({ key }) => [key, '']))
  );
  const [expertiseArea, setExpertiseArea] = useState([]);

  // Person location cascading picker
  const [personCountries, setPersonCountries] = useState([]);
  const [personPrefectures, setPersonPrefectures] = useState([]);
  const [personMunicipalities, setPersonMunicipalities] = useState([]);
  const [personSelectedCountryId, setPersonSelectedCountryId] = useState('');
  const [personSelectedPrefectureId, setPersonSelectedPrefectureId] = useState('');
  const [personSelectedMunicipalityId, setPersonSelectedMunicipalityId] = useState('');

  // Section 2 — Political fields (collapsible)
  const [hasPoliticalInfo, setHasPoliticalInfo] = useState(false);
  const [politicalForm, setPoliticalForm] = useState({
    position: '',
    manifesto: '',
    partyId: '',
  });
  const [politicalPositions, setPoliticalPositions] = useState([{ key: '', value: '' }]);

  // Constituency cascading picker (separate from person location)
  const [constPrefectures, setConstPrefectures] = useState([]);
  const [constMunicipalities, setConstMunicipalities] = useState([]);
  const [constSelectedPrefectureId, setConstSelectedPrefectureId] = useState('');
  const [constituencyId, setConstituencyId] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load person countries on mount
  useEffect(() => {
    locationAPI.getAll({ type: 'country', limit: 200 })
      .then((res) => setPersonCountries(res.locations || []))
      .catch(() => {});
  }, []);

  // Load person prefectures when country changes
  useEffect(() => {
    if (!personSelectedCountryId) {
      setPersonPrefectures([]);
      setPersonMunicipalities([]);
      return;
    }
    locationAPI.getAll({ type: 'prefecture', parent_id: personSelectedCountryId, limit: 500 })
      .then((res) => setPersonPrefectures(res.locations || []))
      .catch(() => {});
  }, [personSelectedCountryId]);

  // Load person municipalities when prefecture changes
  useEffect(() => {
    if (!personSelectedPrefectureId) { setPersonMunicipalities([]); return; }
    locationAPI.getAll({ type: 'municipality', parent_id: personSelectedPrefectureId, limit: 500 })
      .then((res) => setPersonMunicipalities(res.locations || []))
      .catch(() => {});
  }, [personSelectedPrefectureId]);

  // Load constituency prefectures when political section enabled
  useEffect(() => {
    if (!hasPoliticalInfo) return;
    locationAPI.getAll({ type: 'prefecture', limit: 500 })
      .then((res) => setConstPrefectures(res.locations || []))
      .catch(() => {});
  }, [hasPoliticalInfo]);

  // Load constituency municipalities when prefecture changes
  useEffect(() => {
    if (!constSelectedPrefectureId) { setConstMunicipalities([]); return; }
    locationAPI.getAll({ type: 'municipality', parent_id: constSelectedPrefectureId, limit: 500 })
      .then((res) => setConstMunicipalities(res.locations || []))
      .catch(() => {});
  }, [constSelectedPrefectureId]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const handlePoliticalChange = (field, value) => setPoliticalForm((prev) => ({ ...prev, [field]: value }));

  const handlePairChange = (index, field, value) => {
    setPoliticalPositions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isAcceptedAvatarFile(file)) {
      setError('Unsupported file type. Please use JPEG, PNG, WebP, or HEIC/HEIF.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError('File too large. Maximum size is 5 MB.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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
      if (!form.firstNameEn.trim() || !form.lastNameEn.trim()) {
        setError('English first name and last name are required.');
        setSaving(false);
        return;
      }

      // Determine locationId
      const locationId = personSelectedMunicipalityId || personSelectedPrefectureId || personSelectedCountryId || undefined;

      const payload = {
        firstNameEn: form.firstNameEn,
        lastNameEn: form.lastNameEn,
      };
      if (form.firstNameNative) payload.firstNameNative = form.firstNameNative;
      if (form.lastNameNative) payload.lastNameNative = form.lastNameNative;
      if (form.nickname) payload.nickname = form.nickname;
      if (form.photo) payload.photo = form.photo;
      if (form.bio) payload.bio = form.bio;
      if (form.contactEmail) payload.contactEmail = form.contactEmail;
      if (form.nationality) payload.nationality = form.nationality;
      if (locationId) payload.locationId = parseInt(locationId, 10);

      // Social links — only non-empty
      const slObj = {};
      SOCIAL_LINK_KEYS.forEach(({ key }) => {
        if (socialLinks[key]) slObj[key] = socialLinks[key];
      });
      if (Object.keys(slObj).length > 0) payload.socialLinks = slObj;

      if (expertiseArea.length > 0) payload.expertiseArea = expertiseArea;

      // Political section
      if (hasPoliticalInfo) {
        if (politicalForm.position) payload.position = politicalForm.position;
        if (politicalForm.partyId) payload.partyId = politicalForm.partyId;
        const constId = constituencyId || constSelectedPrefectureId || undefined;
        if (constId) payload.constituencyId = parseInt(constId, 10);
        if (politicalForm.manifesto) payload.manifesto = politicalForm.manifesto;
        const ppObj = pairsToObject(politicalPositions);
        if (Object.keys(ppObj).length > 0) payload.politicalPositions = ppObj;
      }

      const createRes = await personAPI.createProfile(payload);
      const newProfileId = createRes.data?.profile?.id;

      // If a photo file was selected, upload it after creating the profile
      if (photoFile && newProfileId) {
        try {
          const uploadFile = isHeicFile(photoFile)
            ? await normalizeUploadImage(photoFile)
            : photoFile;
          await personAPI.uploadPersonPhoto(newProfileId, uploadFile);
        } catch {
          // Profile was created — navigate to edit page so admin can retry the photo upload
          router.push(`/admin/persons/${newProfileId}/edit?photoError=1`);
          return;
        }
      }

      router.push('/admin/persons');
    } catch (err) {
      setError(err.message || 'Αποτυχία δημιουργίας προφίλ.');
      setSaving(false);
    }
  };

  if (authLoading) return <div className="app-container py-10"><p className="text-gray-500">Φόρτωση...</p></div>;

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-2xl mx-auto">
        <Link href="/admin/persons" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Όλα τα Προφίλ</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Δημιουργία Προφίλ Προσώπου</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 — Basic Person Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Βασικά Στοιχεία Προσώπου</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα <span className="text-gray-400">(προαιρετικό)</span></label>
                <input
                  type="text"
                  value={form.firstNameNative}
                  onChange={(e) => handleChange('firstNameNative', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Επώνυμο <span className="text-gray-400">(προαιρετικό)</span></label>
                <input
                  type="text"
                  value={form.lastNameNative}
                  onChange={(e) => handleChange('lastNameNative', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name (English) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.firstNameEn}
                  onChange={(e) => handleChange('firstNameEn', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name (English) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.lastNameEn}
                  onChange={(e) => handleChange('lastNameEn', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Παρατσούκλι / Nickname</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Φωτογραφία</label>
              <div className="space-y-3">
                {photoPreview && (
                  <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
                )}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {photoFile ? photoFile.name : 'Επιλογή αρχείου'}
                    <input
                      ref={photoFileRef}
                      type="file"
                      accept={AVATAR_ACCEPTED_TYPES.join(',')}
                      className="hidden"
                      onChange={handlePhotoFileChange}
                    />
                  </label>
                  {photoFile && (
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(''); if (photoFileRef.current) photoFileRef.current.value = ''; }}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Αφαίρεση
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">JPEG, PNG, WebP ή HEIC/HEIF · έως 5 MB. Εάν δεν επιλεγεί αρχείο, μπορείτε να εισάγετε απευθείας URL παρακάτω.</p>
                <input
                  type="url"
                  value={form.photo}
                  onChange={(e) => handleChange('photo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://... (εναλλακτικά)"
                />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Εθνικότητα
              </label>
              <NationalitySelector
                value={form.nationality}
                onChange={(code) => handleChange('nationality', code)}
              />
            </div>

            {/* Person Location cascading picker — Country → Prefecture → Municipality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Τοποθεσία Προσώπου</label>
              <div className="space-y-2">
                <select
                  value={personSelectedCountryId}
                  onChange={(e) => {
                    setPersonSelectedCountryId(e.target.value);
                    setPersonSelectedPrefectureId('');
                    setPersonSelectedMunicipalityId('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Επιλέξτε Χώρα (προαιρετικό)</option>
                  {personCountries.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {personSelectedCountryId && (
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
                )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Επικοινωνίας</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Social Links — fixed keys */}
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

            {/* Expertise Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Τομέας Εξειδίκευσης</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {expertiseArea.map((area) => (
                  <span key={area} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {area}
                    <button
                      type="button"
                      onClick={() => setExpertiseArea((prev) => prev.filter((a) => a !== area))}
                      className="ml-1 text-purple-600 hover:text-purple-900 font-bold leading-none"
                      aria-label={`Remove ${area}`}
                    >✕</button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_AREAS.filter((area) => !expertiseArea.includes(area)).map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setExpertiseArea((prev) => [...prev, area])}
                    className="inline-flex items-center px-3 py-1 rounded-full border border-purple-300 text-xs text-purple-700 hover:bg-purple-50 transition"
                  >
                    + {area}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2 — Political Info (collapsible) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPoliticalInfo}
                onChange={(e) => setHasPoliticalInfo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-lg font-semibold text-gray-900">Πολιτικά Στοιχεία</span>
            </label>
            <p className="text-sm text-gray-500 -mt-3">Ενεργοποιήστε για να συμπεριλάβετε πολιτικά στοιχεία.</p>

            {hasPoliticalInfo && (
              <div className="space-y-5 pt-2 border-t border-gray-100">
                <h3 className="text-base font-medium text-gray-800">Πολιτικά Στοιχεία</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Θέση</label>
                  <select
                    value={politicalForm.position}
                    onChange={(e) => handlePoliticalChange('position', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Επιλέξτε...</option>
                    <option value="mayor">Δήμαρχος</option>
                    <option value="prefect">Περιφερειάρχης</option>
                    <option value="parliamentary">Βουλευτής</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Πολιτικό Κόμμα</label>
                  <select
                    value={politicalForm.partyId}
                    onChange={(e) => handlePoliticalChange('partyId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Κανένα / Ανεξάρτητος</option>
                    {getAllParties().map((party) => (
                      <option key={party.id} value={party.id}>{party.abbreviation} — {party.name}</option>
                    ))}
                  </select>
                </div>

                {/* Constituency cascading picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Εκλογική Περιφέρεια</label>
                  <div className="space-y-2">
                    <select
                      value={constSelectedPrefectureId}
                      onChange={(e) => {
                        setConstSelectedPrefectureId(e.target.value);
                        setConstituencyId('');
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Επιλέξτε Περιφέρεια</option>
                      {constPrefectures.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                    {constSelectedPrefectureId && (
                      <select
                        value={constituencyId}
                        onChange={(e) => setConstituencyId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Επιλέξτε Δήμο (προαιρετικό)</option>
                        {constMunicipalities.map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Πολιτικό Πρόγραμμα</label>
                  <textarea
                    value={politicalForm.manifesto}
                    onChange={(e) => handlePoliticalChange('manifesto', e.target.value)}
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

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
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Δημιουργία...' : 'Δημιουργία Προφίλ'}
          </button>
        </form>
      </div>
      </div>
    </AdminLayout>
  );
}

export default function CreatePersonProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <CreatePersonProfilePageContent />
    </ProtectedRoute>
  );
}
