'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { candidateAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';

export default function ClaimProfilePage({ params }) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [supportingStatement, setSupportingStatement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: profile, loading } = useAsyncData(
    async () => {
      const res = await candidateAPI.getBySlug(slug);
      return res.data?.profile || null;
    },
    [slug],
    { initialData: null }
  );

  if (!authLoading && !user) {
    router.replace(`/login?redirect=/candidates/${slug}/claim`);
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supportingStatement.trim()) {
      setSubmitError('Supporting statement is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await candidateAPI.submitClaim(profile.id, { supportingStatement });
      router.push(`/candidates/${slug}?claimed=1`);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit claim. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="app-container py-10"><p className="text-gray-500">Loading...</p></div>;
  }

  if (!profile) {
    return (
      <div className="app-container py-10 text-center">
        <p className="text-red-500">Candidate not found.</p>
        <Link href="/candidates" className="mt-4 inline-block text-blue-600 hover:underline">← Back</Link>
      </div>
    );
  }

  if (profile.claimStatus !== 'unclaimed') {
    return (
      <div className="app-container py-10 text-center">
        <p className="text-gray-700">This profile is not available for claiming.</p>
        <Link href={`/candidates/${slug}`} className="mt-4 inline-block text-blue-600 hover:underline">← Back to profile</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-xl mx-auto">
        <Link href={`/candidates/${slug}`} className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Back to profile</Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Claim this Profile</h1>
          <p className="text-sm text-gray-500 mb-4">You are claiming the profile of <strong>{profile.fullName}</strong>. A moderator will review your request.</p>

          <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.fullName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <UserCircleIcon className="w-10 h-10 text-gray-300" />
            )}
            <div>
              <p className="font-medium text-gray-900">{profile.fullName}</p>
              {profile.constituency && <p className="text-sm text-gray-500">{profile.constituency.name}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why are you this person? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={supportingStatement}
                onChange={(e) => setSupportingStatement(e.target.value)}
                rows={5}
                placeholder="Provide evidence that you are this candidate (e.g., your public social media, party affiliation, etc.)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Claim Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
