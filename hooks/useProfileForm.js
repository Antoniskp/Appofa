'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authAPI, locationAPI, commentAPI, badgeAPI, manifestAPI, newsletterAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';

const INITIAL_PROFILE_DATA = {
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
};

export function useProfileForm() {
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { user, updateProfile, deleteAccount } = useAuth();
  const { success, error } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [profileData, setProfileData] = useState(INITIAL_PROFILE_DATA);
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
  const [newsletterPreference, setNewsletterPreference] = useState({
    subscribed: false,
    loaded: false,
    saving: false,
  });
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
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [profPicker, setProfPicker] = useState({ domainId: '', professionId: '', specializationId: '', subspecializationId: '' });
  const [intPicker, setIntPicker] = useState({ categoryId: '', interestId: '', subInterestId: '' });
  const [followersCount, setFollowersCount] = useState(undefined);
  const [followingCount, setFollowingCount] = useState(undefined);
  const [manifestList, setManifestList] = useState([]);
  const [manifestAcceptances, setManifestAcceptances] = useState([]);
  const [manifestLoading, setManifestLoading] = useState(true);

  useEffect(() => {
    if (!savedProfileData) return;
    const dirty = JSON.stringify(profileData) !== JSON.stringify(savedProfileData);
    setIsDirty(dirty);
  }, [profileData, savedProfileData]);

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
        const {
          username,
          firstNameNative,
          lastNameNative,
          firstNameEn,
          lastNameEn,
          nickname,
          githubId,
          googleId,
          avatar,
          githubAvatar,
          googleAvatar,
          avatarColor,
          homeLocationId,
          profileCommentsEnabled,
          profileCommentsLocked,
          searchable,
          mobileTel,
          bio,
          socialLinks,
          dateOfBirth,
          professions,
          interests,
          expertiseArea,
          displayBadgeSlug,
          displayBadgeTier,
          nationality,
          twitchChannel,
        } = userData;

        const rawAvatarUrl = userData.avatarUrl || null;
        const nextUploadedAvatarUrl = rawAvatarUrl && userData.avatarUpdatedAt
          ? `${rawAvatarUrl}?v=${new Date(userData.avatarUpdatedAt).getTime()}`
          : rawAvatarUrl;

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
        setUploadedAvatarUrl(nextUploadedAvatarUrl);
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

        try {
          const newsletterResponse = await newsletterAPI.getMyPreference();
          if (newsletterResponse?.success) {
            setNewsletterPreference({
              subscribed: !!newsletterResponse.data?.subscribed,
              loaded: true,
              saving: false,
            });
          } else {
            setNewsletterPreference((prev) => ({ ...prev, loaded: true, saving: false }));
          }
        } catch (_newsletterError) {
          setNewsletterPreference((prev) => ({ ...prev, loaded: true, saving: false }));
        }

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
      },
    }
  );

  useEffect(() => {
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const verifiedParam = searchParams.get('verified');

    if (successParam === 'github_linked') {
      success(tProfile('github_linked_success'));
      setGithubLinked(true);
    } else if (successParam === 'google_linked') {
      success(tProfile('google_linked_success'));
      setGoogleLinked(true);
    } else if (verifiedParam === '1') {
      success(tProfile('email_verified_success'));
    } else if (errorParam) {
      const errorMessages = {
        unauthorized: tProfile('link_unauthorized'),
        user_not_found: tCommon('user_not_found'),
        github_already_linked: tProfile('github_already_linked'),
        google_already_linked: tProfile('google_already_linked'),
      };
      error(errorMessages[errorParam] || tProfile('link_failed'));
    }

    if (successParam || errorParam || verifiedParam) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('success');
      nextParams.delete('error');
      nextParams.delete('verified');
      const nextUrl = nextParams.toString() ? `${pathname}?${nextParams}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [searchParams, success, error, pathname, router, tProfile, tCommon]);

  useEffect(() => {
    badgeAPI.getMyProgress()
      .then((res) => {
        if (res?.data?.badges) setBadgeProgress(res.data.badges);
      })
      .catch(() => {});
  }, []);

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

  const manifests = useMemo(() => (
    manifestList.map((manifest) => {
      const acceptance = manifestAcceptances.find((item) => item.slug === manifest.slug);
      return { ...manifest, acceptedAt: acceptance ? acceptance.acceptedAt : null };
    })
  ), [manifestList, manifestAcceptances]);

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
        setManifestAcceptances((prev) => prev.filter((item) => item.slug !== slug));
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

  const handleProfileSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
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
    setSavedProfileData((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));
    setUploadedAvatarUrl(avatarUrl);
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

  const handleNewsletterPreferenceToggle = async () => {
    if (!newsletterPreference.loaded || newsletterPreference.saving) return;
    const nextSubscribed = !newsletterPreference.subscribed;
    setNewsletterPreference((prev) => ({ ...prev, saving: true }));
    try {
      const response = await newsletterAPI.updateMyPreference({ subscribed: nextSubscribed });
      if (response?.success) {
        setNewsletterPreference({
          subscribed: !!response.data?.subscribed,
          loaded: true,
          saving: false,
        });
        success(tProfile('newsletter_settings_saved'));
      } else {
        throw new Error(tProfile('newsletter_settings_save_failed'));
      }
    } catch (err) {
      setNewsletterPreference((prev) => ({ ...prev, saving: false }));
      error(err.message || tProfile('newsletter_settings_save_failed'));
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

  const handleAddProfession = () => {
    const entry = { domainId: profPicker.domainId, professionId: profPicker.professionId };
    if (profPicker.specializationId) entry.specializationId = profPicker.specializationId;
    if (profPicker.subspecializationId) entry.subspecializationId = profPicker.subspecializationId;
    setProfileData((prev) => ({ ...prev, professions: [...(prev.professions || []), entry] }));
    setProfPicker({ domainId: '', professionId: '', specializationId: '', subspecializationId: '' });
  };

  const handleRemoveProfession = (idx) => {
    setProfileData((prev) => ({ ...prev, professions: prev.professions.filter((_, i) => i !== idx) }));
  };

  const handleAddExpertise = (area) => {
    setProfileData((prev) => ({ ...prev, expertiseArea: [...(prev.expertiseArea || []), area] }));
  };

  const handleRemoveExpertise = (area) => {
    setProfileData((prev) => ({ ...prev, expertiseArea: prev.expertiseArea.filter((item) => item !== area) }));
  };

  const handleAddInterest = () => {
    const entry = { categoryId: intPicker.categoryId, interestId: intPicker.interestId };
    if (intPicker.subInterestId) entry.subInterestId = intPicker.subInterestId;
    setProfileData((prev) => ({ ...prev, interests: [...(prev.interests || []), entry] }));
    setIntPicker({ categoryId: '', interestId: '', subInterestId: '' });
  };

  const handleRemoveInterest = (idx) => {
    setProfileData((prev) => ({ ...prev, interests: prev.interests.filter((_, i) => i !== idx) }));
  };

  return {
    loading,
    user,
    oauthConfig,
    profileData,
    savedProfileData,
    isDirty,
    isSaving,
    homeLocation,
    showHomeLocation,
    badgeProgress,
    badgeEvaluating,
    displayBadge,
    savingDisplayBadge,
    interactionSettings,
    savingInteraction,
    newsletterPreference,
    passwordData,
    showPasswordFields,
    githubLinked,
    googleLinked,
    avatarSourceUpdating,
    uploadedAvatarUrl,
    hasPassword,
    profPicker,
    intPicker,
    followersCount,
    followingCount,
    manifestLoading,
    manifests,
    setShowHomeLocation,
    setProfPicker,
    setIntPicker,
    handleProfileChange,
    handleProfileSubmit,
    handlePasswordChange,
    handlePasswordSubmit,
    handleSocialLinkChange,
    handleInteractionSettingsChange,
    handleInteractionSettingsSave,
    handleNewsletterPreferenceToggle,
    handleManifestAccept,
    handleManifestWithdraw,
    handleEvaluateBadges,
    handleSelectDisplayBadge,
    handleClearDisplayBadge,
    handleAvatarSourceChange,
    handleAvatarUpload,
    handleLocationChange,
    handleLinkGithub,
    handleUnlinkGithub,
    handleLinkGoogle,
    handleUnlinkGoogle,
    handleDeleteAccount,
    togglePasswordSection,
    handleAddProfession,
    handleRemoveProfession,
    handleAddExpertise,
    handleRemoveExpertise,
    handleAddInterest,
    handleRemoveInterest,
  };
}
