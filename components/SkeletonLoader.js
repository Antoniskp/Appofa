'use client';

/**
 * Reusable skeleton loader component for consistent loading states
 * 
 * @param {string} type - Skeleton type
 *   - 'card': Article/content card skeleton
 *   - 'list': List item skeleton (user cards, etc.)
 *   - 'text': Simple text line skeleton
 *   - 'article': Full article detail skeleton
 *   - 'form': Form field skeleton
 *   - 'table': Table row skeleton
 *   - 'avatar': Circular avatar skeleton
 *   - 'button': Button skeleton
 * @param {number} count - Number of skeleton items to render
 * @param {string} className - Additional CSS classes
 * @param {string} variant - For backward compatibility with 'card' type: 'grid' or 'list'
 */
export default function SkeletonLoader({ 
  type = 'card', 
  count = 1,
  className = '',
  variant = 'grid'
}) {
  const skeletons = {
    // Article card skeleton (for /articles, /news pages)
    card: (
      <div className={variant === 'list' ? 'card p-6 animate-pulse' : 'card animate-pulse'}>
        {variant === 'list' ? (
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-grow">
              <div className="h-5 w-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-7 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-4">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="h-5 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        )}
      </div>
    ),
    
    // User card / list item skeleton (for /users page)
    list: (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 bg-gray-200 rounded-full flex-shrink-0"></div>
          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    ),
    
    // Simple text line skeleton (for simple loading states)
    text: (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    ),
    
    // Full article detail skeleton (for /articles/[id] page)
    article: (
      <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
        {/* Header */}
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="flex gap-4 mb-6">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-28 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Banner image */}
        <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
        
        {/* Content paragraphs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ),
    
    // Form field skeleton (for forms)
    form: (
      <div className="animate-pulse space-y-4">
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
    
    // Table row skeleton (for admin tables)
    table: (
      <tr className="animate-pulse">
        <td className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
        <td className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </td>
        <td className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </td>
        <td className="px-6 py-4">
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </td>
      </tr>
    ),
    
    // Avatar only skeleton
    avatar: (
      <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
    ),
    
    // Button skeleton (for loading buttons)
    button: (
      <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
    )
  };
  
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={count > 1 && type !== 'text' && type !== 'button' ? 'mb-4' : ''}>
          {skeletons[type] || skeletons.card}
        </div>
      ))}
    </div>
  );
}
