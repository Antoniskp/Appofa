import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import categoriesData from '@/config/articleCategories.json';

export const metadata = {
  title: 'Κατηγορίες - Απόφαση',
  description: 'Όλες οι κατηγορίες άρθρων, ειδήσεων και ψηφοφοριών της πλατφόρμας Απόφαση.',
};

const JSON_FILE_URL =
  'https://github.com/Antoniskp/Appofa/blob/main/config/articleCategories.json';

const SUGGEST_ISSUE_BODY = [
  '## Πρόταση νέας κατηγορίας',
  '',
  '**Όνομα κατηγορίας:**',
  '<!-- Γράψτε το όνομα της κατηγορίας που προτείνετε -->',
  '',
  '**Γονική κατηγορία (προαιρετικό):**',
  '<!-- π.χ. Άρθρα, Ειδήσεις ή Ψηφοφορίες -->',
  '',
  '**Περιγραφή / Αιτιολόγηση:**',
  '<!-- Εξηγήστε γιατί η κατηγορία είναι χρήσιμη -->',
  '',
  '**Σύνδεσμοι / Πηγές (προαιρετικό):**',
  '<!-- Προσθέστε τυχόν σχετικούς συνδέσμους -->',
].join('\n');

const SUGGEST_URL = new URL('https://github.com/Antoniskp/Appofa/issues/new');
SUGGEST_URL.searchParams.set('labels', 'category-suggestion');
SUGGEST_URL.searchParams.set('title', 'Πρόταση κατηγορίας: ');
SUGGEST_URL.searchParams.set('body', SUGGEST_ISSUE_BODY);

const ARTICLE_TYPE_META = {
  articles: { icon: '✍️', labelEl: 'Άρθρα' },
  news: { icon: '📰', labelEl: 'Ειδήσεις' },
};

const POLL_META = { icon: '📊', labelEl: 'Ψηφοφορίες' };

function GithubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function StepBadge({ n }) {
  return (
    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
      {n}
    </span>
  );
}

export default function CategoriesPage() {
  const { articleTypes, pollCategories } = categoriesData;

  const sections = [
    ...Object.entries(articleTypes)
      .filter(([key]) => key !== 'personal')
      .map(([key, type]) => ({
        key,
        icon: ARTICLE_TYPE_META[key]?.icon ?? '📁',
        label: ARTICLE_TYPE_META[key]?.labelEl ?? type.labelEl,
        description: type.description,
        categories: type.categories,
      })),
    {
      key: 'polls',
      icon: POLL_META.icon,
      label: POLL_META.labelEl,
      description: null,
      categories: pollCategories,
    },
  ];

  return (
    <StaticPageLayout title="Κατηγορίες" maxWidth="max-w-5xl" showHelpfulLinks={false} breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      {/* intro */}
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Όλες οι κατηγορίες περιεχομένου της πλατφόρμας Απόφαση — άρθρα, ειδήσεις και ψηφοφορίες.
          Οι κατηγορίες διαχειρίζονται μέσω ανοιχτού κώδικα στο{' '}
          <a
            href={JSON_FILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            αρχείο JSON
          </a>{' '}
          του αποθετηρίου.
        </p>
      </section>

      {/* category pills grouped by type */}
      {sections.map((section) => (
        <section key={section.key}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl" aria-hidden="true">{section.icon}</span>
            <div>
              <h2 className="text-2xl font-semibold">{section.label}</h2>
              {section.description && (
                <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {section.categories.map((cat) => (
              <span
                key={cat}
                className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-800"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>
      ))}

      {/* contribute section */}
      <section className="border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-semibold mb-2">Πώς να προτείνετε μια κατηγορία</h2>
        <p className="text-gray-600 mb-8">
          Οι κατηγορίες ζουν σε ένα μόνο αρχείο JSON στο GitHub. Υπάρχουν δύο τρόποι να προτείνετε
          αλλαγή — διαλέξτε αυτόν που σας βολεύει.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Option A: Issue */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <h3 className="text-lg font-semibold">Μέσω GitHub Issue</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ο πιο απλός τρόπος. Δεν χρειάζεστε γνώσεις προγραμματισμού — απλά συμπληρώστε μια
              φόρμα με την πρότασή σας.
            </p>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <StepBadge n={1} />
                <span>Κάντε κλικ στο κουμπί παρακάτω. Ανοίγει μια προσυμπληρωμένη φόρμα στο GitHub.</span>
              </li>
              <li className="flex items-start gap-3">
                <StepBadge n={2} />
                <span>Συμπληρώστε το όνομα της κατηγορίας και γιατί την προτείνετε.</span>
              </li>
              <li className="flex items-start gap-3">
                <StepBadge n={3} />
                <span>Υποβάλτε το issue. Η ομάδα θα το αξιολογήσει και θα εφαρμόσει την αλλαγή.</span>
              </li>
            </ol>
            <a
              href={SUGGEST_URL.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              <GithubIcon />
              Άνοιγμα φόρμας πρότασης
            </a>
          </div>

          {/* Option B: Pull Request */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔧</span>
              <h3 className="text-lg font-semibold">Μέσω Pull Request</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Για χρήστες εξοικειωμένους με το GitHub. Επεξεργαστείτε απευθείας το αρχείο JSON και
              υποβάλτε την αλλαγή.
            </p>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <StepBadge n={1} />
                <span>
                  Ανοίξτε το{' '}
                  <a
                    href={JSON_FILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    config/articleCategories.json
                  </a>{' '}
                  στο GitHub.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <StepBadge n={2} />
                <span>
                  Πατήστε το εικονίδιο ✏️ <em>(Edit this file)</em>. Το GitHub θα δημιουργήσει
                  αυτόματα ένα fork στον λογαριασμό σας.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <StepBadge n={3} />
                <span>
                  Προσθέστε την κατηγορία σας στον κατάλληλο πίνακα (<code className="bg-gray-100 px-1 rounded font-mono">articles</code>,{' '}
                  <code className="bg-gray-100 px-1 rounded font-mono">news</code> ή{' '}
                  <code className="bg-gray-100 px-1 rounded font-mono">pollCategories</code>):
                  <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre">
{`"categories": [
  "Υπάρχουσα κατηγορία",
  "Νέα κατηγορία"  ← προσθήκη
]`}
                  </pre>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <StepBadge n={4} />
                <span>Πατήστε <em>Commit changes</em> και μετά <em>Create pull request</em>.</span>
              </li>
            </ol>
            <a
              href={JSON_FILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              <GithubIcon />
              Άνοιγμα αρχείου JSON
            </a>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}

