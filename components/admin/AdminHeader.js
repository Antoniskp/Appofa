'use client';

/**
 * Reusable admin page header
 * @param {string} title - Page title
 * @param {string} subtitle - Optional subtitle/description
 * @param {string} actionText - Action button text
 * @param {function} onAction - Action button click handler
 */
export default function AdminHeader({
  title,
  subtitle,
  actionText,
  onAction,
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-gray-600">{subtitle}</p>
        )}
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
