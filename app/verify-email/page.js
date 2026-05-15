'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = searchParams.get('token');
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState({ success: false, message: '', code: null });
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/');
      return;
    }

    let mounted = true;
    const verify = async () => {
      try {
        const response = await authAPI.verifyEmail(token);
        if (!mounted) return;
        setResult({
          success: true,
          message: response?.message || 'Email verified successfully!',
          code: null,
        });
      } catch (error) {
        if (!mounted) return;
        setResult({
          success: false,
          message: error?.message || 'Failed to verify email.',
          code: error?.code || null,
        });
      } finally {
        if (mounted) setVerifying(false);
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [token, router]);

  const handleResend = async () => {
    setResending(true);
    setResendMessage('');
    try {
      const response = await authAPI.resendVerification();
      setResendMessage(response?.message || 'Verification email sent.');
    } catch (error) {
      setResendMessage(error?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          {verifying ? (
            <div className="space-y-4">
              <div className="mx-auto h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-700">Verifying your email...</p>
            </div>
          ) : result.success ? (
            <div className="space-y-4">
              <div className="text-4xl">✅</div>
              <h1 className="text-xl font-semibold text-green-700">Email verified successfully!</h1>
              <Link
                href="/profile?verified=1"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Go to profile
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-4xl">❌</div>
              <h1 className="text-xl font-semibold text-red-700">{result.message}</h1>

              {result.code === 'EMAIL_VERIF_TOKEN_EXPIRED' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Your verification link expired. You can request a new one.
                  </p>
                  {!authLoading && user ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {resending ? 'Sending...' : 'Resend verification email'}
                    </button>
                  ) : (
                    <Link
                      href="/login?redirect=/profile"
                      className="inline-flex items-center rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
                    >
                      Login to resend email
                    </Link>
                  )}
                  {resendMessage && (
                    <p className="text-xs text-gray-600">{resendMessage}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
