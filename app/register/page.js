'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AlertMessage from '@/components/AlertMessage';
import AuthInput from '@/components/AuthInput';
import OAuthButtons from '@/components/OAuthButtons';
import AuthDivider from '@/components/AuthDivider';
import { authAPI } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthConfig, setOauthConfig] = useState({ github: false, google: false, facebook: false });

  useEffect(() => {
    // Load OAuth configuration
    const loadOAuthConfig = async () => {
      try {
        const response = await authAPI.getOAuthConfig();
        if (response.success) {
          setOauthConfig(response.data);
        }
      } catch (err) {
        console.error('Failed to load OAuth config:', err);
      }
    };

    loadOAuthConfig();
  }, []);

  // Redirect if already logged in
  if (user) {
    router.push('/');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    try {
      setLoading(true);
      const response = await authAPI.initiateGithubOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate GitHub signup');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <AlertMessage message={error} />
          <div className="space-y-4">
            <AuthInput
              id="username"
              type="text"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder="Username"
            />

            <AuthInput
              id="email"
              type="email"
              label="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="Email address"
            />

            <div className="grid grid-cols-2 gap-4">
              <AuthInput
                id="firstName"
                type="text"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                placeholder="First Name"
              />
              <AuthInput
                id="lastName"
                type="text"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                placeholder="Last Name"
              />
            </div>

            <AuthInput
              id="password"
              type="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="Password"
            />

            <AuthInput
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="Confirm Password"
            />

          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        <AuthDivider text="Or sign up with" />

        {/* OAuth Buttons */}
        <OAuthButtons
          config={oauthConfig}
          onGithubLogin={handleGithubSignup}
          disabled={loading}
        />
      </div>
    </div>
  );
}
