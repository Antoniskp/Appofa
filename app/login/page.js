'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

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
    setLoading(true);

    try {
      await login(formData);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Η σύνδεση απέτυχε. Δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    setGithubLoading(true);

    try {
      const response = await authAPI.githubAuth();
      const authUrl = response?.data?.url;
      const state = response?.data?.state;
      if (authUrl && state) {
        sessionStorage.setItem('github_oauth_state', state);
        window.location.href = authUrl;
      } else {
        throw new Error('Αδυναμία έναρξης σύνδεσης GitHub.');
      }
    } catch (err) {
      setError(err.message || 'Η σύνδεση GitHub απέτυχε. Δοκιμάστε ξανά.');
      setGithubLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Συνδεθείτε στον λογαριασμό σας
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ή{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              δημιουργήστε νέο λογαριασμό
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={githubLoading}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.167 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.699-2.782.605-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.621.069-.609.069-.609 1.004.071 1.532 1.032 1.532 1.032.892 1.529 2.341 1.087 2.91.832.091-.647.349-1.087.635-1.337-2.22-.253-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844a9.55 9.55 0 012.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.378.203 2.397.1 2.65.64.698 1.028 1.591 1.028 2.682 0 3.842-2.338 4.687-4.566 4.935.359.31.679.921.679 1.856 0 1.338-.012 2.418-.012 2.747 0 .267.18.577.688.479A10.008 10.008 0 0022 12c0-5.523-4.477-10-10-10z" />
            </svg>
            {githubLoading ? 'Σύνδεση με GitHub...' : 'Συνέχεια με GitHub'}
          </button>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Διεύθυνση email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Διεύθυνση email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Κωδικός πρόσβασης
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Κωδικός πρόσβασης"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Γίνεται σύνδεση...' : 'Είσοδος'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
