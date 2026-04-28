'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import ProfilePrivacySection from '@/components/profile/ProfilePrivacySection';
import ProfileSecuritySection from '@/components/profile/ProfileSecuritySection';
import ProfileDangerZone from '@/components/profile/ProfileDangerZone';
import ProfileBioSection from '@/components/profile/ProfileBioSection';
import ProfileSocialLinksSection from '@/components/profile/ProfileSocialLinksSection';
import ProfileLocationSection from '@/components/profile/ProfileLocationSection';
import ProfilePoliticsSection from '@/components/profile/ProfilePoliticsSection';
import ProfileProfessionsSection from '@/components/profile/ProfileProfessionsSection';
import ProfileInterestsSection from '@/components/profile/ProfileInterestsSection';
import ProfileExpertiseSection from '@/components/profile/ProfileExpertiseSection';
import ProfileBadgesSection from '@/components/profile/ProfileBadgesSection';
import ProfileTwitchSection from '@/components/profile/ProfileTwitchSection';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

function ProfileContent() {
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');
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
    githubAvatar: '',
    googleAvatar: '',
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
    twitchChannel: '',
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
  const [avatarSourceUpdating, setAvatarSourceUpdating] = useState(false);
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
      throw new Error(tProfile('load_failed'));
    },
    [],
    {
      onSuccess: async (userData) => {
        const { username, firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, githubId, googleId, avatar, githubAvatar, googleAvatar, avatarColor, homeLocationId,
          profileCommentsEnabled, profileCommentsLocked, searchable, mobileTel, bio, socialLinks,
          dateOfBirth, professions, interests, expertiseArea, displayBadgeSlug, displayBadgeTier, nationality, twitchChannel } = userData;
        const loaded = {
          username: username || '',
          firstNameNative: firstNameNative || '',
          lastNameNative: lastNameNative || '',
          firstNameEn: firstNameEn || '',
          lastNameEn: lastNameEn || '',
          nickname: nickname || '',
          avatar: avatar || '',
          githubAvatar: githubAvatar || '',
          googleAvatar: googleAvatar || '',
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
          twitchChannel: twitchChannel || '',
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
        setHasPassword(typeof userData.hasPassword === 'boolean' ? userData.hasPassword : !!userData.password);

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
          error(err || tProfile('load_failed'));
      }
    }
  );

  // Handle OAuth callback query params
  useEffect(() => {
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (successParam === 'github_linked') {
      success(tProfile('github_linked_success'));
      setGithubLinked(true);
    } else if (successParam === 'google_linked') {
      success(tProfile('google_linked_success'));
      setGoogleLinked(true);
    } else if (errorParam) {
      const errorMessages = {
        unauthorized: tProfile('link_unauthorized'),
        user_not_found: tCommon('user_not_found'),
        github_already_linked: tProfile('github_already_linked'),
        google_already_linked: tProfile('google_already_linked')
      };
      error(errorMessages[errorParam] || tProfile('link_failed'));
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
        success(tProfile('display_badge_updated'));
      }
    } catch (_err) {
      error(tProfile('display_badge_update_failed'));
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
        success(tProfile('display_badge_cleared'));
      }
    } catch (_err) {
      error(tProfile('display_badge_clear_failed'));
    } finally {
      setSavingDisplayBadge(false);
    }
  };

  const handleManifestAccept = async (slug) => {
    try {
      const res = await manifestAPI.accept(slug);
      if (res?.success) {
        setManifestAcceptances((prev) => [...prev, { slug, acceptedAt: res.data?.acceptedAt || new Date().toISOString() }]);
        success(tProfile('manifest_accept_success'));
      }
    } catch (_err) {
      error(tProfile('manifest_accept_failed'));
    }
  };

  const handleManifestWithdraw = async (slug) => {
    try {
      const res = await manifestAPI.withdraw(slug);
      if (res?.success) {
        setManifestAcceptances((prev) => prev.filter((a) => a.slug !== slug));
        success(tProfile('manifest_withdraw_success'));
      }
    } catch (_err) {
      error(tProfile('manifest_withdraw_failed'));
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

  const handleProfileSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(profileData);
      setSavedProfileData({ ...profileData });
      setIsDirty(false);
      success(tProfile('updated_successfully'));
    } catch (err) {
      error(err.message || tProfile('update_failed'));
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
      error(tProfile('password_mismatch'));
      return;
    }
    if (passwordData.newPassword.length < 6) {
      error(tProfile('password_min_length'));
      return;
    }

    try {
      if (hasPassword) {
        await authAPI.updatePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
      } else {
        await authAPI.updatePassword({
          newPassword: passwordData.newPassword,
        });
        setHasPassword(true);
      }
      success(tProfile('password_updated'));
    } catch (err) {
      error(err.message || tProfile('password_update_failed'));
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
      error(err.message || tProfile('github_link_failed'));
    }
  };

  const handleUnlinkGithub = async () => {
    if (!confirm(tProfile('confirm_unlink_github'))) return;
    try {
      const response = await authAPI.unlinkGithub();
      if (response.success) {
        success(tProfile('github_unlinked'));
        setGithubLinked(false);
      }
    } catch (err) {
      error(err.message || tProfile('github_unlink_failed'));
    }
  };

  const handleLinkGoogle = async () => {
    try {
      const response = await authAPI.initiateGoogleOAuth('link');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || tProfile('google_link_failed'));
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm(tProfile('confirm_unlink_google'))) return;
    try {
      const response = await authAPI.unlinkGoogle();
      if (response.success) {
        success(tProfile('google_unlinked'));
        setGoogleLinked(false);
      }
    } catch (err) {
      error(err.message || tProfile('google_unlink_failed'));
    }
  };

  const handleAvatarSourceChange = async (source) => {
    setAvatarSourceUpdating(true);
    try {
      const response = await authAPI.updateAvatarSource(source);
      if (response.success && response.data?.user) {
        const updatedUser = response.data.user;
        setProfileData((prev) => ({
          ...prev,
          avatar: updatedUser.avatar || '',
          githubAvatar: updatedUser.githubAvatar || '',
          googleAvatar: updatedUser.googleAvatar || '',
        }));
        setSavedProfileData((prev) => (prev ? {
          ...prev,
          avatar: updatedUser.avatar || '',
          githubAvatar: updatedUser.githubAvatar || '',
          googleAvatar: updatedUser.googleAvatar || '',
        } : prev));
        setGithubLinked(!!updatedUser.githubId);
        setGoogleLinked(!!updatedUser.googleId);
        success(tProfile('avatar_updated'));
      }
    } catch (err) {
      error(err.message || tProfile('avatar_update_failed'));
    } finally {
      setAvatarSourceUpdating(false);
    }
  };

  const handleAvatarUpload = (avatarUrl) => {
    // Keep savedProfileData in sync so the dirty-state indicator
    // doesn't flag the auto-updated avatar URL as an unsaved change.
    setSavedProfileData((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));
  };

  const handleInteractionSettingsChange = (field, value) => {
    setInteractionSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleInteractionSettingsSave = async () => {
    setSavingInteraction(true);
    try {
      await commentAPI.updateUserProfileCommentSettings(user.id, interactionSettings);
      success(tProfile('settings_saved'));
    } catch (err) {
      error(err.message || tProfile('settings_save_failed'));
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

        {/* Στοιχεία Χρήστη */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('personal_info')}</h2>
          <ProfileBasicInfoForm
            profileData={profileData}
            onChange={handleProfileChange}
            currentUsername={savedProfileData?.username}
            onAvatarUploaded={handleAvatarUpload}
          />
        </Card>

        {/* Τοποθεσία & Εθνικότητα */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('location_nationality')}</h2>
          <ProfileLocationSection
            profileData={profileData}
            onChange={handleProfileChange}
            homeLocationId={profileData.homeLocationId}
            homeLocation={homeLocation}
            isOpen={showHomeLocation}
            onToggle={() => setShowHomeLocation((prev) => !prev)}
            onLocationChange={handleLocationChange}
          />
        </Card>

        {/* Πολιτική Τοποθέτηση */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('political_position')}</h2>
          <ProfilePoliticsSection
            profileData={profileData}
            onChange={handleProfileChange}
            manifests={manifestList.map((m) => {
              const acceptance = manifestAcceptances.find((a) => a.slug === m.slug);
              return { ...m, acceptedAt: acceptance ? acceptance.acceptedAt : null };
            })}
            onAccept={handleManifestAccept}
            onWithdraw={handleManifestWithdraw}
            manifestLoading={manifestLoading}
          />
        </Card>

        {/* Σχετικά με εμένα & Επικοινωνία */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('about_contact')}</h2>
          <ProfileBioSection
            profileData={profileData}
            onChange={handleProfileChange}
          />
        </Card>

        {/* Social Links */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('social_links')}</h2>
          <ProfileSocialLinksSection
            profileData={profileData}
            onSocialLinkChange={handleSocialLinkChange}
          />
        </Card>

        {/* Twitch Channel */}
        {(user?.isVerified || ['admin', 'moderator', 'editor'].includes(user?.role)) && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('twitch_channel')}</h2>
            <ProfileTwitchSection
              twitchChannel={profileData.twitchChannel}
              onChange={handleProfileChange}
            />
          </Card>
        )}

        {/* Επαγγέλματα & Τομέας Εμπειρογνωμοσύνης */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('professions_expertise')}</h2>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{tProfile('professions')} <span className="text-gray-400 text-xs font-normal">({tCommon('max_count', { count: 5 })})</span></h3>
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
          <hr className="my-6 border-gray-200" />
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{tProfile('expertise_area')} <span className="text-gray-400 text-xs font-normal">({tCommon('max_count', { count: 5 })})</span></h3>
          <ProfileExpertiseSection
            expertiseArea={profileData.expertiseArea}
            onAdd={(area) => setProfileData((prev) => ({ ...prev, expertiseArea: [...(prev.expertiseArea || []), area] }))}
            onRemove={(area) => setProfileData((prev) => ({ ...prev, expertiseArea: prev.expertiseArea.filter((a) => a !== area) }))}
          />
        </Card>

        {/* Ενδιαφέροντα */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('interests')}</h2>
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

        {/* Απόρρητο & Αλληλεπίδραση */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('preferences')}</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">{tProfile('language')}</label>
          <LanguageSwitcher />
        </Card>

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

        {/* Ασφάλεια */}
        <Card>
          <ProfileSecuritySection
            passwordData={passwordData}
            hasPassword={hasPassword}
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
            githubAvatar={profileData.githubAvatar}
            googleAvatar={profileData.googleAvatar}
            activeAvatar={profileData.avatar}
            onAvatarSourceChange={handleAvatarSourceChange}
            avatarSourceUpdating={avatarSourceUpdating}
            avatarSourceLabels={{
              avatarSource: tProfile('avatar_source'),
              chooseAvatarSource: tProfile('choose_avatar_source'),
              activeAvatar: tProfile('active_avatar'),
              useAvatar: tProfile('use_avatar'),
            }}
          />
        </Card>

        {/* Επικίνδυνη Ζώνη */}
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
            <p className="text-sm text-amber-600 font-medium">● {tProfile('unsaved_changes')}</p>
          ) : (
            <p className="text-sm text-gray-400">{tProfile('all_changes_saved')}</p>
          )}
          <button
            type="button"
            onClick={handleProfileSubmit}
            disabled={isSaving || !isDirty}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSaving ? tProfile('saving') : tProfile('save_changes')}
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
          <SkeletonLoader />
        </div>
      }>
        <ProfileContent />
      </Suspense>
    </ProtectedRoute>
  );
}
