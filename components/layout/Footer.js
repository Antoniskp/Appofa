import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();
  const footerColumns = [
    {
      title: t('content_title'),
      links: [
        { href: '/news', label: t('news'), type: 'internal' },
        { href: '/articles', label: t('articles'), type: 'internal' },
        { href: '/polls', label: t('polls'), type: 'internal' },
        { href: '/locations', label: t('locations'), type: 'internal' },
      ],
    },
    {
      title: t('help_title'),
      links: [
        { href: '/faq', label: t('faq'), type: 'internal' },
        { href: '/instructions', label: t('instructions'), type: 'internal' },
        { href: '/rules', label: t('rules'), type: 'internal' },
        { href: '/contribute', label: t('contribute'), type: 'internal' },
        { href: '/become-moderator', label: t('become_moderator'), type: 'internal' },
      ],
    },
    {
      title: t('info_title'),
      links: [
        { href: '/about', label: t('about'), type: 'internal' },
        { href: '/mission', label: t('mission'), type: 'internal' },
        { href: '/transparency', label: t('transparency'), type: 'internal' },
        { href: '/privacy', label: t('privacy'), type: 'internal' },
        { href: '/terms', label: t('terms'), type: 'internal' },
      ],
    },
    {
      title: t('brand_contact_title'),
      description: t('brand_description'),
      links: [
        { href: '/contact', label: t('contact'), type: 'internal' },
        { href: 'mailto:eimaiautospou@gmail.com', label: t('email_label'), type: 'external' },
        { label: t('phone_soon'), type: 'static' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-800 text-white mt-auto" aria-label="Footer menu">
      <div className="app-container py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-lg font-semibold mb-4">{column.title}</h3>
              {column.description && (
                <p className="text-gray-400 text-sm mb-4">
                  {column.description}
                </p>
              )}
              <ul className="space-y-2">
                {column.links.map((link, index) => (
                  <li key={link.href || `${column.title}-${index}`}>
                    {link.type === 'external' ? (
                      <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                        {link.label}
                      </a>
                    ) : link.type === 'static' ? (
                      <span className="text-gray-400 text-sm">
                        {link.label}
                      </span>
                    ) : (
                      <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700 mt-4 pt-4 text-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} {t('copyright')}
            </p>
          </div>
        </div>
    </footer>
  );
}
