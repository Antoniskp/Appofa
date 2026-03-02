'use client';

import Button from '@/components/Button';
import Tooltip from '@/components/Tooltip';

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
      <Button
        onClick={onPrevious}
        disabled={currentPage === 1}
        variant="secondary"
        size="sm"
        aria-label="Previous page"
      >
        Previous
      </Button>

      {/* First page */}
      {startPage > 1 && (
        <>
          <Tooltip content="Πρώτη σελίδα">
            <span>
              <Button
                onClick={() => onPageChange(1)}
                variant="ghost"
                size="sm"
                aria-label="Page 1"
              >
                1
              </Button>
            </span>
          </Tooltip>
          {startPage > 2 && (
            <span className="px-2 text-gray-500">...</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pages.map(pageNum => (
        <Button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          variant={pageNum === currentPage ? 'primary' : 'ghost'}
          size="sm"
          aria-label={`Page ${pageNum}`}
          aria-current={pageNum === currentPage ? 'page' : undefined}
        >
          {pageNum}
        </Button>
      ))}

      {/* Last page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <Tooltip content="Τελευταία σελίδα">
            <span>
              <Button
                onClick={() => onPageChange(totalPages)}
                variant="ghost"
                size="sm"
                aria-label={`Page ${totalPages}`}
              >
                {totalPages}
              </Button>
            </span>
          </Tooltip>
        </>
      )}

      {/* Next Button */}
      <Button
        onClick={onNext}
        disabled={currentPage === totalPages}
        variant="secondary"
        size="sm"
        aria-label="Next page"
      >
        Next
      </Button>
    </div>
  );
}
