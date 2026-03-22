import StaticPageLayout from '@/components/StaticPageLayout';
import categoriesData from '@/src/data/categories.json';

export const metadata = {
  title: 'Κατηγορίες - Απόφαση',
  description: 'Όλες οι κατηγορίες άρθρων, ειδήσεων και ψηφοφοριών της πλατφόρμας Απόφαση.',
};

const SUGGEST_URL =
  'https://github.com/Antoniskp/Appofa/issues/new?' +
  'labels=category-suggestion&' +
  'title=' + encodeURIComponent('Πρόταση κατηγορίας: ') + '&' +
  'body=' + encodeURIComponent(
    '## Πρόταση νέας κατηγορίας\n\n' +
    '**Όνομα κατηγορίας:**\n<!-- Γράψτε το όνομα της κατηγορίας που προτείνετε -->\n\n' +
    '**Γονική κατηγορία (προαιρετικό):**\n<!-- π.χ. Άρθρα, Ειδήσεις ή Ψηφοφορίες -->\n\n' +
    '**Περιγραφή / Αιτιολόγηση:**\n<!-- Εξηγήστε γιατί η κατηγορία είναι χρήσιμη -->\n\n' +
    '**Σύνδεσμοι / Πηγές (προαιρετικό):**\n<!-- Προσθέστε τυχόν σχετικούς συνδέσμους -->\n'
  );

export default function CategoriesPage() {
  const { groups } = categoriesData;

  return (
    <StaticPageLayout title="Κατηγορίες" maxWidth="max-w-5xl" showHelpfulLinks={false}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Όλες οι κατηγορίες περιεχομένου της πλατφόρμας Απόφαση — άρθρα, ειδήσεις και ψηφοφορίες.
        </p>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-blue-900 mb-1">Δεν βρίσκετε την κατηγορία που θέλετε;</h2>
          <p className="text-sm text-blue-700">
            Προτείνετε μια νέα κατηγορία μέσω GitHub. Η πρότασή σας θα αξιολογηθεί από την ομάδα.
          </p>
        </div>
        <a
          href={SUGGEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          Πρότεινε κατηγορία
        </a>
      </section>

      {groups.map((group) => (
        <section key={group.id}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl" aria-hidden="true">{group.icon}</span>
            <div>
              <h2 className="text-2xl font-semibold">{group.label}</h2>
              {group.description && (
                <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {cat.label}
                {cat.description && (
                  <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="border-t border-gray-200 pt-8">
        <h2 className="text-xl font-semibold mb-3">Πώς να υποβάλετε αλλαγές</h2>
        <p className="text-gray-700 mb-4">
          Οι κατηγορίες αποθηκεύονται σε ένα αρχείο JSON στο αποθετήριο.
          Μπορείτε να προτείνετε αλλαγές με δύο τρόπους:
        </p>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>
            <strong>Μέσω GitHub Issue:</strong>{' '}
            <a
              href={SUGGEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Ανοίξτε μια νέα πρόταση
            </a>{' '}
            με τη φόρμα που σας παρέχεται.
          </li>
          <li>
            <strong>Μέσω Pull Request:</strong> Κάντε fork το{' '}
            <a
              href="https://github.com/Antoniskp/Appofa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              αποθετήριο
            </a>
            , επεξεργαστείτε το αρχείο{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
              src/data/categories.json
            </code>{' '}
            και υποβάλτε Pull Request.
          </li>
        </ol>
      </section>
    </StaticPageLayout>
  );
}
