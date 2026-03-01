'use client';

import FormInput from '@/components/FormInput';

// GitHub SVG icon
function GithubIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Google SVG icon
function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/**
 * Security section: password change form and OAuth (GitHub/Google) connection management.
 *
 * @param {Object} props
 * @param {Object} props.passwordData - { currentPassword, newPassword, confirmPassword }
 * @param {Function} props.onPasswordChange - (event) => void
 * @param {Function} props.onPasswordSubmit - (event) => void
 * @param {boolean} props.showPasswordFields - Whether the password form is expanded
 * @param {Function} props.onTogglePassword - () => void
 * @param {boolean} props.githubLinked - Whether GitHub is connected
 * @param {boolean} props.googleLinked - Whether Google is connected
 * @param {Object} props.oauthConfig - { github: boolean, google: boolean }
 * @param {Function} props.onLinkGithub - () => void
 * @param {Function} props.onUnlinkGithub - () => void
 * @param {Function} props.onLinkGoogle - () => void
 * @param {Function} props.onUnlinkGoogle - () => void
 */
export default function ProfileSecuritySection({
  passwordData,
  onPasswordChange,
  onPasswordSubmit,
  showPasswordFields,
  onTogglePassword,
  githubLinked,
  googleLinked,
  oauthConfig,
  onLinkGithub,
  onUnlinkGithub,
  onLinkGoogle,
  onUnlinkGoogle,
}) {
  return (
    <div className="space-y-6">
      {/* Password change */}
      <div>
        <button
          type="button"
          onClick={onTogglePassword}
          aria-expanded={showPasswordFields}
          aria-controls="password-panel"
          className="w-full h-11 flex items-center justify-between text-gray-900"
        >
          <span className="text-lg font-semibold">Change password</span>
          <span className="text-xs text-gray-500">{showPasswordFields ? 'Hide' : 'Edit'}</span>
        </button>
        <div
          id="password-panel"
          aria-hidden={!showPasswordFields}
          className={`pt-2 transition-all duration-800 ease-in-out ${
            showPasswordFields
              ? 'max-h-[360px] opacity-100'
              : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'
          }`}
        >
          <form className="space-y-4" onSubmit={onPasswordSubmit}>
            <FormInput
              name="currentPassword"
              type="password"
              label="Current password"
              value={passwordData.currentPassword}
              onChange={onPasswordChange}
            />
            <FormInput
              name="newPassword"
              type="password"
              label="New password"
              value={passwordData.newPassword}
              onChange={onPasswordChange}
            />
            <FormInput
              name="confirmPassword"
              type="password"
              label="Confirm new password"
              value={passwordData.confirmPassword}
              onChange={onPasswordChange}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Update password
            </button>
          </form>
        </div>
      </div>

      {/* Connected Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connected Accounts</h3>
        <p className="text-sm text-gray-600 mb-4">
          Link your social accounts to sign in more easily or enhance your profile.
        </p>

        {/* GitHub */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md mb-3">
          <div className="flex items-center gap-3">
            <GithubIcon className="w-8 h-8 text-gray-800" />
            <div>
              <p className="font-medium text-gray-900">GitHub</p>
              <p className="text-sm text-gray-500">{githubLinked ? 'Connected' : 'Not connected'}</p>
            </div>
          </div>
          {githubLinked ? (
            <button
              onClick={onUnlinkGithub}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onLinkGithub}
              disabled={!oauthConfig.github}
              className={`px-4 py-2 text-sm font-medium rounded transition ${
                oauthConfig.github
                  ? 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                  : 'text-gray-400 border border-gray-300 cursor-not-allowed bg-gray-50'
              }`}
              title={!oauthConfig.github ? 'GitHub OAuth is not configured' : 'Connect GitHub'}
            >
              Connect
            </button>
          )}
        </div>

        {/* Google */}
        <div
          className={`flex items-center justify-between p-4 border border-gray-200 rounded-md mb-3 ${
            !oauthConfig.google ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <GoogleIcon className="w-8 h-8" />
            <div>
              <p className="font-medium text-gray-900">Google</p>
              <p className="text-sm text-gray-500">{googleLinked ? 'Connected' : 'Not connected'}</p>
            </div>
          </div>
          {googleLinked ? (
            <button
              onClick={onUnlinkGoogle}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onLinkGoogle}
              disabled={!oauthConfig.google}
              className={`px-4 py-2 text-sm font-medium rounded transition ${
                oauthConfig.google
                  ? 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                  : 'text-gray-400 border border-gray-300 cursor-not-allowed bg-gray-50'
              }`}
            >
              Connect
            </button>
          )}
        </div>

        {/* Facebook (placeholder) */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md opacity-50">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Facebook</p>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-300 rounded cursor-not-allowed bg-gray-50"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
