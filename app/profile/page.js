'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI, locationAPI, commentAPI, badgeAPI, manifestAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import Card from '@/components/ui/Card';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileBasicInfoForm from '@/components/profile/ProfileBasicInfoForm';
import ProfileHomeLocationSection from '@/components/profile/ProfileHomeLocationSection';
import ProfilePrivacySection from '@/components/profile/ProfilePrivacySection';
import ProfileSecuritySection from '@/components/profile/ProfileSecuritySection';
import ProfileDangerZone from '@/components/profile/ProfileDangerZone';
import ProfileAboutSection from '@/components/profile/ProfileAboutSection';
import ProfileProfessionsSection from '@/components/profile/ProfileProfessionsSection';
import ProfileInterestsSection from '@/components/profile/ProfileInterestsSection';
import ProfileExpertiseSection from '@/components/profile/ProfileExpertiseSection';
import ProfileBadgesSection from '@/components/profile/ProfileBadgesSection';
import ProfileManifestSection from '@/components/profile/ProfileManifestSection';

function ProfileContent() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { success, error } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [profileData, setProfileData] = useState({
    username: '',
    firstNameNative: '',
    lastNameNative: '',
    firstNameEn: '',
    lastNameEn: '',
    nickname: '',
    avatar: '',
    avatarColor: '',
    homeLocationId: null,
    mobileTel: '',
    bio: '',
    socialLinks: {},
    dateOfBirth: '',
    professions: [],
    interests: [],
    expertiseArea: [],
    partyId: null,
    nationality: '',
    languagesSpoken: [],
  });
  const [savedProfileData, setSavedProfileData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [homeLocation, setHomeLocation] = useState(null);
  const [showHomeLocation, setShowHomeLocation] = useState(false);
  const [badgeProgress, setBadgeProgress] = useState(null);
  const [badgeEvaluating, setBadgeEvaluating] = useState(false);
  const [displayBadge, setDisplayBadge] = useState({ slug: null, tier: null });
  const [savingDisplayBadge, setSavingDisplayBadge] = useState(false);
  const [interactionSettings, setInteractionSettings] = useState({
    profileCommentsEnabled: true,
    profileCommentsLocked: false,
    searchable: true,
  });
  const [savingInteraction, setSavingInteraction] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const { config: oauthConfig } = useOAuthConfig();
  const [githubLinked, setGithubLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [profPicker, setProfPicker] = useState({ categoryId: '', professionId: '', subProfessionId: '' });
  const [intPicker, setIntPicker] = useState({ categoryId: '', interestId: '', subInterestId: '' });
  const [followersCount, setFollowersCount] = useState(undefined);
  const [followingCount, setFollowingCount] = useState(undefined);
  const [manifestList, setManifestList] = useState([]);
  const [manifestAcceptances, setManifestAcceptances] = useState([]);
  const [manifestLoading, setManifestLoading] = useState(true);

  // Dirty-state tracking: compare current profileData with the last saved snapshot
  useEffect(() => {
    if (!savedProfileData) return;
    const dirty = JSON.stringify(profileData) !== JSON.stringify(savedProfileData);
    setIsDirty(dirty);
  }, [profileData, savedProfileData]);

  // Warn user when navigating away with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

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
        const { username, firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, githubId, googleId, avatar, avatarColor, homeLocationId,
          profileCommentsEnabled, profileCommentsLocked, searchable, mobileTel, bio, socialLinks,
          dateOfBirth, professions, interests, expertiseArea, displayBadgeSlug, displayBadgeTier, nationality, languagesSpoken } = userData;
        const loaded = {
          username: username || '',
          firstNameNative: firstNameNative || '',
          lastNameNative: lastNameNative || '',
          firstNameEn: firstNameEn || '',
          lastNameEn: lastNameEn || '',
          nickname: nickname || '',
          avatar: avatar || '',
          avatarColor: avatarColor || '',
          homeLocationId: homeLocationId || null,
          mobileTel: mobileTel || '',
          bio: bio || '',
          socialLinks: socialLinks || {},
          dateOfBirth: dateOfBirth || '',
          professions: professions || [],
          interests: interests || [],
          expertiseArea: expertiseArea || [],
          partyId: userData.partyId || null,
          nationality: nationality || '',
          languagesSpoken: languagesSpoken || [],
        };
        setProfileData(loaded);
        setSavedProfileData(loaded);
        setIsDirty(false);
        setDisplayBadge({ slug: displayBadgeSlug || null, tier: displayBadgeTier || null });
        setInteractionSettings({
          profileCommentsEnabled: profileCommentsEnabled !== undefined ? profileCommentsEnabled : true,
          profileCommentsLocked: profileCommentsLocked !== undefined ? profileCommentsLocked : false,
          searchable: searchable !== undefined ? searchable : true,
        });
        setShowHomeLocation(false);
        setGithubLinked(!!githubId);
        setGoogleLinked(!!googleId);
        setHasPassword(!!userData.hasPassword);

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

        // Load follower/following counts
        if (userData.id) {
          try {
            const countsRes = await authAPI.getFollowCounts(userData.id);
            if (countsRes?.data) {
              setFollowersCount(countsRes.data.followersCount ?? 0);
              setFollowingCount(countsRes.data.followingCount ?? 0);
            }
          } catch (_err) {
            // counts are non-critical
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

  useEffect(() => {
    badgeAPI.getMyProgress()
      .then((res) => {
        if (res?.data?.badges) setBadgeProgress(res.data.badges);
      })
      .catch(() => {});
  }, []);

  // Fetch active manifests and user's acceptances
  useEffect(() => {
    const fetchManifests = async () => {
      try {
        const [manifestsRes, acceptancesRes] = await Promise.all([
          manifestAPI.getAll(),
          manifestAPI.getMyAcceptances(),
        ]);
        if (manifestsRes?.success) setManifestList(manifestsRes.data?.manifests || []);
        if (acceptancesRes?.success) setManifestAcceptances(acceptancesRes.data?.acceptances || []);
      } catch (_err) {
        // non-critical
      } finally {
        setManifestLoading(false);
      }
    };
    fetchManifests();
  }, []);

  const handleEvaluateBadges = async () => {
    setBadgeEvaluating(true);
    try {
      await badgeAPI.evaluate();
      const res = await badgeAPI.getMyProgress();
      if (res?.data?.badges) setBadgeProgress(res.data.badges);
    } catch (_err) {
      // ignore
    } finally {
      setBadgeEvaluating(false);
    }
  };

  const handleSelectDisplayBadge = async (slug, tier) => {
    setSavingDisplayBadge(true);
    try {
      const res = await badgeAPI.setDisplayBadge(slug, tier);
      if (res?.success) {
        setDisplayBadge({ slug, tier });
        success('Εμφάνιση badge ενημερώθηκε!');
      }
    } catch (_err) {
      error('Αποτυχία ενημέρωσης badge εμφάνισης.');
    } finally {
      setSavingDisplayBadge(false);
    }
  };

  const handleClearDisplayBadge = async () => {
    setSavingDisplayBadge(true);
    try {
      const res = await badgeAPI.clearDisplayBadge();
      if (res?.success) {
        setDisplayBadge({ slug: null, tier: null });
        success('Η επιλογή badge αφαιρέθηκε.');
      }
    } catch (_err) {
      error('Αποτυχία αφαίρεσης badge εμφάνισης.');
    } finally {
      setSavingDisplayBadge(false);
    }
  };

  const handleManifestAccept = async (slug) => {
    try {
      const res = await manifestAPI.accept(slug);
      if (res?.success) {
        setManifestAcceptances((prev) => [...prev, { slug, acceptedAt: res.data?.acceptedAt || new Date().toISOString() }]);
        success('Το μανιφέστο αποδεχτήκατε επιτυχώς!');
      }
    } catch (_err) {
      error('Αποτυχία αποδοχής μανιφέστου.');
    }
  };

  const handleManifestWithdraw = async (slug) => {
    try {
      const res = await manifestAPI.withdraw(slug);
      if (res?.success) {
        setManifestAcceptances((prev) => prev.filter((a) => a.slug !== slug));
        success('Η αποδοχή αποσύρθηκε.');
      }
    } catch (_err) {
      error('Αποτυχία απόσυρσης αποδοχής.');
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguagesChange = (newLanguages) => {
    setProfileData((prev) => ({ ...prev, languagesSpoken: newLanguages }));
  };

  const handleSocialLinkChange = (key, value) => {
    setProfileData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(profileData);
      setSavedProfileData({ ...profileData });
      setIsDirty(false);
      success('Profile updated successfully!');
    } catch (err) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
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

  const handleInteractionSettingsChange = (field, value) => {
    setInteractionSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleInteractionSettingsSave = async () => {
    setSavingInteraction(true);
    try {
      await commentAPI.updateUserProfileCommentSettings(user.id, interactionSettings);
      success('Settings saved successfully!');
    } catch (err) {
      error(err.message || 'Failed to save settings.');
    } finally {
      setSavingInteraction(false);
    }
  };

  const handleDeleteAccount = async ({ password, mode }) => {
    await deleteAccount({ password, mode });
    router.replace('/');
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
    <div className="bg-gray-50 min-h-screen py-10 pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header card */}
        <Card>
          <ProfileHeader
            username={profileData.username}
            firstNameNative={profileData.firstNameNative}
            lastNameNative={profileData.lastNameNative}
            firstNameEn={profileData.firstNameEn}
            lastNameEn={profileData.lastNameEn}
            nickname={profileData.nickname}
            email={user?.email}
            avatar={profileData.avatar}
            avatarColor={profileData.avatarColor}
            followersCount={followersCount}
            followingCount={followingCount}
          />
        </Card>

        {/* Manifest acceptance section */}
        {(manifestList.length > 0 || manifestLoading) && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <ProfileManifestSection
              manifests={manifestList.map((m) => {
                const acceptance = manifestAcceptances.find((a) => a.slug === m.slug);
                return { ...m, acceptedAt: acceptance ? acceptance.acceptedAt : null };
              })}
              onAccept={handleManifestAccept}
              onWithdraw={handleManifestWithdraw}
              loading={manifestLoading}
            />
          </Card>
        )}

        {/* Basic info + home location */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update profile information</h2>
          <ProfileBasicInfoForm
            profileData={profileData}
            onChange={handleProfileChange}
            onLanguagesChange={handleLanguagesChange}
            currentUsername={savedProfileData?.username}
          />
          <div className="mt-4 space-y-4">
            <ProfileHomeLocationSection
              homeLocationId={profileData.homeLocationId}
              homeLocation={homeLocation}
              isOpen={showHomeLocation}
              onToggle={() => setShowHomeLocation((prev) => !prev)}
              onLocationChange={handleLocationChange}
            />
          </div>
        </Card>

        {/* About & Contact */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About &amp; Contact</h2>
          <ProfileAboutSection
            profileData={profileData}
            onChange={handleProfileChange}
            onSocialLinkChange={handleSocialLinkChange}
          />
        </Card>

        {/* Professions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Professions <span className="text-gray-400 text-xs font-normal">(max 5)</span></h2>
          <ProfileProfessionsSection
            professions={profileData.professions}
            picker={profPicker}
            onPickerChange={setProfPicker}
            onAdd={() => {
              const entry = { categoryId: profPicker.categoryId, professionId: profPicker.professionId };
              if (profPicker.subProfessionId) entry.subProfessionId = profPicker.subProfessionId;
              setProfileData((prev) => ({ ...prev, professions: [...(prev.professions || []), entry] }));
              setProfPicker({ categoryId: '', professionId: '', subProfessionId: '' });
            }}
            onRemove={(idx) => setProfileData((prev) => ({ ...prev, professions: prev.professions.filter((_, i) => i !== idx) }))}
          />
        </Card>

        {/* Interests */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests <span className="text-gray-400 text-xs font-normal">(max 10)</span></h2>
          <ProfileInterestsSection
            interests={profileData.interests}
            picker={intPicker}
            onPickerChange={setIntPicker}
            onAdd={() => {
              const entry = { categoryId: intPicker.categoryId, interestId: intPicker.interestId };
              if (intPicker.subInterestId) entry.subInterestId = intPicker.subInterestId;
              setProfileData((prev) => ({ ...prev, interests: [...(prev.interests || []), entry] }));
              setIntPicker({ categoryId: '', interestId: '', subInterestId: '' });
            }}
            onRemove={(idx) => setProfileData((prev) => ({ ...prev, interests: prev.interests.filter((_, i) => i !== idx) }))}
          />
        </Card>

        {/* Expertise Area */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expertise Area <span className="text-gray-400 text-xs font-normal">(select up to 5)</span></h2>
          <ProfileExpertiseSection
            expertiseArea={profileData.expertiseArea}
            onAdd={(area) => setProfileData((prev) => ({ ...prev, expertiseArea: [...(prev.expertiseArea || []), area] }))}
            onRemove={(area) => setProfileData((prev) => ({ ...prev, expertiseArea: prev.expertiseArea.filter((a) => a !== area) }))}
          />
        </Card>

        {/* Privacy & Interaction */}
        <Card>
          <ProfilePrivacySection
            searchable={interactionSettings.searchable}
            profileCommentsEnabled={interactionSettings.profileCommentsEnabled}
            profileCommentsLocked={interactionSettings.profileCommentsLocked}
            onChange={handleInteractionSettingsChange}
            onSave={handleInteractionSettingsSave}
            saving={savingInteraction}
          />
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

        {/* Τα Badges μου */}
        <Card>
          <ProfileBadgesSection
            badgeProgress={badgeProgress}
            badgeEvaluating={badgeEvaluating}
            displayBadge={displayBadge}
            savingDisplayBadge={savingDisplayBadge}
            onEvaluate={handleEvaluateBadges}
            onSelectDisplayBadge={handleSelectDisplayBadge}
            onClearDisplayBadge={handleClearDisplayBadge}
          />
        </Card>

        {/* Danger Zone: account deletion */}
        <Card>
          <ProfileDangerZone
            hasPassword={hasPassword}
            onDeleteAccount={handleDeleteAccount}
          />
        </Card>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {isDirty ? (
            <p className="text-sm text-amber-600 font-medium">● You have unsaved changes</p>
          ) : (
            <p className="text-sm text-gray-400">All changes saved</p>
          )}
          <button
            type="button"
            onClick={handleProfileSubmit}
            disabled={isSaving || !isDirty}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
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
