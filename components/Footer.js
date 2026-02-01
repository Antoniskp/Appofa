import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="app-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Εφαρμογή Ειδήσεων</h3>
            <p className="text-gray-400 text-sm">
              Η αξιόπιστη πηγή σας για τα τελευταία νέα και άρθρα.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Γρήγοροι Σύνδεσμοι</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white text-sm">
                  Αρχική
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-gray-400 hover:text-white text-sm">
                  Άρθρα
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white text-sm">
                  Σύνδεση
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-400 hover:text-white text-sm">
                  Εγγραφή
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Επικοινωνία</h3>
            <p className="text-gray-400 text-sm">
              Ηλ. ταχυδρομείο: info@newsapp.com
            </p>
            <p className="text-gray-400 text-sm">
              Τηλέφωνο: (123) 456-7890
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Εφαρμογή Ειδήσεων. Όλα τα δικαιώματα διατηρούνται.
          </p>
        </div>
      </div>
    </footer>
  );
}
