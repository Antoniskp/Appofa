import Link from 'next/link';
import { Children, cloneElement, isValidElement } from 'react';
import { useTranslations } from 'next-intl';

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
 * @param {React.ReactNode} props.breadcrumb - Optional breadcrumb navigation (rendered above title)
 */
export default function StaticPageLayout({ 
  title, 
  children, 
  maxWidth = 'max-w-4xl',
  className = '',
  showHelpfulLinks = true,
  breadcrumb = null
}) {
  const r = useTranslations('redesign');
  const contents = [];
  const addAnchors = nodes => Children.map(nodes, node => {
    if (!isValidElement(node)) return node;
    if (node.type === 'h2') {
      const id = node.props.id || `reading-section-${contents.length + 1}`;
      contents.push({ id, label: node.props.children });
      return cloneElement(node, { id });
    }
    return typeof node.type === 'string' && node.props.children
      ? cloneElement(node, {}, addAnchors(node.props.children)) : node;
  });
  const readingContent = addAnchors(children);
  const helpfulLinks = [
    { href: '/faq', label: 'Συχνές Ερωτήσεις' },
    { href: '/instructions', label: 'Οδηγίες Χρήσης' },
    { href: '/rules', label: 'Κανόνες Κοινότητας' },
    { href: '/contact', label: 'Επικοινωνία' },
  ];

  return (
    <div className="bg-ivory min-h-screen py-10 sm:py-16">
      <div className="app-container">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
            {breadcrumb}
          </nav>
        )}
        {title && (
          <h1 className="max-w-3xl text-3xl sm:text-4xl font-semibold tracking-tight mb-10">{title}</h1>
        )}
        <div className={contents.length >= 3 ? 'grid items-start gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]' : ''}>
        {contents.length >= 3 && <nav aria-label={r('contents')} className="border-t border-brand-border pt-5 lg:sticky lg:top-6"><p className="mb-3 text-sm font-semibold text-copper">{r('contents')}</p><ol className="space-y-2">{contents.map(item => <li key={item.id}><a href={`#${item.id}`} className="block py-2 text-sm leading-relaxed hover:text-copper hover:underline">{item.label}</a></li>)}</ol></nav>}
        <div className={`min-w-0 bg-white rounded-2xl border border-brand-border p-5 sm:p-10 ${className}`}>
          <div className={`${maxWidth} editorial-copy space-y-12 mx-auto`}>
            {readingContent}

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
    </div>
  );
}
