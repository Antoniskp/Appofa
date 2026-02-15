import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerColumns = [
    {
      title: 'Περιεχόμενο',
      links: [
        { href: '/news', label: 'Ειδήσεις', type: 'internal' },
        { href: '/articles', label: 'Άρθρα', type: 'internal' },
        { href: '/polls', label: 'Δημοσκοπήσεις', type: 'internal' },
        { href: '/locations', label: 'Τοποθεσίες', type: 'internal' },
      ],
    },
    {
      title: 'Βοήθεια',
      links: [
        { href: '/faq', label: 'Συχνές Ερωτήσεις', type: 'internal' },
        { href: '/instructions', label: 'Οδηγίες Χρήσης', type: 'internal' },
        { href: '/rules', label: 'Κανόνες', type: 'internal' },
        { href: '/contribute', label: 'Συνεισφορά', type: 'internal' },
        { href: '/become-moderator', label: 'Γίνε Moderator', type: 'internal' },
      ],
    },
    {
      title: 'Πληροφορίες',
      links: [
        { href: '/about', label: 'Σχετικά με εμάς', type: 'internal' },
        { href: '/mission', label: 'Αποστολή', type: 'internal' },
        { href: '/transparency', label: 'Διαφάνεια', type: 'internal' },
        { href: '/privacy', label: 'Πολιτική Απορρήτου', type: 'internal' },
        { href: '/terms', label: 'Όροι Χρήσης', type: 'internal' },
      ],
    },
    {
      title: 'Απόφαση & Επικοινωνία',
      description: 'Η αξιόπιστη πηγή σας για τις πιο πρόσφατες ειδήσεις και άρθρα. Απάντησε και κάνε τα αποτελέσματα εγκυρότερα.',
      links: [
        { href: '/contact', label: 'Επικοινωνία', type: 'internal' },
        { href: 'mailto:eimaiautospou@gmail.com', label: 'Email: eimaiautospou@gmail.com', type: 'external' },
        { label: 'Τηλέφωνο: Προσεχώς', type: 'static' },
        { href: '/about', label: 'Σχετικά με εμάς', type: 'internal' },
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
                  <li key={link.href || index}>
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
            © {currentYear} Απόφαση. Με επιφύλαξη παντός δικαιώματος. Χτισμένο με ανοιχτό κώδικα, AI και φροντίδα.
          </p>
        </div>
      </div>
    </footer>
  );
}
