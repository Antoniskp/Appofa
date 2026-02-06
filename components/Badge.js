'use client';

/**
 * Reusable badge component for tags, statuses, categories
 * 
 * @param {React.ReactNode} children - Badge content
 * @param {string} variant - Color variant
 *   - 'default': Gray (generic tags)
 *   - 'primary': Blue (article type, categories)
 *   - 'success': Green (published status)
 *   - 'warning': Orange (draft status)
 *   - 'danger': Red (archived, deleted)
 *   - 'purple': Purple (special categories)
 *   - 'info': Cyan (informational tags)
 * @param {string} size - Badge size (sm, md, lg)
 * @param {boolean} removable - Show remove button
 * @param {function} onRemove - Remove button click handler
 * @param {React.ReactNode} icon - Optional icon to display before text
 * @param {string} className - Additional CSS classes
 */
export default function Badge({ 
  children, 
  variant = 'default',
  size = 'sm',
  removable = false,
  onRemove,
  icon,
  className = ''
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    info: 'bg-cyan-100 text-cyan-800 border-cyan-200'
  };
  
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && (
        <span className={`flex-shrink-0 ${iconSizes[size]}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 ml-0.5 hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded-full"
          aria-label={`Remove ${children}`}
        >
          <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * Status badge with predefined status-to-variant mapping
 * Common use case: article.status, user.status
 */
export function StatusBadge({ status, size = 'sm', className = '' }) {
  const statusMap = {
    published: { variant: 'success', label: 'Published' },
    draft: { variant: 'warning', label: 'Draft' },
    archived: { variant: 'danger', label: 'Archived' },
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' }
  };
  
  const statusConfig = statusMap[status?.toLowerCase()] || { variant: 'default', label: status };
  
  return (
    <Badge variant={statusConfig.variant} size={size} className={className}>
      {statusConfig.label}
    </Badge>
  );
}

/**
 * Article type badge with predefined type-to-variant mapping
 */
export function TypeBadge({ type, size = 'sm', className = '' }) {
  const typeMap = {
    news: { variant: 'success', label: 'Νέα' },
    articles: { variant: 'purple', label: 'Άρθρα' },
    personal: { variant: 'default', label: 'Προσωπικό' }
  };
  
  const typeConfig = typeMap[type?.toLowerCase()] || { variant: 'default', label: type };
  
  return (
    <Badge variant={typeConfig.variant} size={size} className={className}>
      {typeConfig.label}
    </Badge>
  );
}
