'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { saveReturnTo } from '@/lib/auth-redirect';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authError?.status !== 429) {
      if (!user) {
        // Not logged in, redirect to login
        saveReturnTo();
        router.push('/login');
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Logged in but not authorized, redirect to home
        router.push('/');
      }
    }
  }, [user, loading, authError, router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (authError?.status === 429) {
    const retryText = authError.retryAfter
      ? ` Please try again in about ${Math.ceil(authError.retryAfter / 60)} minute(s).`
      : '';

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-5 text-center text-amber-900">
          <h1 className="text-lg font-semibold">Too many requests</h1>
          <p className="mt-2 text-sm">
            We could not confirm your session because the site is temporarily rate limited.
            {retryText}
          </p>
        </div>
      </div>
    );
  }

  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
