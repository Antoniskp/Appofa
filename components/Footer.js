import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="app-container py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Απόφαση</h3>
            <p className="text-gray-400 text-sm">
              Η αξιόπιστη πηγή σας για τις πιο πρόσφατες ειδήσεις και άρθρα. Απάντησε και κάνε τα αποτελέσματα εγκυρότερα.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Γρήγοροι Σύνδεσμοι</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/instructions" className="text-gray-400 hover:text-white text-sm">
                  Οδηγίες
                </Link>
              </li>
              <li>
                <Link href="/rules" className="text-gray-400 hover:text-white text-sm">
                  Κανόνες
                </Link>
              </li>
              <li>
                <Link href="/mission" className="text-gray-400 hover:text-white text-sm">
                  Αποστολή
                </Link>
              </li>
              <li>
                <Link href="/contribute" className="text-gray-400 hover:text-white text-sm">
                  Συνεισφορά
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <Link href="/contact" className="text-gray-400 hover:text-white text-sm">
              <h3 className="text-lg font-semibold mb-4">Επικοινωνία</h3>
            </Link>
            <p className="text-gray-400 text-sm">
              Email: eimaiautospou@gmail.com
            </p>
            <p className="text-gray-400 text-sm">
              Τηλέφωνο: Προσεχώς
            </p>
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
