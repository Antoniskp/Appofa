'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { candidateAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';

export default function BecomeACandidatePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    constituencyId: '',
    bio: '',
    contactEmail: '',
    socialLinks: '',
    politicalPositions: '',
    manifesto: '',
    supportingStatement: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: locations } = useAsyncData(
    async () => {
      const res = await locationAPI.getAll({ limit: 200 });
      return res.data || [];
    },
    [],
    { initialData: [] }
  );

  if (!authLoading && !user) {
    router.replace('/login?redirect=/become-a-candidate');
    return null;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        fullName: form.fullName,
        supportingStatement: form.supportingStatement,
        constituencyId: form.constituencyId || undefined,
        bio: form.bio || undefined,
        contactEmail: form.contactEmail || undefined,
        manifesto: form.manifesto || undefined
      };

      if (form.socialLinks.trim()) {
        try { payload.socialLinks = JSON.parse(form.socialLinks); } catch { /* ignore */ }
      }
      if (form.politicalPositions.trim()) {
        try { payload.politicalPositions = JSON.parse(form.politicalPositions); } catch { /* ignore */ }
      }

      await candidateAPI.apply(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="app-container py-10"><p className="text-gray-500">Loading...</p></div>;

  if (success) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-lg mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">Your application to become a candidate has been submitted. A moderator will review it shortly.</p>
            <Link href="/my-application" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              View My Application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Become a Candidate</h1>
        <p className="text-gray-500 mb-6">Apply to join Appofa as an independent parliamentary candidate.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Personal Info */}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Constituency</label>
            <select
              value={form.constituencyId}
              onChange={(e) => handleChange('constituencyId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a constituency</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
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
              placeholder="Tell voters about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Political Positions <span className="text-xs text-gray-400">(JSON format, optional)</span></label>
            <textarea
              value={form.politicalPositions}
              onChange={(e) => handleChange('politicalPositions', e.target.value)}
              rows={3}
              placeholder={'{"Economy": "...", "Education": "..."}'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manifesto</label>
            <textarea
              value={form.manifesto}
              onChange={(e) => handleChange('manifesto', e.target.value)}
              rows={5}
              placeholder="Your programme and vision..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Why are you running? <span className="text-red-500">*</span></label>
            <textarea
              value={form.supportingStatement}
              onChange={(e) => handleChange('supportingStatement', e.target.value)}
              rows={4}
              placeholder="Your supporting statement — why you want to become a candidate..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
