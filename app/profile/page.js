'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/FormInput';
import CascadingLocationSelector from '@/components/CascadingLocationSelector';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import SkeletonLoader from '@/components/SkeletonLoader';

const DEFAULT_AVATAR_COLOR = '#64748b';

function ProfileContent() {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();
  const searchParams = useSearchParams();
  const [profileData, setProfileData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    avatar: '',
    avatarColor: '',
    homeLocationId: null,
    searchable: true,
  });
  const [homeLocation, setHomeLocation] = useState(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { config: oauthConfig } = useOAuthConfig();
  const [githubLinked, setGithubLinked] = useState(false);

  // Load profile using the hook
  const { loading } = useAsyncData(
    async () => {
      const response = await authAPI.getProfile();
      if (response.success) {
        return response.data.user;
      }
      throw new Error('Failed to load profile');
    },
    [],
    {
      onSuccess: async (userData) => {
        const { username, firstName, lastName, githubId, avatar, avatarColor, homeLocationId, searchable } = userData;
        setProfileData({
          username: username || '',
          firstName: firstName || '',
          lastName: lastName || '',
          avatar: avatar || '',
          avatarColor: avatarColor || '',
          homeLocationId: homeLocationId || null,
          searchable: searchable !== undefined ? searchable : true,
        });
        setGithubLinked(!!githubId);

        // Load home location details if set
        if (homeLocationId) {
          try {
            const locationResponse = await locationAPI.getById(homeLocationId);
            if (locationResponse.success) {
              setHomeLocation(locationResponse.location);
            }
          } catch (err) {
            console.error('Failed to load home location:', err);
          }
        }
      },
      onError: (err) => {
        error(err || 'Failed to load profile.');
      }
    }
  );

  useEffect(() => {
    // Handle OAuth callback messages
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (successParam === 'github_linked') {
      success('GitHub account linked successfully!');
      setGithubLinked(true);
    } else if (errorParam) {
      const errorMessages = {
        unauthorized: 'Unauthorized to link account',
        user_not_found: 'User not found',
        github_already_linked: 'This GitHub account is already linked to another user'
      };
      error(errorMessages[errorParam] || 'Failed to link GitHub account');
    }
  }, [searchParams, success, error]);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [profileData.avatar]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    try {
      await updateProfile(profileData);
      success('Profile updated successfully!');
    } catch (err) {
      error(err.message || 'Failed to update profile.');
    }
  };

  const resetPasswordData = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('New password and confirmation do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }

    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      success('Password updated successfully!');
    } catch (err) {
      error(err.message || 'Failed to update password.');
    } finally {
      resetPasswordData();
    }
  };

  const handleLinkGithub = async () => {
    try {
      const response = await authAPI.initiateGithubOAuth('link');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || 'Failed to initiate GitHub linking');
    }
  };

  const handleUnlinkGithub = async () => {
    if (!confirm('Are you sure you want to unlink your GitHub account?')) {
      return;
    }

    try {
      const response = await authAPI.unlinkGithub();
      if (response.success) {
        success('GitHub account disconnected');
        setGithubLinked(false);
      }
    } catch (err) {
      error(err.message || 'Failed to unlink GitHub account.');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <SkeletonLoader type="form" count={1} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-sm text-gray-600">Signed in as {user?.email}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update profile information</h2>
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-full border border-gray-200 flex items-center justify-center text-white text-xl font-semibold"
                  style={{ backgroundColor: profileData.avatarColor || DEFAULT_AVATAR_COLOR }}
                >
                  {profileData.avatar && !avatarLoadError ? (
                    <img
                      src={profileData.avatar}
                      alt={profileData.username || 'User'}
                      className="h-full w-full rounded-full object-cover"
                      onError={() => setAvatarLoadError(true)}
                    />
                  ) : (
                    <span>{(profileData.username || user?.email || 'U').slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Profile avatar</p>
                  <p className="text-xs text-gray-500">Add an image URL or use your initials.</p>
                </div>
              </div>
            </div>
            <div>
              <FormInput
                name="username"
                type="text"
                label="Username"
                value={profileData.username}
                onChange={handleProfileChange}
                autoComplete="username"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormInput
                  name="avatar"
                  type="url"
                  label="Avatar image URL"
                  value={profileData.avatar}
                  onChange={handleProfileChange}
                  placeholder="https://example.com/avatar.png"
                />
              </div>
              <div>
                <label htmlFor="avatarColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar color
                </label>
                <input
                  id="avatarColor"
                  name="avatarColor"
                  type="color"
                  value={profileData.avatarColor || DEFAULT_AVATAR_COLOR}
                  onChange={handleProfileChange}
                  className="h-11 w-full rounded-md border border-gray-300 bg-white px-2 py-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                name="firstName"
                type="text"
                label="First name"
                value={profileData.firstName}
                onChange={handleProfileChange}
                autoComplete="given-name"
              />
              <FormInput
                name="lastName"
                type="text"
                label="Last name"
                value={profileData.lastName}
                onChange={handleProfileChange}
                autoComplete="family-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Location
              </label>
              <CascadingLocationSelector
                value={profileData.homeLocationId}
                onChange={(locationId) => {
                  setProfileData(prev => ({ ...prev, homeLocationId: locationId }));
                  if (locationId && locationId !== 'international') {
                    locationAPI.getById(locationId).then(res => {
                      if (res.success) setHomeLocation(res.location);
                    });
                  } else {
                    setHomeLocation(null);
                  }
                }}
                placeholder="Select your home location"
                allowClear={true}
              />
            </div>
            <div className="flex items-center">
              <input
                id="searchable"
                name="searchable"
                type="checkbox"
                checked={profileData.searchable}
                onChange={(e) => setProfileData(prev => ({ ...prev, searchable: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="searchable" className="ml-2 block text-sm text-gray-700">
                Allow other users to find me in user search
              </label>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Save changes
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change password</h2>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <FormInput
              name="currentPassword"
              type="password"
              label="Current password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
            <FormInput
              name="newPassword"
              type="password"
              label="New password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
            <FormInput
              name="confirmPassword"
              type="password"
              label="Confirm new password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Update password
            </button>
          </form>
        </div>

        {/* Connected Accounts Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h2>
          <p className="text-sm text-gray-600 mb-4">
            Link your social accounts to sign in more easily or enhance your profile.
          </p>

          {/* GitHub Connection */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md mb-3">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">GitHub</p>
                <p className="text-sm text-gray-500">
                  {githubLinked ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {githubLinked ? (
              <button
                onClick={handleUnlinkGithub}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleLinkGithub}
                disabled={!oauthConfig.github}
                className={`px-4 py-2 text-sm font-medium rounded transition ${
                  oauthConfig.github
                    ? 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                    : 'text-gray-400 border border-gray-300 cursor-not-allowed bg-gray-50'
                }`}
                title={!oauthConfig.github ? 'GitHub OAuth is not configured' : 'Connect GitHub'}
              >
                Connect
              </button>
            )}
          </div>

          {/* Google Placeholder */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md mb-3 opacity-50">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Google</p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </div>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-300 rounded cursor-not-allowed bg-gray-50"
            >
              Connect
            </button>
          </div>

          {/* Facebook Placeholder */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md opacity-50">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Facebook</p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </div>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-300 rounded cursor-not-allowed bg-gray-50"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator', 'editor', 'viewer']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      }>
        <ProfileContent />
      </Suspense>
    </ProtectedRoute>
  );
}
