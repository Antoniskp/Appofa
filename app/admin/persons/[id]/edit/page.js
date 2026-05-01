'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { personAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { EXPERTISE_TAGS, getExpertiseTagLabel } from '@/lib/utils/professionTaxonomy';
import { getAllParties } from '@/lib/utils/politicalParties';
import { AVATAR_ACCEPTED_TYPES, isAcceptedAvatarFile } from '@/lib/utils/avatarFileValidation';
import { normalizeUploadImage, isHeicFile, UPLOAD_PRESETS } from '@/lib/utils/normalizeUploadImage';
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

function EditPersonProfilePageContent({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const photoFileRef = useRef(null);

  // Section 1 — Person fields
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
  const [photoTimestamp, setPhotoTimestamp] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadStep, setUploadStep] = useState(''); // '' | 'converting' | 'compressing' | 'uploading'
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);
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

  // Section 2 — Political fields
  const [hasPoliticalInfo, setHasPoliticalInfo] = useState(false);
  const [politicalForm, setPoliticalForm] = useState({
    position: '',
    manifesto: '',
    partyId: '',
  });
  const [politicalPositions, setPoliticalPositions] = useState([{ key: '', value: '' }]);

  // Constituency cascading picker
  const [constPrefectures, setConstPrefectures] = useState([]);
  const [constMunicipalities, setConstMunicipalities] = useState([]);
  const [constSelectedPrefectureId, setConstSelectedPrefectureId] = useState('');
  const [constituencyId, setConstituencyId] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { data: profile } = useAsyncData(
    async () => {
      if (!id) return null;
      const res = await personAPI.getById(id);
      return res.data?.profile || null;
    },
    [id],
    { initialData: null }
  );

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

  // Load constituency prefectures on mount
  useEffect(() => {
    locationAPI.getAll({ type: 'prefecture', limit: 500 })
      .then((res) => setConstPrefectures(res.locations || []))
      .catch(() => {});
  }, []);

  // Load constituency municipalities when prefecture changes
  useEffect(() => {
    if (!constSelectedPrefectureId) { setConstMunicipalities([]); return; }
    locationAPI.getAll({ type: 'municipality', parent_id: constSelectedPrefectureId, limit: 500 })
      .then((res) => setConstMunicipalities(res.locations || []))
      .catch(() => {});
  }, [constSelectedPrefectureId]);

  // Populate form from profile
  useEffect(() => {
    if (!profile) return;
    setForm({
      firstNameNative: profile.firstNameNative || '',
      lastNameNative: profile.lastNameNative || '',
      firstNameEn: profile.firstNameEn || '',
      lastNameEn: profile.lastNameEn || '',
      nickname: profile.nickname || '',
      photo: profile.photo || '',
      bio: profile.bio || '',
      contactEmail: profile.contactEmail || '',
      nationality: profile.nationality || '',
    });

    // Pre-populate location pickers from saved homeLocation
    if (profile.homeLocation) {
      const loc = profile.homeLocation;
      if (loc.type === 'municipality') {
        setPersonSelectedCountryId(loc.parent?.parent_id ? String(loc.parent.parent_id) : '');
        setPersonSelectedPrefectureId(loc.parent_id ? String(loc.parent_id) : '');
        setPersonSelectedMunicipalityId(String(loc.id));
      } else if (loc.type === 'prefecture') {
        setPersonSelectedCountryId(loc.parent_id ? String(loc.parent_id) : '');
        setPersonSelectedPrefectureId(String(loc.id));
        setPersonSelectedMunicipalityId('');
      } else if (loc.type === 'country') {
        setPersonSelectedCountryId(String(loc.id));
        setPersonSelectedPrefectureId('');
        setPersonSelectedMunicipalityId('');
      }
    } else {
      setPersonSelectedCountryId('');
      setPersonSelectedPrefectureId('');
      setPersonSelectedMunicipalityId('');
    }

    // Social links
    const sl = profile.socialLinks || {};
    setSocialLinks(Object.fromEntries(SOCIAL_LINK_KEYS.map(({ key }) => [key, sl[key] || ''])));

    // Expertise area
    setExpertiseArea(Array.isArray(profile.expertiseArea) ? profile.expertiseArea : []);

    // Political positions
    const pp = profile.politicalPositions || {};
    const ppPairs = Object.entries(pp).map(([k, v]) => ({ key: k, value: v }));
    setPoliticalPositions(ppPairs.length > 0 ? ppPairs : [{ key: '', value: '' }]);

    // Political fields — auto-enable section if profile has any political data
    const hasPolitical = !!(profile.manifesto || profile.partyId || profile.constituencyId ||
      (profile.politicalPositions && Object.keys(profile.politicalPositions).length > 0) ||
      profile.position);
    setHasPoliticalInfo(hasPolitical);

    setPoliticalForm({
      position: profile.position || '',
      manifesto: profile.manifesto || '',
      partyId: profile.partyId || '',
    });
    if (profile.constituencyId) {
      setConstituencyId(String(profile.constituencyId));
    }
  }, [profile]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const handlePoliticalChange = (field, value) => setPoliticalForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isAcceptedAvatarFile(file)) {
      setPhotoUploadError('Unsupported file type. Please use JPEG, PNG, WebP, or HEIC/HEIF.');
      return;
    }
    setPhotoUploadError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setIsUploadingPhoto(true);
    setPhotoUploadError('');
    setPhotoUploadSuccess(false);
    try {
      if (isHeicFile(photoFile)) {
        setUploadStep('converting');
      } else if (photoFile.size > UPLOAD_PRESETS.avatar.maxBytes) {
        setUploadStep('compressing');
      }
      const uploadFile = await normalizeUploadImage(photoFile, UPLOAD_PRESETS.avatar);
      setUploadStep('uploading');
      const res = await personAPI.uploadPersonPhoto(id, uploadFile);
      if (res.success && res.data?.photoUrl) {
        handleChange('photo', res.data.photoUrl);
        const ts = res.data.avatarUpdatedAt ? new Date(res.data.avatarUpdatedAt).getTime() : Date.now();
        setPhotoTimestamp(ts);
        setPhotoPreview('');
        setPhotoFile(null);
        if (photoFileRef.current) photoFileRef.current.value = '';
        setPhotoUploadSuccess(true);
        setTimeout(() => setPhotoUploadSuccess(false), 3000);
      }
    } catch (err) {
      setPhotoUploadError(err.message || 'Αποτυχία ανάρτησης φωτογραφίας.');
    } finally {
      setIsUploadingPhoto(false);
      setUploadStep('');
    }
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

  const handleDelete = async () => {
    if (!window.confirm('Διαγραφή αυτού του προφίλ; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.')) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await personAPI.deleteProfile(id);
      router.push('/admin/persons');
    } catch (err) {
      setDeleteError(err.message || 'Αποτυχία διαγραφής προφίλ.');
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const locationId = personSelectedMunicipalityId || personSelectedPrefectureId || personSelectedCountryId || undefined;

      const payload = {
        firstNameNative: form.firstNameNative,
        lastNameNative: form.lastNameNative,
      };
      if (form.firstNameEn !== undefined) payload.firstNameEn = form.firstNameEn || null;
      if (form.lastNameEn !== undefined) payload.lastNameEn = form.lastNameEn || null;
      if (form.nickname !== undefined) payload.nickname = form.nickname || null;
      if (form.photo !== undefined) payload.photo = form.photo || null;
      if (form.bio) payload.bio = form.bio;
      if (form.contactEmail) payload.contactEmail = form.contactEmail;
      if (form.nationality !== undefined) payload.nationality = form.nationality || null;
      payload.locationId = locationId ? parseInt(locationId, 10) : null;

      // Social links — only non-empty
      const slObj = {};
      SOCIAL_LINK_KEYS.forEach(({ key }) => {
        if (socialLinks[key]) slObj[key] = socialLinks[key];
      });
      payload.socialLinks = slObj;

      // Expertise area
      payload.expertiseArea = expertiseArea;

      // Political fields — only include if section is enabled
      if (hasPoliticalInfo) {
        payload.partyId = politicalForm.partyId || null;
        if (politicalForm.position) payload.position = politicalForm.position;
        const constId = constituencyId || constSelectedPrefectureId || undefined;
        if (constId) payload.constituencyId = parseInt(constId, 10);
        if (politicalForm.manifesto) payload.manifesto = politicalForm.manifesto;
        const ppObj = pairsToObject(politicalPositions);
        if (Object.keys(ppObj).length > 0) payload.politicalPositions = ppObj;
      } else {
        payload.partyId = null;
        payload.position = null;
        payload.manifesto = null;
        payload.politicalPositions = null;
      }

      await personAPI.updateProfile(id, payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="app-container py-10"><p className="text-gray-500">Φόρτωση...</p></div>;

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-2xl mx-auto">
        <Link href="/admin/persons" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Όλα τα Προφίλ</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Επεξεργασία Προφίλ Προσώπου</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Βασικά Στοιχεία Προσώπου</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.firstNameNative}
                  onChange={(e) => handleChange('firstNameNative', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Επώνυμο <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.lastNameNative}
                  onChange={(e) => handleChange('lastNameNative', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name (English)</label>
                <input
                  type="text"
                  value={form.firstNameEn}
                  onChange={(e) => handleChange('firstNameEn', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name (English)</label>
                <input
                  type="text"
                  value={form.lastNameEn}
                  onChange={(e) => handleChange('lastNameEn', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                {(photoPreview || form.photo) && (
                  <img
                    src={photoPreview || (photoTimestamp ? `${form.photo}?v=${photoTimestamp}` : form.photo)}
                    alt="Τρέχουσα φωτογραφία"
                    className="w-20 h-20 rounded-full object-cover border border-gray-200"
                  />
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {photoFile ? photoFile.name : 'Επιλογή νέας φωτογραφίας'}
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
                      onClick={handleUploadPhoto}
                      disabled={isUploadingPhoto}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isUploadingPhoto
                        ? ({ converting: 'Μετατροπή...', compressing: 'Συμπίεση...', uploading: 'Ανάρτηση...' }[uploadStep] ?? 'Ανάρτηση...')
                        : 'Ανάρτηση'}
                    </button>
                  )}
                  {photoFile && (
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(''); setPhotoUploadError(''); if (photoFileRef.current) photoFileRef.current.value = ''; }}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Ακύρωση
                    </button>
                  )}
                </div>
                {photoUploadError && <p className="text-xs text-red-600">{photoUploadError}</p>}
                {photoUploadSuccess && <p className="text-xs text-green-600">Η φωτογραφία ανέβηκε επιτυχώς!</p>}
                <p className="text-xs text-gray-400">JPEG, PNG, WebP ή HEIC/HEIF · έως 10 MB. Μπορείτε επίσης να εισάγετε απευθείας URL παρακάτω.</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Τομείς Εμπειρογνωμοσύνης</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {expertiseArea.map((area) => (
                  <span key={area} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {getExpertiseTagLabel(area)}
                    <button
                      type="button"
                      onClick={() => setExpertiseArea((prev) => prev.filter((a) => a !== area))}
                      className="ml-1 text-purple-600 hover:text-purple-900 font-bold leading-none"
                      aria-label={`Remove ${getExpertiseTagLabel(area)}`}
                    >✕</button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_TAGS.filter((tag) => !expertiseArea.includes(tag.id)).map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={expertiseArea.length >= 5}
                    onClick={() => setExpertiseArea((prev) => [...prev, tag.id])}
                    className="inline-flex items-center px-3 py-1 rounded-full border border-purple-300 text-xs text-purple-700 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2 — Political fields (collapsible) */}
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
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Αποθηκεύτηκε επιτυχώς!</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
          </button>
        </form>

        {profile && profile.claimStatus === 'unclaimed' && ['admin', 'moderator'].includes(user?.role) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {deleteError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{deleteError}</p>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2.5 bg-white border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Διαγραφή...' : 'Διαγραφή Προφίλ'}
            </button>
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}

export default function EditPersonProfilePage(props) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <EditPersonProfilePageContent {...props} />
    </ProtectedRoute>
  );
}
