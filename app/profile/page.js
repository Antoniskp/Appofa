'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// Predefined avatar options (using emoji/icons)
const AVATAR_OPTIONS = [
  '😊', '😎', '🤓', '😇', '🥳', '🤠', '👨‍💼', '👩‍💼',
  '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨'
];

// Predefined color options
const COLOR_OPTIONS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#6366F1', // indigo
];

function ProfilePageContent() {
  const { user, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    avatarUrl: '',
    profileColor: '#3B82F6',
    githubUsername: '',
    googleEmail: '',
    facebookId: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchingAvatar, setFetchingAvatar] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        if (response.success) {
          const { username, firstName, lastName, avatarUrl, profileColor, githubUsername, googleEmail, facebookId } = response.data.user;
          setProfileData({
            username: username || '',
            firstName: firstName || '',
            lastName: lastName || '',
            avatarUrl: avatarUrl || '',
            profileColor: profileColor || '#3B82F6',
            githubUsername: githubUsername || '',
            googleEmail: googleEmail || '',
            facebookId: facebookId || '',
          });
        }
      } catch (error) {
        setProfileError(error.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchGitHubAvatar = async () => {
    if (!profileData.githubUsername) return;
    
    setFetchingAvatar(true);
    try {
      const response = await fetch(`https://api.github.com/users/${profileData.githubUsername}`);
      if (response.ok) {
        const data = await response.json();
        setProfileData((prev) => ({
          ...prev,
          avatarUrl: data.avatar_url,
        }));
        setProfileMessage('GitHub avatar loaded successfully!');
      } else {
        setProfileError('GitHub user not found.');
      }
    } catch (error) {
      setProfileError('Failed to fetch GitHub avatar.');
    } finally {
      setFetchingAvatar(false);
    }
  };

  const fetchGoogleAvatar = async () => {
    if (!profileData.googleEmail) return;
    
    // Google avatars require OAuth, so we'll construct a Gravatar URL using the email
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(profileData.googleEmail.toLowerCase().trim()));
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const gravatarUrl = `https://www.gravatar.com/avatar/${hashHex}?d=404&s=200`;
    
    setFetchingAvatar(true);
    try {
      const response = await fetch(gravatarUrl);
      if (response.ok) {
        setProfileData((prev) => ({
          ...prev,
          avatarUrl: gravatarUrl,
        }));
        setProfileMessage('Gravatar loaded successfully!');
      } else {
        setProfileError('No Gravatar found for this email.');
      }
    } catch (error) {
      setProfileError('Failed to fetch Gravatar.');
    } finally {
      setFetchingAvatar(false);
    }
  };

  const fetchFacebookAvatar = () => {
    if (!profileData.facebookId) return;
    
    // Facebook Graph API avatar URL
    const facebookAvatarUrl = `https://graph.facebook.com/${profileData.facebookId}/picture?type=large`;
    setProfileData((prev) => ({
      ...prev,
      avatarUrl: facebookAvatarUrl,
    }));
    setProfileMessage('Facebook avatar loaded successfully!');
  };

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
    setProfileError('');
    setProfileMessage('');

    try {
      await updateProfile(profileData);
      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile.');
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
    setPasswordError('');
    setPasswordMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordMessage('Password updated successfully.');
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password.');
    } finally {
      resetPasswordData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg"
              style={{ backgroundColor: user?.profileColor || '#3B82F6' }}
            >
              {user?.avatarUrl ? (
                user.avatarUrl.startsWith('http') ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{user.avatarUrl}</span>
                )
              ) : (
                <span>👤</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-sm text-gray-600">Signed in as {user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update profile information</h2>
          {profileError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {profileError}
            </div>
          )}
          {profileMessage && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {profileMessage}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            {/* Avatar and Color Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Avatar and Color</h3>
              
              {/* Current Avatar Display */}
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg"
                  style={{ backgroundColor: profileData.profileColor }}
                >
                  {profileData.avatarUrl ? (
                    profileData.avatarUrl.startsWith('http') ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{profileData.avatarUrl}</span>
                    )
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Current Avatar</p>
                  <p className="text-xs text-gray-500">Choose an avatar or enter a custom URL</p>
                </div>
              </div>

              {/* Avatar Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose an avatar
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setProfileData(prev => ({ ...prev, avatarUrl: avatar }))}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all ${
                        profileData.avatarUrl === avatar 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Avatar URL */}
              <div className="mb-4">
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Or enter custom image URL
                </label>
                <input
                  id="avatarUrl"
                  name="avatarUrl"
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={profileData.avatarUrl}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Social Media Avatars */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Or use avatar from social media
                </label>
                
                {/* GitHub */}
                <div className="mb-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="githubUsername"
                      placeholder="GitHub username"
                      value={profileData.githubUsername}
                      onChange={handleProfileChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={fetchGitHubAvatar}
                      disabled={!profileData.githubUsername || fetchingAvatar}
                      className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      {fetchingAvatar ? '...' : 'Use GitHub'}
                    </button>
                  </div>
                </div>

                {/* Google/Gravatar */}
                <div className="mb-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      name="googleEmail"
                      placeholder="Email for Gravatar"
                      value={profileData.googleEmail}
                      onChange={handleProfileChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={fetchGoogleAvatar}
                      disabled={!profileData.googleEmail || fetchingAvatar}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      {fetchingAvatar ? '...' : 'Use Gravatar'}
                    </button>
                  </div>
                </div>

                {/* Facebook */}
                <div className="mb-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="facebookId"
                      placeholder="Facebook user ID or username"
                      value={profileData.facebookId}
                      onChange={handleProfileChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={fetchFacebookAvatar}
                      disabled={!profileData.facebookId}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      Use Facebook
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile color
                </label>
                <div className="flex gap-2 mb-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProfileData(prev => ({ ...prev, profileColor: color }))}
                      className={`w-10 h-10 rounded-full transition-all ${
                        profileData.profileColor === color 
                          ? 'ring-2 ring-offset-2 ring-gray-400' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  name="profileColor"
                  value={profileData.profileColor}
                  onChange={handleProfileChange}
                  className="w-20 h-10 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={profileData.username}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
          {passwordError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {passwordError}
            </div>
          )}
          {passwordMessage && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {passwordMessage}
            </div>
          )}
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator', 'editor', 'viewer']}>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
