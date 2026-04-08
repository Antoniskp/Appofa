'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import { DEFAULT_AVATAR_COLOR } from '@/lib/constants/profile';
import { authAPI } from '@/lib/api';

const USERNAME_CHECK_DEBOUNCE_MS = 500;

const COUNTRY_OPTIONS = [
  { code: '', label: '— Καμία / None —' },
  { code: 'GR', label: 'GR — Greece' },
  { code: 'CY', label: 'CY — Cyprus' },
  { code: 'DE', label: 'DE — Germany' },
  { code: 'GB', label: 'GB — United Kingdom' },
  { code: 'US', label: 'US — United States' },
  { code: 'FR', label: 'FR — France' },
  { code: 'IT', label: 'IT — Italy' },
  { code: 'ES', label: 'ES — Spain' },
  { code: 'AU', label: 'AU — Australia' },
  { code: 'CA', label: 'CA — Canada' },
  { code: 'NL', label: 'NL — Netherlands' },
  { code: 'BE', label: 'BE — Belgium' },
  { code: 'AT', label: 'AT — Austria' },
  { code: 'CH', label: 'CH — Switzerland' },
  { code: 'SE', label: 'SE — Sweden' },
  { code: 'NO', label: 'NO — Norway' },
  { code: 'DK', label: 'DK — Denmark' },
  { code: 'PT', label: 'PT — Portugal' },
  { code: 'PL', label: 'PL — Poland' },
  { code: 'CZ', label: 'CZ — Czech Republic' },
  { code: 'SK', label: 'SK — Slovakia' },
  { code: 'HU', label: 'HU — Hungary' },
  { code: 'RO', label: 'RO — Romania' },
  { code: 'BG', label: 'BG — Bulgaria' },
  { code: 'RS', label: 'RS — Serbia' },
  { code: 'AL', label: 'AL — Albania' },
  { code: 'MK', label: 'MK — North Macedonia' },
  { code: 'TR', label: 'TR — Turkey' },
  { code: 'RU', label: 'RU — Russia' },
  { code: 'UA', label: 'UA — Ukraine' },
  { code: 'IL', label: 'IL — Israel' },
  { code: 'JP', label: 'JP — Japan' },
  { code: 'CN', label: 'CN — China' },
  { code: 'IN', label: 'IN — India' },
  { code: 'BR', label: 'BR — Brazil' },
  { code: 'AR', label: 'AR — Argentina' },
  { code: 'ZA', label: 'ZA — South Africa' },
  { code: 'NG', label: 'NG — Nigeria' },
  { code: 'MX', label: 'MX — Mexico' },
  { code: 'NZ', label: 'NZ — New Zealand' },
];

const MAX_LANGUAGES = 10;

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
 * username, native name, English name, nickname, avatar URL, avatar color,
 * nationality, and languages spoken.
 *
 * @param {Object} props
 * @param {Object} props.profileData - { username, firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, avatar, avatarColor, nationality, languagesSpoken }
 * @param {Function} props.onChange - (event) => void, handles name/value input changes
 * @param {Function} props.onLanguagesChange - (newArray) => void, handles languagesSpoken array changes
 * @param {string} [props.currentUsername] - The saved username (to skip self-check)
 */
export default function ProfileBasicInfoForm({ profileData, onChange, onLanguagesChange, currentUsername }) {
  const [avatarUrlError, setAvatarUrlError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'error'
  const [langInput, setLangInput] = useState('');
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

  const languages = profileData.languagesSpoken || [];

  const handleAddLanguage = () => {
    const tag = langInput.trim();
    if (!tag) return;
    if (languages.length >= MAX_LANGUAGES) return;
    if (!languages.includes(tag)) {
      onLanguagesChange([...languages, tag]);
    }
    setLangInput('');
  };

  const handleRemoveLanguage = (tag) => {
    onLanguagesChange(languages.filter((l) => l !== tag));
  };

  const handleLangKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLanguage();
    }
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

      <div>
        <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
          Εθνικότητα / Nationality
        </label>
        <select
          id="nationality"
          name="nationality"
          value={profileData.nationality || ''}
          onChange={onChange}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {COUNTRY_OPTIONS.map(({ code, label }) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Γλώσσες / Languages Spoken{' '}
          <span className="text-gray-400 text-xs font-normal">(max {MAX_LANGUAGES})</span>
        </label>
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {lang}
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang)}
                  className="text-blue-500 hover:text-blue-700 leading-none"
                  aria-label={`Remove ${lang}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
            onKeyDown={handleLangKeyDown}
            placeholder="e.g. el, en, zh-Hant"
            disabled={languages.length >= MAX_LANGUAGES}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="button"
            onClick={handleAddLanguage}
            disabled={languages.length >= MAX_LANGUAGES || !langInput.trim()}
            className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">Use BCP-47 tags (e.g. el, en, zh-Hant). Press Enter or click Add.</p>
      </div>
    </div>
  );
}

