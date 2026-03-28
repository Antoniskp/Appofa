import Link from 'next/link';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Κόστος & Ώρες Ανάπτυξης | Appofa',
  description:
    'Εκτιμώμενο κόστος ανάπτυξης και συντήρησης της πλατφόρμας Appofa — ώρες εργασίας ανά ενότητα, ετήσιες ώρες συντήρησης και εύρος κόστους.',
  openGraph: {
    title: 'Κόστος & Ώρες Ανάπτυξης | Appofa',
    description:
      'Εκτιμώμενο κόστος ανάπτυξης και συντήρησης της πλατφόρμας Appofa — ώρες εργασίας ανά ενότητα, ετήσιες ώρες συντήρησης και εύρος κόστους.',
    url: `${SITE_URL}/platform/cost`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Κόστος & Ώρες Ανάπτυξης | Appofa',
    description:
      'Εκτιμώμενο κόστος ανάπτυξης και συντήρησης της πλατφόρμας Appofa — ώρες εργασίας ανά ενότητα, ετήσιες ώρες συντήρησης και εύρος κόστους.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/cost`,
  },
};

const devHours = [
  { module: 'Backend API (Express.js, PostgreSQL, Sequelize)', hours: '~120 ώρ.' },
  { module: 'Αυθεντικοποίηση (JWT, ρόλοι, GitHub OAuth)', hours: '~40 ώρ.' },
  { module: 'CRUD & ροή moderating άρθρων/ειδήσεων', hours: '~60 ώρ.' },
  { module: 'Σύστημα ψηφοφοριών & στατιστικών (voting, charts, export)', hours: '~50 ώρ.' },
  { module: 'Σύστημα προτάσεων & λύσεων', hours: '~30 ώρ.' },
  { module: 'Ενσωμάτωση βίντεο (YouTube / TikTok)', hours: '~20 ώρ.' },
  { module: 'Σύστημα μηνυμάτων', hours: '~25 ώρ.' },
  { module: 'Ιεραρχικό σύστημα τοποθεσιών', hours: '~20 ώρ.' },
  { module: 'Πίνακας διαχείρισης (Admin panel)', hours: '~30 ώρ.' },
  { module: 'Next.js frontend (App Router, layouts, σελίδες)', hours: '~80 ώρ.' },
  { module: 'SEO (sitemap, robots.txt, OpenGraph, JSON-LD)', hours: '~15 ώρ.' },
  { module: 'Docker / Deployment / VPS setup', hours: '~20 ώρ.' },
  { module: 'Testing (Jest, Supertest)', hours: '~20 ώρ.' },
  { module: 'Τεκμηρίωση (Documentation)', hours: '~15 ώρ.' },
];

const maintenanceHours = [
  { task: 'Ενημερώσεις εξαρτήσεων & ελέγχοι ασφαλείας', hoursPerMonth: '~4 ώρ.' },
  { task: 'Διόρθωση σφαλμάτων & μικρές βελτιώσεις', hoursPerMonth: '~8 ώρ.' },
  { task: 'Υποστήριξη moderation περιεχομένου', hoursPerMonth: '~6 ώρ.' },
  { task: 'Παρακολούθηση υποδομής / VPS', hoursPerMonth: '~4 ώρ.' },
  { task: 'Νέα χαρακτηριστικά (μέσος όρος)', hoursPerMonth: '~10 ώρ.' },
];

const costs = [
  { category: 'Αρχική ανάπτυξη (~545 ώρ.)', low: '~€16.350', high: '~€43.600' },
  { category: 'Ετήσια συντήρηση (~384 ώρ.)', low: '~€11.520', high: '~€30.720' },
  { category: 'VPS hosting (ανά έτος)', low: '~€120', high: '~€360' },
  { category: 'Domain (ανά έτος)', low: '~€15', high: '~€30' },
];

const techStack = [
  'Node.js',
  'Express.js',
  'PostgreSQL',
  'Sequelize',
  'Next.js',
  'React',
  'Tailwind CSS',
  'Docker',
  'Jest',
  'Supertest',
  'JWT',
  'GitHub OAuth',
];

export default function CostPage() {
  const totalDevHours = 545;
  const totalMaintenancePerMonth = 32;

  return (
    <StaticPageLayout
      title="Κόστος & Ώρες Ανάπτυξης"
      maxWidth="max-w-4xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Διαφανής παρουσίαση των εκτιμώμενων ωρών εργασίας και κόστους ανάπτυξης και συντήρησης της
        πλατφόρμας Appofa.
      </p>

      {/* 1. Development Hours */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">⏱️ Ώρες Ανάπτυξης</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Ενότητα / Χαρακτηριστικό</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Εκτιμώμενες Ώρες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devHours.map(({ module, hours }) => (
                <tr key={module} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800">{module}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{hours}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="px-4 py-3 font-bold text-blue-900">Σύνολο</td>
                <td className="px-4 py-3 text-right font-bold font-mono text-blue-900">~{totalDevHours} ώρ.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Maintenance Hours */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Ετήσιες Ώρες Συντήρησης</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Εργασία</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Ώρες / Μήνα</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {maintenanceHours.map(({ task, hoursPerMonth }) => (
                <tr key={task} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800">{task}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{hoursPerMonth}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="px-4 py-3 font-bold text-blue-900">Σύνολο</td>
                <td className="px-4 py-3 text-right font-bold font-mono text-blue-900">
                  ~{totalMaintenancePerMonth} ώρ./μήνα (~{totalMaintenancePerMonth * 12} ώρ./έτος)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Estimated Costs */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💶 Εκτιμώμενο Κόστος</h2>
        <p className="text-sm text-gray-600 mb-4">
          Βάσει εύρους αμοιβής freelancer/agency €30–€80 ανά ώρα.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Κατηγορία</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Χαμηλή Εκτίμηση</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Υψηλή Εκτίμηση</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costs.map(({ category, low, high }) => (
                <tr key={category} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800">{category}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-700">{low}</td>
                  <td className="px-4 py-3 text-right font-mono text-orange-700">{high}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="px-4 py-3 font-bold text-blue-900">Σύνολο 1ου Έτους</td>
                <td className="px-4 py-3 text-right font-bold font-mono text-green-800">~€28.005</td>
                <td className="px-4 py-3 text-right font-bold font-mono text-orange-800">~€74.990</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          ⚠️ Οι παραπάνω τιμές είναι <strong>εκτιμήσεις</strong>. Το πραγματικό κόστος εξαρτάται από τις
          αμοιβές του προγραμματιστή, αλλαγές στο εύρος εργασιών και επιλογές υποδομής.
        </p>
      </section>

      {/* 4. Technology Stack */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🛠️ Τεχνολογίες</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-800 font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
}
