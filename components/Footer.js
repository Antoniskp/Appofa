import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="app-container py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Column 1: About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Απόφαση</h3>
            <p className="text-gray-400 text-sm">
              Η αξιόπιστη πηγή σας για τις πιο πρόσφατες ειδήσεις και άρθρα. Απάντησε και κάνε τα αποτελέσματα εγκυρότερα.
            </p>
          </div>

          {/* Column 2: Content & Static Pages */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Περιεχόμενο</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/news" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Ειδήσεις
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Άρθρα
                </Link>
              </li>
              <li>
                <Link href="/polls" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Δημοσκοπήσεις
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Συχνές Ερωτήσεις
                </Link>
              </li>
              <li>
                <Link href="/contribute" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Συνεισφορά
                </Link>
              </li>
              <li>
                <Link href="/become-moderator" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Γίνε Moderator
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Πληροφορίες & Πολιτικές */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Πληροφορίες</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/instructions" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Οδηγίες Χρήσης
                </Link>
              </li>
              <li>
                <Link href="/rules" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Κανόνες
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Πολιτική Απορρήτου
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Όροι Χρήσης
                </Link>
              </li>
            </ul>
          </div>

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
              <li>
                <Link href="/transparency" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Διαφάνεια
                </Link>
              </li>
              <li>
                <Link href="/mission" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Αποστολή
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
