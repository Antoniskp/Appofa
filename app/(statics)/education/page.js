import Link from 'next/link';
import { BookOpenIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useLocale } from 'next-intl';

import StaticPageLayout from '@/components/StaticPageLayout';
import { getDirectoryContent } from './digital-tools/content';
import { directoryPath } from './digital-tools/tools';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Εκπαίδευση',
  description: 'Το εκπαιδευτικό σύστημα, προκλήσεις και προτάσεις για τη βελτίωσή του.',
  openGraph: {
    title: 'Εκπαίδευση - Απόφαση',
    description: 'Το εκπαιδευτικό σύστημα, προκλήσεις και προτάσεις για τη βελτίωσή του.',
    url: `${SITE_URL}/education`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Εκπαίδευση - Απόφαση',
    description: 'Το εκπαιδευτικό σύστημα, προκλήσεις και προτάσεις για τη βελτίωσή του.',
  },
  alternates: {
    canonical: `${SITE_URL}/education`,
  },
};

const projectCopy = {
  el: {
    title: 'Appofasistis · Βιβλιοθήκη ελληνικής νομοθεσίας',
    local: 'Το Appofasistis είναι εφαρμογή για Windows που ανοίγει στον browser και λειτουργεί αυτόνομα. Μπορείς να αναζητήσεις ελληνική νομοθεσία, να περιηγηθείς σε επιλεγμένα ΦΕΚ, να ακολουθήσεις παραπομπές μεταξύ διατάξεων και να αποθηκεύσεις PDF ή σημειώσεις στον υπολογιστή σου.',
    connected: 'Με προαιρετική σύνδεση και ειδικά διαπιστευτήρια από την Απόφαση, ο υπολογιστής σου μπορεί να αναλάβει εργασίες όπως προεπισκοπήσεις συνδέσμων και υπολογισμούς για ψηφοφορίες. Όταν η κοινόχρηστη συλλογή είναι διαθέσιμη, η διαδικτυακή Νομική Βιβλιοθήκη προσφέρει πρόσβαση μόνο για ανάγνωση με επιβεβαιωμένο email.',
    project: 'Κώδικας και εγκατάσταση στο GitHub',
    reader: 'Διαδικτυακή Νομική Βιβλιοθήκη',
  },
  en: {
    title: 'Appofasistis · Greek law library',
    local: 'Appofasistis is a standalone Windows app that opens in your browser. Search Greek legislation, browse selected Government Gazette issues, follow citations between provisions, and save PDFs or personal notes on your computer.',
    connected: 'With credentials from Appofa, you can optionally connect your computer to handle jobs such as generating link previews and calculating poll statistics. The online Legal Library offers read-only access to the shared collection when it is online. A verified email is required.',
    project: 'Code and installation on GitHub',
    reader: 'Online Legal Library',
  },
  ro: {
    title: 'Appofasistis · Bibliotecă de legislație greacă',
    local: 'Appofasistis este o aplicație autonomă pentru Windows, care se deschide în browser. Poți căuta în legislația greacă, consulta ediții selectate ale Monitorului Oficial al Greciei, urmări trimiteri între dispoziții și salva PDF-uri sau notițe pe calculator.',
    connected: 'Cu date de acces de la Appofa, poți conecta opțional calculatorul pentru sarcini precum generarea previzualizărilor și calcularea statisticilor sondajelor. Biblioteca juridică online oferă acces doar pentru citire când colecția partajată este disponibilă. Este necesară o adresă de e-mail verificată.',
    project: 'Cod și instalare pe GitHub',
    reader: 'Biblioteca juridică online',
  },
};

export default function EducationPage() {
  const locale = useLocale();
  const directory = getDirectoryContent(locale);
  const project = projectCopy[locale] ?? projectCopy.el;

  return (
    <StaticPageLayout title="Εκπαίδευση" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η εκπαίδευση είναι θεμέλιο κάθε κοινωνίας. Εδώ παρουσιάζουμε πληροφορίες για το ελληνικό
          εκπαιδευτικό σύστημα, τις προκλήσεις που αντιμετωπίζει και προτάσεις βελτίωσης.
        </p>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Squares2X2Icon className="h-6 w-6 shrink-0 text-emerald-800" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-emerald-950">{directory.title}</h2>
        </div>
        <p className="my-3 text-gray-700">{directory.intro}</p>
        <Link href={directoryPath} className="inline-flex min-h-11 items-center rounded-lg bg-emerald-900 px-4 py-2 font-semibold text-white hover:bg-emerald-950">{directory.browse}</Link>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Βρες σχολείο ή πανεπιστήμιο</h2>
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold">Σχολεία</h3>
            <p className="text-gray-700">Αναζήτησε νηπιαγωγείο, δημοτικό, γυμνάσιο ή λύκειο στην περιοχή σου στον{' '}
              <a className="text-indigo-700 underline" href="https://maps.sch.gr/">χάρτη του Πανελλήνιου Σχολικού Δικτύου</a>.
            </p>
          </div>
          <Link href="/organizations" className="text-indigo-700 underline">Βρες πανεπιστήμια στον κατάλογο οργανισμών</Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Βαθμίδες Εκπαίδευσης</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏫 Πρωτοβάθμια</h3>
            <p className="text-gray-700 text-sm">
              Νηπιαγωγείο (4–6 ετών) και Δημοτικό Σχολείο (6–12 ετών). Βάση αλφαβητισμού και
              βασικών γνώσεων.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📚 Δευτεροβάθμια</h3>
            <p className="text-gray-700 text-sm">
              Γυμνάσιο (12–15 ετών) και Λύκειο (15–18 ετών). Ολοκλήρωση υποχρεωτικής εκπαίδευσης
              και προετοιμασία για τριτοβάθμιο επίπεδο.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🎓 Τριτοβάθμια</h3>
            <p className="text-gray-700 text-sm">
              Προπτυχιακά, μεταπτυχιακά και διδακτορικά
              προγράμματα. Εξειδίκευση σε επιστημονικά και τεχνικά πεδία.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💻 Δια Βίου Μάθηση</h3>
            <p className="text-gray-700 text-sm">
              Ενήλικη εκπαίδευση, επαγγελματική κατάρτιση και ψηφιακές πλατφόρμες μάθησης που
              επιτρέπουν συνεχή ανάπτυξη δεξιοτήτων.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Προκλήσεις & Προτάσεις</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ψηφιακός Μετασχηματισμός</h3>
            <p className="text-gray-700 text-sm">
              Ενσωμάτωση ψηφιακών εργαλείων στην εκπαίδευση, ενίσχυση υποδομών και κατάρτιση
              εκπαιδευτικών σε νέες τεχνολογίες.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Αναδιάρθρωση Αναλυτικών Προγραμμάτων</h3>
            <p className="text-gray-700 text-sm">
              Ενημέρωση της ύλης ώστε να αντανακλά τις σύγχρονες ανάγκες: κριτική σκέψη, πολιτική
              αγωγή, οικονομικός αλφαβητισμός και STEM.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ισότητα Ευκαιριών</h3>
            <p className="text-gray-700 text-sm">
              Μείωση ανισοτήτων μεταξύ αστικών και αγροτικών σχολείων, ενίσχυση υποτροφιών και
              στήριξη μαθητών από ευάλωτες ομάδες.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Τεχνολογία &amp; Τεχνητή Νοημοσύνη</h2>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-300 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🤖</span>
            <h3 className="text-xl font-bold text-indigo-700">Τεχνητή Νοημοσύνη (AI) — Δωρεάν Εργαλεία</h3>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            Ανακάλυψε δεκάδες δωρεάν AI εργαλεία για γραφή, έρευνα, κώδικα, εικόνες, μετάφραση και μάθηση
            — μαζί με πρακτικούς οδηγούς βήμα-βήμα για σπουδές, βιογραφικό, ξένη γλώσσα και πολλά άλλα.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {['✍️ Γραφή', '🔬 Έρευνα', '💻 Κώδικας', '🎨 Εικόνες', '🌍 Μετάφραση', '🎓 Μάθηση'].map((tag) => (
              <span key={tag} className="bg-white border border-indigo-200 rounded-full px-2 py-0.5">{tag}</span>
            ))}
          </div>
          <Link
            href="/education/ai"
            className="self-start inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            🚀 Εξερεύνησε τα Δωρεάν Εργαλεία AI →
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-brand-border bg-ivory p-5 sm:p-6" aria-labelledby="appofasistis">
        <div className="flex items-center gap-3">
          <BookOpenIcon className="h-6 w-6 shrink-0 text-copper" aria-hidden="true" />
          <h2 id="appofasistis" className="text-xl font-semibold">{project.title}</h2>
        </div>
        <p className="mt-3 text-gray-700">{project.local}</p>
        <p className="mt-3 text-gray-700">{project.connected}</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          <a href="https://github.com/Antoniskp/Appofasistis" className="inline-flex min-h-11 items-center font-semibold text-copper underline underline-offset-4">{project.project}</a>
          <a href="/laws" className="inline-flex min-h-11 items-center font-semibold text-copper underline underline-offset-4">{project.reader}</a>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Εκπαιδευτικοί Πόροι</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">
              <a href="https://www.wikipedia.org/" target="_blank" rel="noopener noreferrer" className="hover:underline">🌐 Wikipedia</a>
            </h3>
            <p className="text-gray-700 text-sm">
              Ελεύθερη διαδικτυακή εγκυκλοπαίδεια με άρθρα σε πολλές γλώσσες για ιστορία,
              επιστήμη, πολιτισμό, τεχνολογία και πολλά ακόμη.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">
              <a href="https://learn.mit.edu/search" target="_blank" rel="noopener noreferrer" className="hover:underline">🎓 MIT Learn Search</a>
            </h3>
            <p className="text-gray-700 text-sm">
              Αναζήτηση εκπαιδευτικών πόρων, μαθημάτων και εκπαιδευτικού υλικού του MIT
              (Massachusetts Institute of Technology).
            </p>
          </div>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Μοιράσου την άποψή σου</h2>
        <p className="text-gray-700 text-sm">
          Η εκπαίδευση αφορά όλους. Συμμετέχοντας στις ψηφοφορίες, βοηθάς να διαμορφωθεί
          μια κοινή αντίληψη για τις αλλαγές που χρειάζεται το σύστημα.
        </p>
      </section>
    </StaticPageLayout>
  );
}
