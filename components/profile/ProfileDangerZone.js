'use client';

import { useState } from 'react';
import FormInput from '@/components/ui/FormInput';

/**
 * Danger Zone section for the profile page: account deletion with password confirmation.
 *
 * @param {Object} props
 * @param {boolean} props.hasPassword - Whether the user has a password set
 * @param {Function} props.onDeleteAccount - async ({ password, mode }) => void
 */
export default function ProfileDangerZone({ hasPassword, onDeleteAccount }) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('anonymize');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpen = () => {
    setIsOpen(true);
    setPassword('');
    setMode('anonymize');
    setErrorMsg('');
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPassword('');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (hasPassword) {
      if (!password) {
        setErrorMsg('Please enter your password to confirm.');
        return;
      }
    } else if (password !== 'DELETE') {
      setErrorMsg('Type "DELETE" to confirm account deletion.');
      return;
    }
    setLoading(true);
    try {
      await onDeleteAccount({ password: hasPassword ? password : null, mode });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-red-700 mb-1">Danger Zone</h2>
      <p className="text-sm text-gray-600 mb-4">
        Deleting your account is permanent and cannot be undone.
      </p>

      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          className="px-4 py-2 text-sm font-medium rounded border transition text-red-600 border-red-600 hover:bg-red-50"
        >
          Delete my account
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 border border-red-200 rounded-lg p-4 bg-red-50">
          <p className="text-sm font-medium text-gray-800">
            Choose what happens to your content:
          </p>

          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="deleteMode"
                value="anonymize"
                checked={mode === 'anonymize'}
                onChange={() => setMode('anonymize')}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">Anonymize</span> — Remove your personal information and disable login,
                but keep your content (articles, polls) without attribution.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="deleteMode"
                value="purge"
                checked={mode === 'purge'}
                onChange={() => setMode('purge')}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">Purge</span> — Permanently delete your account and all your content.
              </span>
            </label>
          </div>

          <FormInput
            name="deletePassword"
            type={hasPassword ? 'password' : 'text'}
            label={hasPassword ? 'Confirm your password' : 'Type "DELETE" to confirm'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={hasPassword ? 'current-password' : 'off'}
          />

          {errorMsg && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Deleting…' : 'Confirm deletion'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
