'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import { DEFAULT_AVATAR_COLOR } from '@/lib/constants/profile';
import { authAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { isAcceptedAvatarFile } from '@/lib/utils/avatarFileValidation';
import { normalizeUploadImage, isHeicFile, UPLOAD_PRESETS } from '@/lib/utils/normalizeUploadImage';

const USERNAME_CHECK_DEBOUNCE_MS = 500;
/** Accepted MIME types / extensions for avatar upload (must match backend allowlist). */
const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence', '.heic', '.heif'];

/**
 * Tries to detect if a string is a valid absolute URL (http/https) or a
 * server-generated upload path (/uploads/...).
 */
function isValidHttpUrl(str) {
  if (!str) return true; // empty is allowed
  if (str.startsWith('/uploads/')) return true; // server-generated upload paths
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Form section for updating basic profile information:
 * username, native name, English name, nickname, avatar URL, and avatar color.
 *
 * @param {Object} props
 * @param {Object} props.profileData - { username, firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, avatar, avatarColor }
 * @param {Function} props.onChange - (event) => void, handles name/value input changes
 * @param {string} [props.currentUsername] - The saved username (to skip self-check)
 * @param {Function} [props.onAvatarUploaded] - (avatarUrl: string) => void, called after a successful avatar upload so the parent can sync savedProfileData
 */
export default function ProfileBasicInfoForm({ profileData, onChange, currentUsername, onAvatarUploaded }) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [avatarUrlError, setAvatarUrlError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'error'
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadStep, setUploadStep] = useState(''); // '' | 'converting' | 'uploading'
  const avatarFileRef = useRef(null);
  const debounceRef = useRef(null);

  const handleAvatarChange = (e) => {
    const { value } = e.target;
    onChange(e);
    if (value && !isValidHttpUrl(value)) {
      setAvatarUrlError('Please enter a valid URL (must start with http:// or https://).');
    } else {
      setAvatarUrlError('');
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after an error
    if (avatarFileRef.current) avatarFileRef.current.value = '';

    if (!isAcceptedAvatarFile(file)) {
      toastError('Unsupported file type. Please use JPEG, PNG, WebP, or HEIC/HEIF.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Show a contextual processing label before the async work starts.
      if (isHeicFile(file)) {
        setUploadStep('converting');
      } else if (file.size > UPLOAD_PRESETS.avatar.maxBytes) {
        setUploadStep('compressing');
      }
      const uploadFile = await normalizeUploadImage(file, UPLOAD_PRESETS.avatar);
      setUploadStep('uploading');
      const response = await authAPI.uploadAvatar(uploadFile);
      if (response.success && response.data?.avatarUrl) {
        const newUrl = response.data.avatarUrl;
        // Append cache-buster so the browser immediately fetches the new image
        const ts = response.data.avatarUpdatedAt
          ? new Date(response.data.avatarUpdatedAt).getTime()
          : Date.now();
        const bustedUrl = `${newUrl}?v=${ts}`;
        // Propagate the new URL into the controlled form field
        onChange({ target: { name: 'avatar', value: bustedUrl } });
        // Notify parent to sync savedProfileData so the form stays clean
        onAvatarUploaded?.(bustedUrl);
        toastSuccess('Avatar uploaded successfully!');
      }
    } catch (err) {
      toastError(err.message || 'Failed to upload avatar.');
    } finally {
      setIsUploadingAvatar(false);
      setUploadStep('');
    }
  };

  const checkUsername = useCallback(async (username) => {
    if (!username || username === currentUsername) {
      setUsernameStatus(null);
      return;
    }
    if (username.length < 3) {
      setUsernameStatus(null);
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await authAPI.checkUsernameAvailability(username);
      setUsernameStatus(res.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('error');
    }
  }, [currentUsername]);

  const handleUsernameChange = (e) => {
    onChange(e);
    const value = e.target.value;
    clearTimeout(debounceRef.current);
    if (!value || value === currentUsername) {
      setUsernameStatus(null);
      return;
    }
    debounceRef.current = setTimeout(() => checkUsername(value), USERNAME_CHECK_DEBOUNCE_MS);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const usernameHint = () => {
    if (usernameStatus === 'checking') return <span className="text-gray-500 text-xs">Checking availability…</span>;
    if (usernameStatus === 'available') return <span className="text-green-600 text-xs">✓ Username is available</span>;
    if (usernameStatus === 'taken') return <span className="text-red-600 text-xs">✗ Username is already taken</span>;
    if (usernameStatus === 'error') return <span className="text-yellow-600 text-xs">Could not check availability</span>;
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <FormInput
          name="username"
          type="text"
          label="Username"
          value={profileData.username}
          onChange={handleUsernameChange}
          autoComplete="username"
        />
        {usernameHint() && <p className="mt-1">{usernameHint()}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          {/* Avatar preview + upload */}
          <div className="flex items-center gap-3 mb-2">
            {profileData.avatar && (
              <img
                src={profileData.avatar}
                alt="Current avatar"
                className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <FormInput
                name="avatar"
                type="text"
                label="Avatar image URL"
                value={profileData.avatar}
                onChange={handleAvatarChange}
                placeholder="https://example.com/avatar.png"
              />
              {avatarUrlError && (
                <p className="mt-1 text-xs text-red-600">{avatarUrlError}</p>
              )}
            </div>
          </div>
          {/* Hidden file input + visible upload button */}
          <input
            ref={avatarFileRef}
            type="file"
            accept={AVATAR_ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleAvatarFileChange}
            aria-label="Upload avatar image"
          />
          <button
            type="button"
            onClick={() => avatarFileRef.current?.click()}
            disabled={isUploadingAvatar}
            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isUploadingAvatar ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {uploadStep === 'converting' ? 'Converting…' : uploadStep === 'compressing' ? 'Compressing…' : 'Uploading…'}
              </>
            ) : (
              'Upload Photo'
            )}
          </button>
          <p className="mt-1 text-xs text-gray-500">JPEG, PNG, WebP or HEIC/HEIF · max 5 MB</p>
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
            onChange={onChange}
            className="h-11 w-full rounded-md border border-gray-300 bg-white px-2 py-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          name="firstNameNative"
          type="text"
          label="Όνομα"
          value={profileData.firstNameNative}
          onChange={onChange}
          autoComplete="given-name"
        />
        <FormInput
          name="lastNameNative"
          type="text"
          label="Επώνυμο"
          value={profileData.lastNameNative}
          onChange={onChange}
          autoComplete="family-name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          name="firstNameEn"
          type="text"
          label="First name (English)"
          value={profileData.firstNameEn}
          onChange={onChange}
          autoComplete="given-name"
        />
        <FormInput
          name="lastNameEn"
          type="text"
          label="Last name (English)"
          value={profileData.lastNameEn}
          onChange={onChange}
          autoComplete="family-name"
        />
      </div>

      <div>
        <FormInput
          name="nickname"
          type="text"
          label="Παρατσούκλι / Nickname"
          value={profileData.nickname}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

