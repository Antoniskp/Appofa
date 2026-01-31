/**
 * Skeleton loader for article cards
 * @param {number} count - Number of skeleton cards to display
 * @param {string} variant - 'grid' or 'list' to match ArticleCard variants
 */
export default function SkeletonLoader({ count = 6, variant = 'grid' }) {
  const isListVariant = variant === 'list';

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={isListVariant ? 'card p-6 animate-pulse' : 'card animate-pulse'}
        >
          {isListVariant ? (
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
      ))}
    </>
  );
}
