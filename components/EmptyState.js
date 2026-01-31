/**
 * Shared empty/error state component
 * @param {string} type - 'empty' or 'error'
 * @param {string} title - Title message
 * @param {string} description - Optional description
 * @param {Object} action - Optional action button with { text, href, onClick }
 */
export default function EmptyState({ 
  type = 'empty', 
  title, 
  description,
  action 
}) {
  const isError = type === 'error';

  return (
    <div className={`text-center py-12 px-4 rounded-lg ${
      isError 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="mb-4">
          {isError ? (
            <svg 
              className="mx-auto h-12 w-12 text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          ) : (
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-lg font-semibold mb-2 ${
          isError ? 'text-red-800' : 'text-gray-900'
        }`}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className={`mb-6 ${
            isError ? 'text-red-600' : 'text-gray-600'
          }`}>
            {description}
          </p>
        )}

        {/* Action Button */}
        {action && (
          action.href ? (
            <a href={action.href} className="btn-primary">
              {action.text}
            </a>
          ) : (
            <button onClick={action.onClick} className="btn-primary">
              {action.text}
            </button>
          )
        )}
      </div>
    </div>
  );
}
