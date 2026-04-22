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
        { href: 'https://discord.gg/pvJftR4T98', label: t('discord_label'), type: 'discord' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-800 text-white mt-auto" aria-label={t('menu_aria')}>
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
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </a>
                    ) : link.type === 'discord' ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-gray-400 hover:text-indigo-400 transition-colors text-sm"
                      >
                        <svg role="img" aria-label="Discord icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="inline-block w-4 h-4 mr-1 fill-current"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/></svg>
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
            © {currentYear} {t('copyright')}{' '}
            <a
              href="https://github.com/Antoniskp/Appofa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
            .
          </p>
        </div>
        </div>
    </footer>
  );
}
