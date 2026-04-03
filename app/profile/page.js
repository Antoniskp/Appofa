'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI, locationAPI, commentAPI, badgeAPI } from '@/lib/api';
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
import Link from 'next/link';

import professionsData from '@/src/data/professions.json';
import interestsData from '@/src/data/interests.json';
import { EXPERTISE_AREAS } from '@/lib/constants/expertiseAreas';

const SOCIAL_LINK_KEYS = ['website', 'x', 'twitter', 'instagram', 'facebook', 'linkedin', 'github', 'youtube', 'tiktok'];

const BADGE_TIER_EMOJI = { bronze: '🥉', silver: '🥈', gold: '🥇' };

function BadgeTierImage({ slug, tier, size = 'w-6 h-6' }) {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return <span className="text-base">{BADGE_TIER_EMOJI[tier] || '🏅'}</span>;
  }
  return (
    <img
      src={`/images/badges/${slug}-${tier}.svg`}
      alt={`${slug} ${tier}`}
      className={`${size} object-contain`}
      onError={() => setImgError(true)}
    />
  );
}

function ProfileContent() {
  const { user, updateProfile, deleteAccount } = useAuth();
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
    mobileTel: '',
    bio: '',
    socialLinks: {},
    dateOfBirth: '',
    professions: [],
    interests: [],
    expertiseArea: [],
  });
  const [homeLocation, setHomeLocation] = useState(null);
  const [showHomeLocation, setShowHomeLocation] = useState(false);
  const [badgeProgress, setBadgeProgress] = useState(null);
  const [badgeEvaluating, setBadgeEvaluating] = useState(false);
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

  const selectedProfSubProfessions = useMemo(() => {
    if (!profPicker.categoryId || !profPicker.professionId) return [];
    const cat = professionsData.categories.find(c => c.id === profPicker.categoryId);
    const prof = cat?.professions.find(p => p.id === profPicker.professionId);
    return prof?.subProfessions || [];
  }, [profPicker.categoryId, profPicker.professionId]);

  const selectedIntSubInterests = useMemo(() => {
    if (!intPicker.categoryId || !intPicker.interestId) return [];
    const cat = interestsData.categories.find(c => c.id === intPicker.categoryId);
    const interest = cat?.interests.find(i => i.id === intPicker.interestId);
    return interest?.subInterests || [];
  }, [intPicker.categoryId, intPicker.interestId]);

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
        const { username, firstName, lastName, githubId, googleId, avatar, avatarColor, homeLocationId,
          profileCommentsEnabled, profileCommentsLocked, searchable, mobileTel, bio, socialLinks,
          dateOfBirth, professions, interests, expertiseArea } = userData;
        setProfileData({
          username: username || '',
          firstName: firstName || '',
          lastName: lastName || '',
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
        });
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

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
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

  const calculateAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const resolveProfessionLabel = (entry) => {
    const cat = professionsData.categories.find(c => c.id === entry.categoryId);
    if (!cat) return entry.categoryId;
    const prof = cat.professions.find(p => p.id === entry.professionId);
    if (!prof) return `${cat.label} › ${entry.professionId}`;
    if (entry.subProfessionId) {
      const sub = prof.subProfessions.find(s => s.id === entry.subProfessionId);
      return `${cat.label} › ${prof.label}${sub ? ` › ${sub.label}` : ''}`;
    }
    return `${cat.label} › ${prof.label}`;
  };

  const resolveInterestLabel = (entry) => {
    const cat = interestsData.categories.find(c => c.id === entry.categoryId);
    if (!cat) return entry.categoryId;
    const interest = cat.interests.find(i => i.id === entry.interestId);
    if (!interest) return `${cat.label} › ${entry.interestId}`;
    if (entry.subInterestId) {
      const sub = interest.subInterests.find(s => s.id === entry.subInterestId);
      return `${cat.label} › ${interest.label}${sub ? ` › ${sub.label}` : ''}`;
    }
    return `${cat.label} › ${interest.label}`;
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
          {user?.username && (
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <Link href={`/users/${user.username}/followers`} className="hover:text-blue-600 hover:underline">
                Followers
              </Link>
              <Link href={`/users/${user.username}/following`} className="hover:text-blue-600 hover:underline">
                Following
              </Link>
            </div>
          )}
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
          </div>
        </Card>

        {/* Bio, mobile phone, and social links */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About &amp; Contact</h2>
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); handleProfileSubmit(e); }}
          >
            <div>
              <label htmlFor="mobileTel" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile phone <span className="text-gray-400 text-xs">(private)</span>
              </label>
              <input
                id="mobileTel"
                name="mobileTel"
                type="tel"
                value={profileData.mobileTel}
                onChange={handleProfileChange}
                maxLength={30}
                placeholder="+1 555 000 0000"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio <span className="text-gray-400 text-xs">(max 280 chars)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleProfileChange}
                maxLength={280}
                rows={3}
                placeholder="Tell us a bit about yourself..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">{(profileData.bio || '').length}/280</p>
            </div>
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of birth <span className="text-gray-400 text-xs">(private)</span>
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={profileData.dateOfBirth || ''}
                onChange={handleProfileChange}
                max={new Date().toISOString().split('T')[0]}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {profileData.dateOfBirth && calculateAge(profileData.dateOfBirth) !== null && (
                <p className="text-xs text-gray-500 mt-1">Age: {calculateAge(profileData.dateOfBirth)}</p>
              )}
            </div>
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Social links</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOCIAL_LINK_KEYS.map((key) => (
                  <div key={key}>
                    <label htmlFor={`social-${key}`} className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                      {key}
                    </label>
                    <input
                      id={`social-${key}`}
                      type="url"
                      value={(profileData.socialLinks && profileData.socialLinks[key]) || ''}
                      onChange={(e) => handleSocialLinkChange(key, e.target.value)}
                      placeholder={`https://${key === 'website' ? 'example.com' : key + '.com/yourprofile'}`}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Save changes
            </button>
          </form>
        </Card>

        {/* Professions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Professions <span className="text-gray-400 text-xs font-normal">(max 5)</span></h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(profileData.professions || []).map((entry, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {resolveProfessionLabel(entry)}
                  <button
                    type="button"
                    onClick={() => setProfileData((prev) => ({ ...prev, professions: prev.professions.filter((_, i) => i !== idx) }))}
                    className="ml-1 text-blue-600 hover:text-blue-900 font-bold leading-none"
                    aria-label="Remove profession"
                  >✕</button>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={profPicker.categoryId}
                onChange={(e) => setProfPicker({ categoryId: e.target.value, professionId: '', subProfessionId: '' })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Category —</option>
                {professionsData.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <select
                value={profPicker.professionId}
                onChange={(e) => setProfPicker((prev) => ({ ...prev, professionId: e.target.value, subProfessionId: '' }))}
                disabled={!profPicker.categoryId}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">— Profession —</option>
                {profPicker.categoryId && (professionsData.categories.find(c => c.id === profPicker.categoryId)?.professions || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <select
                value={profPicker.subProfessionId}
                onChange={(e) => setProfPicker((prev) => ({ ...prev, subProfessionId: e.target.value }))}
                disabled={!profPicker.professionId || !selectedProfSubProfessions.length}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">— Sub-profession (optional) —</option>
                {selectedProfSubProfessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={(profileData.professions || []).length >= 5 || !profPicker.categoryId || !profPicker.professionId}
                onClick={() => {
                  const entry = { categoryId: profPicker.categoryId, professionId: profPicker.professionId };
                  if (profPicker.subProfessionId) entry.subProfessionId = profPicker.subProfessionId;
                  setProfileData((prev) => ({ ...prev, professions: [...(prev.professions || []), entry] }));
                  setProfPicker({ categoryId: '', professionId: '', subProfessionId: '' });
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleProfileSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition"
              >
                Save changes
              </button>
            </div>
          </div>
        </Card>

        {/* Interests */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests <span className="text-gray-400 text-xs font-normal">(max 10)</span></h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(profileData.interests || []).map((entry, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {resolveInterestLabel(entry)}
                  <button
                    type="button"
                    onClick={() => setProfileData((prev) => ({ ...prev, interests: prev.interests.filter((_, i) => i !== idx) }))}
                    className="ml-1 text-green-600 hover:text-green-900 font-bold leading-none"
                    aria-label="Remove interest"
                  >✕</button>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={intPicker.categoryId}
                onChange={(e) => setIntPicker({ categoryId: e.target.value, interestId: '', subInterestId: '' })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Category —</option>
                {interestsData.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <select
                value={intPicker.interestId}
                onChange={(e) => setIntPicker((prev) => ({ ...prev, interestId: e.target.value, subInterestId: '' }))}
                disabled={!intPicker.categoryId}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">— Interest —</option>
                {intPicker.categoryId && (interestsData.categories.find(c => c.id === intPicker.categoryId)?.interests || []).map((i) => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </select>
              <select
                value={intPicker.subInterestId}
                onChange={(e) => setIntPicker((prev) => ({ ...prev, subInterestId: e.target.value }))}
                disabled={!intPicker.interestId || !selectedIntSubInterests.length}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">— Sub-interest (optional) —</option>
                {selectedIntSubInterests.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={(profileData.interests || []).length >= 10 || !intPicker.categoryId || !intPicker.interestId}
                onClick={() => {
                  const entry = { categoryId: intPicker.categoryId, interestId: intPicker.interestId };
                  if (intPicker.subInterestId) entry.subInterestId = intPicker.subInterestId;
                  setProfileData((prev) => ({ ...prev, interests: [...(prev.interests || []), entry] }));
                  setIntPicker({ categoryId: '', interestId: '', subInterestId: '' });
                }}
                className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleProfileSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition"
              >
                Save changes
              </button>
            </div>
          </div>
        </Card>

        {/* Expertise Area */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expertise Area <span className="text-gray-400 text-xs font-normal">(select up to 5)</span></h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(profileData.expertiseArea || []).map((area) => (
                <span key={area} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  {area}
                  <button
                    type="button"
                    onClick={() => setProfileData((prev) => ({ ...prev, expertiseArea: prev.expertiseArea.filter((a) => a !== area) }))}
                    className="ml-1 text-purple-600 hover:text-purple-900 font-bold leading-none"
                    aria-label={`Remove ${area}`}
                  >✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {EXPERTISE_AREAS.filter((area) => !(profileData.expertiseArea || []).includes(area)).map((area) => (
                <button
                  key={area}
                  type="button"
                  disabled={(profileData.expertiseArea || []).length >= 5}
                  onClick={() => setProfileData((prev) => ({ ...prev, expertiseArea: [...(prev.expertiseArea || []), area] }))}
                  className="inline-flex items-center px-3 py-1 rounded-full border border-purple-300 text-xs text-purple-700 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {area}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleProfileSubmit}
              className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition"
            >
              Save changes
            </button>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Τα Badges μου</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleEvaluateBadges}
                disabled={badgeEvaluating}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {badgeEvaluating ? 'Αξιολόγηση...' : 'Αξιολόγηση τώρα'}
              </button>
              <Link href="/platform/badges" className="text-xs text-blue-600 hover:underline">
                Πληροφορίες →
              </Link>
            </div>
          </div>
          {badgeProgress === null ? (
            <p className="text-sm text-gray-500">Φόρτωση badges...</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                badgeProgress.reduce((acc, badge) => {
                  const cat = badge.category || 'other';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(badge);
                  return acc;
                }, {})
              ).map(([category, categoryBadges]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 capitalize">{category}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoryBadges.map((badge) => (
                      <div key={badge.slug} className="border border-gray-100 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-800 mb-2">{badge.name}</p>
                        <div className="space-y-1.5">
                          {badge.tiers.map((t) => (
                            <div key={t.tier} className={`flex items-center gap-2 ${t.earned ? '' : 'opacity-60'}`}>
                              <BadgeTierImage slug={badge.slug} tier={t.tier} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-700 capitalize">{t.label || t.tier}</span>
                                  {t.earned ? (
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ {t.earnedAt ? new Date(t.earnedAt).toLocaleDateString('el-GR') : ''}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">{t.progress}%</span>
                                  )}
                                </div>
                                {!t.earned && (
                                  <div className="mt-0.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-400 rounded-full"
                                      style={{ width: `${t.progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Danger Zone: account deletion */}
        <Card>
          <ProfileDangerZone
            hasPassword={hasPassword}
            onDeleteAccount={handleDeleteAccount}
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
