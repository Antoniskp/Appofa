import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Αρχεία GitHub - Απόφαση',
  description:
    'Αρχεία του αποθετηρίου που αλλάζουν συχνά — κατηγορίες, χρώματα, μεταφράσεις και ρυθμίσεις.',
  openGraph: {
    title: 'Αρχεία GitHub - Απόφαση',
    description:
      'Αρχεία του αποθετηρίου που αλλάζουν συχνά — κατηγορίες, χρώματα, μεταφράσεις και ρυθμίσεις.',
    url: `${SITE_URL}/github-files`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Αρχεία GitHub - Απόφαση',
    description:
      'Αρχεία του αποθετηρίου που αλλάζουν συχνά — κατηγορίες, χρώματα, μεταφράσεις και ρυθμίσεις.',
  },
  alternates: {
    canonical: `${SITE_URL}/github-files`,
  },
};

const fileGroups = [
  {
    icon: '🗂️',
    title: 'Περιεχόμενο & Κατηγορίες',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    files: [
      {
        label: 'config/articleCategories.json',
        description: 'Κατηγορίες άρθρων, ειδήσεων, ψηφοφοριών',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/config/articleCategories.json',
      },
      {
        label: 'lib/utils/articleTypes.js',
        description: 'Χρώματα & ετικέτες τύπων άρθρων',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/lib/utils/articleTypes.js',
      },
      {
        label: 'src/constants/expertiseAreas.js',
        description: 'Τομείς εξειδίκευσης προφίλ',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/src/constants/expertiseAreas.js',
      },
      {
        label: 'src/data/professions.json',
        description: 'Λίστα επαγγελμάτων',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/src/data/professions.json',
      },
      {
        label: 'src/data/interests.json',
        description: 'Λίστα ενδιαφερόντων',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/src/data/interests.json',
      },
      {
        label: 'config/badges.json',
        description: 'Ορισμοί badges (8 badges, 3 επίπεδα)',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/config/badges.json',
      },
    ],
  },
  {
    icon: '🎨',
    title: 'Χρώματα & Εμφάνιση',
    textColor: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-400',
    files: [
      {
        label: 'tailwind.config.js',
        description: 'Χρώματα, γραμματοσειρές, breakpoints',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/tailwind.config.js',
      },
      {
        label: 'app/globals.css',
        description: 'Καθολικές CSS μεταβλητές & βασικά στυλ',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/app/globals.css',
      },
    ],
  },
  {
    icon: '🏠',
    title: 'Αρχική & Layout',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    files: [
      {
        label: 'src/data/hero-settings.json',
        description: 'Slides / ρυθμίσεις hero section',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/src/data/hero-settings.json',
      },
      {
        label: 'app/layout.js',
        description: 'Root layout (τίτλος, meta, γραμματοσειρές)',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/app/layout.js',
      },
    ],
  },
  {
    icon: '🌍',
    title: 'Μεταφράσεις (i18n)',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    files: [
      {
        label: 'messages/el.json',
        description: 'Όλα τα ελληνικά κείμενα UI',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/messages/el.json',
      },
      {
        label: 'messages/en.json',
        description: 'Όλα τα αγγλικά κείμενα UI',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/messages/en.json',
      },
    ],
  },
  {
    icon: '⚙️',
    title: 'Υποδομή & Σφάλματα',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    files: [
      {
        label: 'nginx/appofa.conf',
        description: 'Nginx config (σελίδες 502/503, routing)',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/nginx/appofa.conf',
      },
      {
        label: 'app/robots.js',
        description: 'Κανόνες robots.txt',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/app/robots.js',
      },
      {
        label: 'app/sitemap.js',
        description: 'URLs sitemap',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/app/sitemap.js',
      },
      {
        label: 'proxy.js',
        description: 'Proxy / edge λογική (redirects χώρας)',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/proxy.js',
      },
    ],
  },
  {
    icon: '🔧',
    title: 'Ρυθμίσεις Εφαρμογής',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-400',
    files: [
      {
        label: 'i18n.js',
        description: 'Supported locales, Next.js i18n',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/i18n.js',
      },
      {
        label: 'next.config.js',
        description: 'Next.js config (redirects, images, env)',
        url: 'https://github.com/Antoniskp/Appofa/blob/main/next.config.js',
      },
    ],
  },
];

function GithubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function GithubFilesPage() {
  return (
    <StaticPageLayout
      title="Αρχεία GitHub"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Σελίδες
        </Link>
      }
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Αρχεία του αποθετηρίου που αλλάζουν συχνά — κατηγορίες, χρώματα, μεταφράσεις και
          ρυθμίσεις. Κάντε κλικ σε οποιοδήποτε για να το δείτε ή να το επεξεργαστείτε απευθείας
          στο GitHub.
        </p>
      </section>

      <div className="space-y-8">
        {fileGroups.map((group) => (
          <section key={group.title} className="space-y-4">
            <div className={`border-l-4 ${group.borderColor} ${group.bgColor} rounded-r-lg p-4`}>
              <h2 className={`text-xl font-semibold ${group.textColor} flex items-center gap-2`}>
                <span aria-hidden="true">{group.icon}</span>
                {group.title}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {group.files.map((file) => (
                <a
                  key={file.label}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-gray-200 rounded-lg p-4 bg-white hover:border-blue-400 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-sm text-gray-900 break-all">{file.label}</span>
                    <span className="block text-xs text-gray-500 mt-1">{file.description}</span>
                  </span>
                  <span className="text-gray-500 flex-shrink-0">
                    <GithubIcon />
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </StaticPageLayout>
  );
}
