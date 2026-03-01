'use client';

import { useState } from 'react';
import FormInput from '@/components/FormInput';

const DEFAULT_AVATAR_COLOR = '#64748b';

/**
 * Form section for updating basic profile information:
 * username, first/last name, avatar URL, and avatar color.
 *
 * @param {Object} props
 * @param {Object} props.profileData - { username, firstName, lastName, avatar, avatarColor }
 * @param {Function} props.onChange - (event) => void, handles name/value input changes
 * @param {Function} props.onSubmit - (event) => void, handles form submission
 */
export default function ProfileBasicInfoForm({ profileData, onChange, onSubmit }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const initials = (profileData.username || 'U').slice(0, 1).toUpperCase();

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex items-center gap-4">
        <div
          className="h-16 w-16 rounded-full border border-gray-200 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
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
            <span>{initials}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Profile avatar</p>
          <p className="text-xs text-gray-500">Add an image URL or use your initials.</p>
        </div>
      </div>

      <FormInput
        name="username"
        type="text"
        label="Username"
        value={profileData.username}
        onChange={onChange}
        autoComplete="username"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          name="avatar"
          type="url"
          label="Avatar image URL"
          value={profileData.avatar}
          onChange={onChange}
          placeholder="https://example.com/avatar.png"
        />
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

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Save changes
      </button>
    </form>
  );
}
