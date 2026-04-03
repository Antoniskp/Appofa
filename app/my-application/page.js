'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { candidateAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

function StatusBadge({ status }) {
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
      <ClockIcon className="h-4 w-4" /> Pending Review
    </span>
  );
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
      <CheckCircleIcon className="h-4 w-4" /> Approved
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
      <XCircleIcon className="h-4 w-4" /> Rejected
    </span>
  );
  return null;
}

export default function MyApplicationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data: application, loading, error } = useAsyncData(
    async () => {
      if (!user) return null;
      const res = await candidateAPI.getMyApplication();
      return res.data?.application || null;
    },
    [user],
    { initialData: null }
  );

  if (!authLoading && !user) {
    router.replace('/login?redirect=/my-application');
    return null;
  }

  if (authLoading || loading) return <div className="app-container py-10"><SkeletonLoader count={1} type="card" /></div>;

  if (error || !application) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-lg mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <p className="text-gray-500 mb-4">You haven't submitted a candidate application yet.</p>
            <Link href="/become-a-candidate" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Application</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{application.fullName}</h2>
            <StatusBadge status={application.status} />
          </div>

          {application.constituency && (
            <p className="text-sm text-gray-500">Constituency: <span className="text-gray-800">{application.constituency.name}</span></p>
          )}

          {application.bio && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Biography</p>
              <p className="text-sm text-gray-700">{application.bio}</p>
            </div>
          )}

          {application.supportingStatement && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Supporting Statement</p>
              <p className="text-sm text-gray-700">{application.supportingStatement}</p>
            </div>
          )}

          {application.status === 'rejected' && application.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{application.rejectionReason}</p>
            </div>
          )}

          {application.status === 'approved' && application.candidateProfile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 mb-2">Your application was approved!</p>
              <Link
                href={`/candidates/${application.candidateProfile.slug}`}
                className="text-sm text-green-700 underline hover:text-green-900"
              >
                View your candidate profile →
              </Link>
            </div>
          )}

          <p className="text-xs text-gray-400">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
