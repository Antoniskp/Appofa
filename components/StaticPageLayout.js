'use client';

/**
 * Reusable layout component for static content pages
 * Provides consistent structure for mission, instructions, contribute, etc.
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (optional, can be included in children)
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.maxWidth - Max width class (default: 'max-w-4xl')
 * @param {Object} props.metadata - Page metadata for SEO (optional)
 */
export default function StaticPageLayout({ 
  title, 
  children, 
  maxWidth = 'max-w-4xl',
  className = ''
}) {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {title && (
          <h1 className="text-4xl font-bold mb-8">{title}</h1>
        )}
        <div className={`card p-8 ${className}`}>
          <div className={`${maxWidth} space-y-12 mx-auto`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
