'use client';

/**
 * Reusable confirmation dialog
 * @param {boolean} isOpen - Whether dialog is open
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Confirm button text (default: "Confirm")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {function} onConfirm - Confirm handler
 * @param {function} onCancel - Cancel handler
 * @param {boolean} destructive - Whether action is destructive (red button)
 * @param {boolean} loading - Whether the confirm action is in progress (disables buttons)
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Title */}
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
          )}

          {/* Message */}
          {message && (
            <p className="text-gray-600 mb-6">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                destructive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
