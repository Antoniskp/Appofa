'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import { DEFAULT_AVATAR_COLOR } from '@/lib/constants/profile';
import { authAPI } from '@/lib/api';

/**
 * Tries to detect if a string is a valid absolute URL (http/https).
 */
function isValidHttpUrl(str) {
  if (!str) return true; // empty is allowed
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Form section for updating basic profile information:
 * username, first/last name, avatar URL, and avatar color.
 *
 * @param {Object} props
 * @param {Object} props.profileData - { username, firstName, lastName, avatar, avatarColor }
 * @param {Function} props.onChange - (event) => void, handles name/value input changes
 * @param {string} [props.currentUsername] - The saved username (to skip self-check)
 */
export default function ProfileBasicInfoForm({ profileData, onChange, currentUsername }) {
  const [avatarUrlError, setAvatarUrlError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'error'
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
    debounceRef.current = setTimeout(() => checkUsername(value), 500);
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
          name="firstName"
          type="text"
          label="First name"
          value={profileData.firstName}
          onChange={onChange}
          autoComplete="given-name"
        />
        <FormInput
          name="lastName"
          type="text"
          label="Last name"
          value={profileData.lastName}
          onChange={onChange}
          autoComplete="family-name"
        />
      </div>
    </div>
  );
}

