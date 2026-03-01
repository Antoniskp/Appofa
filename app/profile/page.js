'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import Card from '@/components/Card';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import SkeletonLoader from '@/components/SkeletonLoader';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileBasicInfoForm from '@/components/profile/ProfileBasicInfoForm';
import ProfileHomeLocationSection from '@/components/profile/ProfileHomeLocationSection';
import ProfilePrivacySection from '@/components/profile/ProfilePrivacySection';
import ProfileSecuritySection from '@/components/profile/ProfileSecuritySection';

function ProfileContent() {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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
  const [showHomeLocation, setShowHomeLocation] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const { config: oauthConfig } = useOAuthConfig();
  const [githubLinked, setGithubLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);

  // Load profile
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
        const { username, firstName, lastName, githubId, googleId, avatar, avatarColor, homeLocationId, searchable } = userData;
        setProfileData({
          username: username || '',
          firstName: firstName || '',
          lastName: lastName || '',
          avatar: avatar || '',
          avatarColor: avatarColor || '',
          homeLocationId: homeLocationId || null,
          searchable: searchable !== undefined ? searchable : true,
        });
        setShowHomeLocation(false);
        setGithubLinked(!!githubId);
        setGoogleLinked(!!googleId);

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

  // Handle OAuth callback query params
  useEffect(() => {
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (successParam === 'github_linked') {
      success('GitHub account linked successfully!');
      setGithubLinked(true);
    } else if (successParam === 'google_linked') {
      success('Google account linked successfully!');
      setGoogleLinked(true);
    } else if (errorParam) {
      const errorMessages = {
        unauthorized: 'Unauthorized to link account',
        user_not_found: 'User not found',
        github_already_linked: 'This GitHub account is already linked to another user',
        google_already_linked: 'This Google account is already linked to another user'
      };
      error(errorMessages[errorParam] || 'Failed to link account');
    }
    if (successParam || errorParam) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('success');
      nextParams.delete('error');
      const nextUrl = nextParams.toString() ? `${pathname}?${nextParams}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [searchParams, success, error, pathname, router]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
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
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const togglePasswordSection = () => {
    setShowPasswordFields((prev) => {
      if (prev) resetPasswordData();
      return !prev;
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
    if (!confirm('Are you sure you want to unlink your GitHub account?')) return;
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

  const handleLinkGoogle = async () => {
    try {
      const response = await authAPI.initiateGoogleOAuth('link');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || 'Failed to initiate Google linking');
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm('Are you sure you want to unlink your Google account?')) return;
    try {
      const response = await authAPI.unlinkGoogle();
      if (response.success) {
        success('Google account disconnected');
        setGoogleLinked(false);
      }
    } catch (err) {
      error(err.message || 'Failed to unlink Google account.');
    }
  };

  const handleLocationChange = (locationId) => {
    setProfileData((prev) => ({ ...prev, homeLocationId: locationId }));
    if (locationId && locationId !== 'international') {
      locationAPI.getById(locationId).then((res) => {
        if (res.success) setHomeLocation(res.location);
      });
    } else {
      setHomeLocation(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Card>
            <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </Card>
          <Card>
            <SkeletonLoader type="form" count={1} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header card */}
        <Card>
          <ProfileHeader
            username={profileData.username}
            firstName={profileData.firstName}
            lastName={profileData.lastName}
            email={user?.email}
            avatar={profileData.avatar}
            avatarColor={profileData.avatarColor}
          />
        </Card>

        {/* Basic info + home location + privacy */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update profile information</h2>
          <ProfileBasicInfoForm
            profileData={profileData}
            onChange={handleProfileChange}
            onSubmit={handleProfileSubmit}
          />
          <div className="mt-4 space-y-4">
            <ProfileHomeLocationSection
              homeLocationId={profileData.homeLocationId}
              homeLocation={homeLocation}
              isOpen={showHomeLocation}
              onToggle={() => setShowHomeLocation((prev) => !prev)}
              onLocationChange={handleLocationChange}
            />
            <ProfilePrivacySection
              searchable={profileData.searchable}
              onChange={(checked) => setProfileData((prev) => ({ ...prev, searchable: checked }))}
            />
          </div>
        </Card>

        {/* Security: password + OAuth */}
        <Card>
          <ProfileSecuritySection
            passwordData={passwordData}
            onPasswordChange={handlePasswordChange}
            onPasswordSubmit={handlePasswordSubmit}
            showPasswordFields={showPasswordFields}
            onTogglePassword={togglePasswordSection}
            githubLinked={githubLinked}
            googleLinked={googleLinked}
            oauthConfig={oauthConfig}
            onLinkGithub={handleLinkGithub}
            onUnlinkGithub={handleUnlinkGithub}
            onLinkGoogle={handleLinkGoogle}
            onUnlinkGoogle={handleUnlinkGoogle}
          />
        </Card>
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
