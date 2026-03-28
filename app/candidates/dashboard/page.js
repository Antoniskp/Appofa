'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCircleIcon, MapPinIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { candidateAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function CandidateDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data: profile, loading, error } = useAsyncData(
    async () => {
      if (!user) return null;
      const res = await candidateAPI.getDashboard();
      return res.data?.profile || null;
    },
    [user],
    { initialData: null }
  );

  if (!authLoading && !user) {
    router.replace('/login?redirect=/candidates/dashboard');
    return null;
  }

  if (authLoading || loading) return <div className="app-container py-10"><SkeletonLoader count={1} type="card" /></div>;

  if (error || !profile) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-lg mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <p className="text-gray-500 mb-4">No candidate profile found for your account.</p>
            <Link href="/become-a-candidate" className="text-blue-600 hover:underline text-sm">
              Apply to become a candidate
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Candidate Dashboard</h1>
          <Link
            href={`/candidates/dashboard/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>

        {/* Profile Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-start gap-5">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.fullName} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
            ) : (
              <UserCircleIcon className="w-16 h-16 text-gray-300 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
                <CheckBadgeIcon className="h-5 w-5 text-green-500" title="Verified Candidate" />
              </div>
              {profile.constituency && (
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4" />
                  {profile.constituency.name}
                </p>
              )}
              {profile.bio && <p className="mt-2 text-sm text-gray-600 line-clamp-3">{profile.bio}</p>}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={`/candidates/${profile.slug}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <p className="font-medium text-gray-800">View Public Profile</p>
            <p className="text-sm text-gray-500 mt-1">See how your profile appears to voters.</p>
          </Link>
          <Link href="/my-application" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <p className="font-medium text-gray-800">My Application</p>
            <p className="text-sm text-gray-500 mt-1">Review the application you submitted.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
