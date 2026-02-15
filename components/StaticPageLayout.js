'use client';

import Link from 'next/link';

/**
 * Reusable layout component for static content pages
 * Provides consistent structure for mission, instructions, contribute, etc.
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (optional, can be included in children)
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.maxWidth - Max width class (default: 'max-w-4xl')
 * @param {string} props.className - Additional CSS classes for the card element (optional)
 * @param {boolean} props.showHelpfulLinks - Show helper links section (default: true)
 */
export default function StaticPageLayout({ 
  title, 
  children, 
  maxWidth = 'max-w-4xl',
  className = '',
  showHelpfulLinks = true
}) {
  const helpfulLinks = [
    { href: '/faq', label: 'Συχνές Ερωτήσεις' },
    { href: '/instructions', label: 'Οδηγίες Χρήσης' },
    { href: '/rules', label: 'Κανόνες Κοινότητας' },
    { href: '/contact', label: 'Επικοινωνία' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {title && (
          <h1 className="text-4xl font-bold mb-8">{title}</h1>
        )}
        <div className={`card p-8 ${className}`}>
          <div className={`${maxWidth} space-y-12 mx-auto`}>
            {children}

            {showHelpfulLinks && (
              <section className="border-t border-gray-200 pt-8" aria-label="Χρήσιμοι σύνδεσμοι">
                <h2 className="text-xl font-semibold mb-4">Χρήσιμοι σύνδεσμοι</h2>
                <div className="flex flex-wrap gap-3">
                  {helpfulLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-4 py-2 text-sm rounded-md bg-white border border-gray-200 text-gray-700 hover:text-blue-700 hover:border-blue-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
