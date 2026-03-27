import Link from 'next/link';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Αντικείμενα Πλατφόρμας | Appofa',
  description:
    'Κατανοήστε τα κύρια αντικείμενα δεδομένων της πλατφόρμας Appofa — Άρθρα, Χρήστες, Ψηφοφορίες, Τοποθεσίες.',
  openGraph: {
    url: `${SITE_URL}/platform/objects`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Αντικείμενα Πλατφόρμας | Appofa',
    description:
      'Κατανοήστε τα κύρια αντικείμενα δεδομένων της πλατφόρμας Appofa — Άρθρα, Χρήστες, Ψηφοφορίες, Τοποθεσίες.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Αντικείμενα Πλατφόρμας | Appofa',
    description:
      'Κατανοήστε τα κύρια αντικείμενα δεδομένων της πλατφόρμας Appofa — Άρθρα, Χρήστες, Ψηφοφορίες, Τοποθεσίες.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/objects`,
  },
};

const objects = [
  {
    id: 'article',
    title: 'Άρθρο (Article)',
    accent: 'border-indigo-400',
    bg: 'bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700',
    label: 'indigo',
    sections: [
      {
        heading: 'Τύποι',
        items: [
          { key: 'personal', value: 'Ορατό μόνο στον δημιουργό' },
          { key: 'articles', value: 'Δημόσιο εκπαιδευτικό περιεχόμενο' },
          { key: 'news', value: 'Απαιτεί έγκριση από Admin' },
          { key: 'video', value: 'Σύντομα βίντεο από YouTube/TikTok' },
        ],
      },
      {
        heading: 'Καταστάσεις',
        items: [
          { key: 'draft', value: 'Πρόχειρο — δεν εμφανίζεται δημόσια' },
          { key: 'published', value: 'Δημοσιευμένο — ορατό στο κοινό' },
          { key: 'archived', value: 'Αρχειοθετημένο — αποσύρθηκε' },
        ],
      },
      {
        heading: 'Πεδία',
        plain: 'τίτλος, περιεχόμενο, κατηγορία, τύπος, σύνδεσμος πηγής, συγγραφέας, κατάσταση, timestamps',
      },
      {
        heading: 'Σημείωση',
        plain:
          'Οι κατηγορίες ορίζονται ανά τύπο στο αρχείο config/articleCategories.json (υποστηρίζονται EN/GR).',
      },
    ],
  },
  {
    id: 'user',
    title: 'Χρήστης (User)',
    accent: 'border-blue-400',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    label: 'blue',
    sections: [
      {
        heading: 'Πεδία',
        plain:
          'username, email, ρόλος (admin / editor / viewer), στοιχεία προφίλ, σύνδεσμοι τοποθεσίας',
      },
      {
        heading: 'Αυθεντικοποίηση',
        plain: 'JWT αποθηκευμένο σε HttpOnly cookie — ασφαλές έναντι XSS επιθέσεων',
      },
      {
        heading: 'Ρόλοι',
        items: [
          { key: 'admin', value: 'Πλήρης πρόσβαση και διαχείριση' },
          { key: 'editor', value: 'Δημιουργία και διαχείριση περιεχομένου' },
          { key: 'viewer', value: 'Βασική πρόσβαση και ψηφοφορία' },
        ],
      },
    ],
  },
  {
    id: 'poll',
    title: 'Ψηφοφορία (Poll)',
    accent: 'border-green-400',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
    label: 'green',
    sections: [
      {
        heading: 'Γενικά',
        plain:
          'Δημιουργείται από χρήστες με ρόλο editor ή admin. Κάθε χρήστης μπορεί να ψηφίσει μία φορά μόνο.',
      },
      {
        heading: 'Πεδία',
        plain:
          'ερώτηση, επιλογές (λίστα), αριθμός ψήφων ανά επιλογή, δημιουργός, timestamps',
      },
      {
        heading: 'Ορατότητα',
        plain: 'Τα αποτελέσματα είναι ορατά δημόσια σε όλους τους χρήστες.',
      },
    ],
  },
  {
    id: 'location',
    title: 'Τοποθεσία (Location)',
    accent: 'border-purple-400',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
    label: 'purple',
    sections: [
      {
        heading: 'Ιεραρχία',
        items: [
          { key: 'Χώρα', value: 'Ανώτατο επίπεδο γεωγραφίας' },
          { key: 'Νομός', value: 'Περιφερειακό επίπεδο' },
          { key: 'Δήμος', value: 'Τοπικό επίπεδο — χαμηλότερη μονάδα' },
        ],
      },
      {
        heading: 'Συνδέσεις',
        plain:
          'Συνδέεται πολυμορφικά με άρθρα και χρήστες μέσω του μοντέλου LocationLink.',
      },
      {
        heading: 'Χρήση',
        plain:
          'Χρησιμοποιείται για γεωγραφικό φιλτράρισμα περιεχομένου ανά περιοχή.',
      },
    ],
  },
];

export default function ObjectsPage() {
  return (
    <StaticPageLayout
      title="Αντικείμενα Πλατφόρμας"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Η πλατφόρμα Appofa οργανώνεται γύρω από τέσσερα κύρια αντικείμενα δεδομένων. Κατανοήστε
        τη δομή και τις σχέσεις τους.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        {objects.map((obj) => (
          <section key={obj.id}>
            <div className={`rounded-xl border-l-4 ${obj.accent} border border-gray-200 bg-white shadow-sm overflow-hidden h-full`}>
              {/* Card Header */}
              <div className={`${obj.bg} px-6 py-4 border-b border-gray-100`}>
                <h2 className="text-lg font-bold text-gray-900">{obj.title}</h2>
              </div>

              {/* Card Body */}
              <div className="px-6 py-5 space-y-4">
                {obj.sections.map((sec, si) => (
                  <div key={si}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      {sec.heading}
                    </h3>
                    {sec.plain ? (
                      <p className="text-sm text-gray-700 leading-relaxed">{sec.plain}</p>
                    ) : (
                      <ul className="space-y-1">
                        {sec.items.map((item, ii) => (
                          <li key={ii} className="flex items-start gap-2 text-sm">
                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${obj.badge}`}>
                              {item.key}
                            </span>
                            <span className="text-gray-600">{item.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </StaticPageLayout>
  );
}
