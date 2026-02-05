'use client';

/**
 * Reusable pagination component
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Page change handler
 * @param {function} onPrevious - Previous page handler
 * @param {function} onNext - Next page handler
 * @param {string} className - Additional CSS classes
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onPrevious,
  onNext,
  className = ''
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={`flex justify-center items-center gap-2 mt-8 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        aria-label="Previous page"
      >
        Previous
      </button>

      {/* First page */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            1
          </button>
          {startPage > 2 && (
            <span className="px-2 text-gray-500">...</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pages.map(pageNum => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`px-3 py-2 border rounded-md transition-colors ${
            pageNum === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          }`}
          aria-label={`Page ${pageNum}`}
          aria-current={pageNum === currentPage ? 'page' : undefined}
        >
          {pageNum}
        </button>
      ))}

      {/* Last page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
