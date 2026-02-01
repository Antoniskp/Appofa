/**
 * Utility functions for article type display
 */

// Article type constants
export const ARTICLE_TYPES = ['personal', 'articles', 'news'];

/**
 * Get the display label for an article type
 * @param {string} type - Article type (personal, articles, news)
 * @returns {string} Display label in Greek
 */
export function getArticleTypeLabel(type) {
  switch (type) {
    case 'personal':
      return 'Προσωπικό';
    case 'articles':
      return 'Άρθρα';
    case 'news':
      return 'Νέα';
    default:
      return type;
  }
}

/**
 * Get the display label for an article status
 * @param {string} status - Article status (draft, published, archived)
 * @returns {string} Display label in Greek
 */
export function getArticleStatusLabel(status) {
  switch (status) {
    case 'draft':
      return 'Πρόχειρο';
    case 'published':
      return 'Δημοσιευμένο';
    case 'archived':
      return 'Αρχειοθετημένο';
    default:
      return status;
  }
}

/**
 * Get the CSS classes for an article type badge
 * @param {string} type - Article type (personal, articles, news)
 * @returns {string} CSS classes for the badge
 */
export function getArticleTypeClasses(type) {
  switch (type) {
    case 'personal':
      return 'bg-gray-100 text-gray-800';
    case 'articles':
      return 'bg-purple-100 text-purple-800';
    case 'news':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Render an article type badge
 * @param {string} type - Article type
 * @param {string} size - Badge size ('sm', 'md', 'lg')
 * @returns {object} Badge properties
 */
export function getArticleTypeBadge(type, size = 'sm') {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  return {
    label: getArticleTypeLabel(type),
    className: `inline-block rounded ${getArticleTypeClasses(type)} ${sizeClasses[size]}`
  };
}

/**
 * Check if an article type requires a category
 * @param {string} type - Article type
 * @param {object} categoriesConfig - Article categories configuration object
 * @returns {boolean} True if category is required
 */
export function isCategoryRequired(type, categoriesConfig) {
  return categoriesConfig?.articleTypes?.[type]?.categories?.length > 0;
}
