import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerColumns = [
    {
      title: 'Περιεχόμενο',
      links: [
        { href: '/news', label: 'Ειδήσεις' },
        { href: '/articles', label: 'Άρθρα' },
        { href: '/polls', label: 'Δημοσκοπήσεις' },
        { href: '/locations', label: 'Τοποθεσίες' },
      ],
    },
    {
      title: 'Βοήθεια',
      links: [
        { href: '/faq', label: 'Συχνές Ερωτήσεις' },
        { href: '/instructions', label: 'Οδηγίες Χρήσης' },
        { href: '/rules', label: 'Κανόνες' },
        { href: '/contribute', label: 'Συνεισφορά' },
        { href: '/become-moderator', label: 'Γίνε Moderator' },
      ],
    },
    {
      title: 'Πληροφορίες',
      links: [
        { href: '/about', label: 'Σχετικά με εμάς' },
        { href: '/mission', label: 'Αποστολή' },
        { href: '/transparency', label: 'Διαφάνεια' },
        { href: '/privacy', label: 'Πολιτική Απορρήτου' },
        { href: '/terms', label: 'Όροι Χρήσης' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-800 text-white mt-auto" aria-label="Footer menu">
      <div className="app-container py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Column 1: About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Απόφαση</h3>
            <p className="text-gray-400 text-sm">
              Η αξιόπιστη πηγή σας για τις πιο πρόσφατες ειδήσεις και άρθρα. Απάντησε και κάνε τα αποτελέσματα εγκυρότερα.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-lg font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Column 4: Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Επικοινωνία</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Επικοινωνία
                </Link>
              </li>
              <li>
                <a href="mailto:eimaiautospou@gmail.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Email: eimaiautospou@gmail.com
                </a>
              </li>
              <li>
                <span className="text-gray-400 text-sm">
                  Τηλέφωνο: Προσεχώς
                </span>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Σχετικά με εμάς
                </Link>
              </li>
            </ul>
          </div>
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
