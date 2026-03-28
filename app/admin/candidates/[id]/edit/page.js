'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { candidateAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';

export default function EditAdminCandidatePage({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '', constituencyId: '', bio: '', photo: '',
    contactEmail: '', socialLinks: '', politicalPositions: '', manifesto: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: locations } = useAsyncData(
    async () => { const res = await locationAPI.getAll({ limit: 200 }); return res.data || []; },
    [], { initialData: [] }
  );

  const { data: profile } = useAsyncData(
    async () => {
      const res = await candidateAPI.getAll({ limit: 200 });
      return (res.data?.profiles || []).find((p) => p.id === parseInt(id, 10)) || null;
    },
    [id], { initialData: null }
  );

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || '',
        constituencyId: profile.constituencyId || '',
        bio: profile.bio || '',
        photo: profile.photo || '',
        contactEmail: profile.contactEmail || '',
        socialLinks: profile.socialLinks ? JSON.stringify(profile.socialLinks, null, 2) : '',
        politicalPositions: profile.politicalPositions ? JSON.stringify(profile.politicalPositions, null, 2) : '',
        manifesto: profile.manifesto || ''
      });
    }
  }, [profile]);

  if (!authLoading && user && !['admin', 'moderator'].includes(user.role)) {
    router.replace('/'); return null;
  }

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        constituencyId: form.constituencyId || undefined,
        bio: form.bio || undefined, photo: form.photo || undefined,
        contactEmail: form.contactEmail || undefined, manifesto: form.manifesto || undefined
      };
      if (form.socialLinks.trim()) { try { payload.socialLinks = JSON.parse(form.socialLinks); } catch { /* ignore */ } }
      if (form.politicalPositions.trim()) { try { payload.politicalPositions = JSON.parse(form.politicalPositions); } catch { /* ignore */ } }
      await candidateAPI.updateProfile(id, payload);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (err) { setError(err.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  if (authLoading) return <div className="app-container py-10"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl mx-auto">
        <Link href="/admin/candidates" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← All Profiles</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Candidate Profile</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {[
            { field: 'fullName', label: 'Full Name', type: 'text', required: true },
            { field: 'photo', label: 'Photo URL', type: 'url' },
            { field: 'contactEmail', label: 'Contact Email', type: 'email' }
          ].map(({ field, label, type, required }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
              <input type={type} value={form[field]} onChange={(e) => handleChange(field, e.target.value)} required={required}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Constituency</label>
            <select value={form.constituencyId} onChange={(e) => handleChange('constituencyId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select constituency</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>

          {['bio', 'manifesto'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
              <textarea value={form[field]} onChange={(e) => handleChange(field, e.target.value)} rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          ))}

          {['politicalPositions', 'socialLinks'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field === 'politicalPositions' ? 'Political Positions' : 'Social Links'} <span className="text-xs text-gray-400">(JSON)</span></label>
              <textarea value={form[field]} onChange={(e) => handleChange(field, e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          ))}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Saved successfully!</p>}

          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
