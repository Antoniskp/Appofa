'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { personAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';

function ClaimBadge({ status }) {
  const map = {
    unclaimed: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    claimed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function AdminPersonDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const { data: profile, loading, error } = useAsyncData(
    async () => {
      if (!id) return null;
      const res = await personAPI.getById(id);
      return res.data?.profile || null;
    },
    [id],
    { initialData: null }
  );

  if (!authLoading && user && !['admin', 'moderator'].includes(user.role)) {
    router.replace('/');
    return null;
  }

  if (authLoading || loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-3xl mx-auto">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-3xl mx-auto">
          <Link href="/admin/persons" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← All Profiles</Link>
          <p className="text-red-500">Failed to load person profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-3xl mx-auto">
        <Link href="/admin/persons" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← All Profiles</Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            {profile.photo && (
              <img src={profile.photo} alt={profile.fullName} className="w-20 h-20 rounded-full object-cover border border-gray-200 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">/{profile.slug}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <ClaimBadge status={profile.claimStatus} />
                {profile.source && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                    {profile.source}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-700 mb-1">Biography</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {profile.constituency && (
              <div>
                <span className="text-gray-500">Constituency:</span>{' '}
                <span className="text-gray-800">{profile.constituency.name}</span>
              </div>
            )}
            {profile.position && (
              <div>
                <span className="text-gray-500">Position:</span>{' '}
                <span className="text-gray-800 capitalize">{profile.position}</span>
              </div>
            )}
            {profile.contactEmail && (
              <div>
                <span className="text-gray-500">Email:</span>{' '}
                <span className="text-gray-800">{profile.contactEmail}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
