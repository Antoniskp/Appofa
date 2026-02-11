'use client';

import StaticPageLayout from '@/components/StaticPageLayout';
import ContactForm from '@/components/ContactForm';

export default function ContactPage() {
  return (
    <StaticPageLayout title="Επικοινωνία" maxWidth="max-w-2xl">
      <p className="text-gray-700 mb-6">
        Συμπληρώστε την παρακάτω φόρμα για να επικοινωνήσετε μαζί μας. Θα απαντήσουμε το συντομότερο δυνατό.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <ContactForm type="contact" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Ή επικοινωνήστε μέσω Discord</h3>
        <p className="text-blue-800 text-sm mb-3">
          Μπορείτε επίσης να μας βρείτε στο Discord για άμεση επικοινωνία.
        </p>
        <a
          href="https://discord.gg/pvJftR4T98"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-[#5865F2] transition hover:bg-indigo-100"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.369a19.791 19.791 0 0 0-3.432-1.24 13.1 13.1 0 0 0-.634 1.287 18.27 18.27 0 0 0-5.504 0 13.1 13.1 0 0 0-.634-1.287 19.736 19.736 0 0 0-3.436 1.268C2.664 9.045 1.99 13.579 2.33 18.057a19.9 19.9 0 0 0 5.993 3.062 14.135 14.135 0 0 0 1.282-2.08 12.96 12.96 0 0 1-2.02-.98c.17-.125.34-.256.5-.389a13.945 13.945 0 0 0 12.795 0c.16.133.33.264.5.389-.636.379-1.321.712-2.02.98a14.135 14.135 0 0 0 1.282 2.08 19.9 19.9 0 0 0 5.993-3.062c.4-5.177-.687-9.674-3.7-13.688ZM8.02 15.33c-1.183 0-2.156-1.085-2.156-2.419s.936-2.419 2.156-2.419c1.219 0 2.192 1.085 2.156 2.419 0 1.334-.937 2.419-2.156 2.419Zm7.96 0c-1.183 0-2.156-1.085-2.156-2.419s.936-2.419 2.156-2.419c1.219 0 2.192 1.085 2.156 2.419 0 1.334-.937 2.419-2.156 2.419Z" />
          </svg>
          Μπείτε στο Discord
        </a>
      </div>
    </StaticPageLayout>
  );
}
