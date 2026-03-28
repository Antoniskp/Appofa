'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { candidateAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';

export default function EditCandidateProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    photo: '',
    contactEmail: '',
    socialLinks: '',
    politicalPositions: '',
    manifesto: ''
  });
  const [profileId, setProfileId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: profile, loading } = useAsyncData(
    async () => {
      if (!user) return null;
      const res = await candidateAPI.getDashboard();
      return res.data?.profile || null;
    },
    [user],
    { initialData: null }
  );

  useEffect(() => {
    if (profile) {
      setProfileId(profile.id);
      setForm({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        photo: profile.photo || '',
        contactEmail: profile.contactEmail || '',
        socialLinks: profile.socialLinks ? JSON.stringify(profile.socialLinks, null, 2) : '',
        politicalPositions: profile.politicalPositions ? JSON.stringify(profile.politicalPositions, null, 2) : '',
        manifesto: profile.manifesto || ''
      });
    }
  }, [profile]);

  if (!authLoading && !user) {
    router.replace('/login?redirect=/candidates/dashboard/edit');
    return null;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        fullName: form.fullName,
        bio: form.bio || undefined,
        photo: form.photo || undefined,
        contactEmail: form.contactEmail || undefined,
        manifesto: form.manifesto || undefined
      };
      if (form.socialLinks.trim()) {
        try { payload.socialLinks = JSON.parse(form.socialLinks); } catch { /* ignore */ }
      }
      if (form.politicalPositions.trim()) {
        try { payload.politicalPositions = JSON.parse(form.politicalPositions); } catch { /* ignore */ }
      }
      await candidateAPI.updateProfile(profileId, payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="app-container py-10"><p className="text-gray-500">Loading...</p></div>;

  if (!profile) {
    return (
      <div className="app-container py-10 text-center">
        <p className="text-gray-500">No candidate profile found.</p>
        <Link href="/candidates/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl mx-auto">
        <Link href="/candidates/dashboard" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Candidate Profile</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
            <input
              type="url"
              value={form.photo}
              onChange={(e) => handleChange('photo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Political Positions <span className="text-xs text-gray-400">(JSON)</span></label>
            <textarea
              value={form.politicalPositions}
              onChange={(e) => handleChange('politicalPositions', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manifesto</label>
            <textarea
              value={form.manifesto}
              onChange={(e) => handleChange('manifesto', e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Social Links <span className="text-xs text-gray-400">(JSON)</span></label>
            <textarea
              value={form.socialLinks}
              onChange={(e) => handleChange('socialLinks', e.target.value)}
              rows={3}
              placeholder={'{"twitter": "https://...", "website": "https://..."}'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Profile updated successfully!</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
