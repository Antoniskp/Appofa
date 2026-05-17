'use client';

/**
 * Privacy & Interaction settings section.
 * Displays toggles for profile comments and profile visibility.
 *
 * @param {Object} props
 * @param {string} props.profileVisibility - hidden|registered|public
 * @param {boolean} props.profileCommentsEnabled - Whether profile comments are on
 * @param {boolean} props.profileCommentsLocked - Whether profile comments are locked
 * @param {Function} props.onChange - (field: string, value: boolean) => void
 * @param {Function} props.onSave - () => void  called when Save is clicked
 * @param {boolean} props.saving - Whether a save is in progress
 */
export default function ProfilePrivacySection({
  profileVisibility,
  profileCommentsEnabled,
  profileCommentsLocked,
  onChange,
  onSave,
  saving,
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Privacy &amp; Interaction</h2>

      {/* Allow comments */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Allow comments on my profile</p>
          <p className="text-xs text-gray-500 mt-0.5">
            When enabled, other users can leave comments on your profile page.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={profileCommentsEnabled}
          onClick={() => onChange('profileCommentsEnabled', !profileCommentsEnabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            profileCommentsEnabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              profileCommentsEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Lock comments */}
      <div className={`flex items-start justify-between gap-4 ${!profileCommentsEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <div>
          <p className="text-sm font-medium text-gray-700">Lock profile comments</p>
          <p className="text-xs text-gray-500 mt-0.5">
            When locked, existing comments remain visible but no new comments can be posted.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={profileCommentsLocked}
          disabled={!profileCommentsEnabled}
          onClick={() => onChange('profileCommentsLocked', !profileCommentsLocked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            profileCommentsLocked ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              profileCommentsLocked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Profile visibility */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Profile visibility</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose who can discover and open your profile. You can change this anytime.
          </p>
        </div>
        <div className="space-y-2 rounded-lg border border-gray-200 p-3">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="profileVisibility"
              value="hidden"
              checked={profileVisibility === 'hidden'}
              onChange={() => onChange('profileVisibility', 'hidden')}
              className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Hidden — visible only to you and moderators/admins.</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="profileVisibility"
              value="registered"
              checked={profileVisibility === 'registered'}
              onChange={() => onChange('profileVisibility', 'registered')}
              className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Registered users — visible to logged-in users.</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="profileVisibility"
              value="public"
              checked={profileVisibility === 'public'}
              onChange={() => onChange('profileVisibility', 'public')}
              className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Public — visible to everyone.</span>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}
