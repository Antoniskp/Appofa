import Link from 'next/link';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Τεχνολογίες Πλατφόρμας | Appofa',
  description:
    'Οι τεχνολογίες που χρησιμοποιεί η πλατφόρμα Appofa, με ομαδοποιημένη παρουσίαση και συνδέσμους προς κάθε εργαλείο.',
  openGraph: {
    title: 'Τεχνολογίες Πλατφόρμας | Appofa',
    description:
      'Οι τεχνολογίες που χρησιμοποιεί η πλατφόρμα Appofa, με ομαδοποιημένη παρουσίαση και συνδέσμους προς κάθε εργαλείο.',
    url: `${SITE_URL}/platform/technology`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Τεχνολογίες Πλατφόρμας | Appofa',
    description:
      'Οι τεχνολογίες που χρησιμοποιεί η πλατφόρμα Appofa, με ομαδοποιημένη παρουσίαση και συνδέσμους προς κάθε εργαλείο.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/technology`,
  },
};

const technologyGroups = [
  {
    title: 'Frontend & UI',
    description: 'Το περιβάλλον χρήστη και η εμπειρία πλοήγησης.',
    items: [
      { name: 'Next.js', href: 'https://nextjs.org', logo: 'N', color: 'from-black to-gray-700' },
      { name: 'React', href: 'https://react.dev', logo: 'R', color: 'from-cyan-500 to-blue-500' },
      { name: 'Tailwind CSS', href: 'https://tailwindcss.com', logo: 'TW', color: 'from-cyan-400 to-sky-600' },
      { name: 'Heroicons', href: 'https://heroicons.com', logo: 'HI', color: 'from-indigo-500 to-violet-600' },
      { name: 'Chart.js', href: 'https://www.chartjs.org', logo: 'CJ', color: 'from-rose-500 to-orange-500' },
    ],
  },
  {
    title: 'Backend, Data & API',
    description: 'Η υποδομή εφαρμογής και η διαχείριση δεδομένων.',
    items: [
      { name: 'Node.js', href: 'https://nodejs.org', logo: 'N', color: 'from-green-500 to-emerald-700' },
      { name: 'Express', href: 'https://expressjs.com', logo: 'Ex', color: 'from-gray-700 to-gray-900' },
      { name: 'PostgreSQL', href: 'https://www.postgresql.org', logo: 'PG', color: 'from-blue-700 to-indigo-800' },
      { name: 'Sequelize', href: 'https://sequelize.org', logo: 'SQ', color: 'from-sky-600 to-blue-700' },
      { name: 'Nodemailer', href: 'https://nodemailer.com', logo: 'NM', color: 'from-amber-500 to-orange-600' },
      { name: 'Web Push', href: 'https://developer.mozilla.org/en-US/docs/Web/API/Push_API', logo: 'WP', color: 'from-purple-500 to-indigo-600' },
    ],
  },
  {
    title: 'Χάρτες, DevOps & Ποιότητα',
    description: 'Χαρτογραφικές δυνατότητες, deployment και testing.',
    items: [
      { name: 'Leaflet', href: 'https://leafletjs.com', logo: 'L', color: 'from-lime-500 to-green-700' },
      { name: 'React-Leaflet', href: 'https://react-leaflet.js.org', logo: 'RL', color: 'from-teal-500 to-emerald-700' },
      { name: 'Docker', href: 'https://www.docker.com', logo: 'D', color: 'from-sky-500 to-blue-700' },
      { name: 'Jest', href: 'https://jestjs.io', logo: 'J', color: 'from-red-600 to-rose-700' },
      { name: 'Placemark', href: 'https://play.placemark.io', logo: 'PM', color: 'from-fuchsia-500 to-violet-600' },
      { name: 'GitHub', href: 'https://github.com', logo: 'GH', color: 'from-slate-700 to-slate-900' },
    ],
  },
  {
    title: 'AI & Assistance',
    description: 'Εργαλεία τεχνητής νοημοσύνης και παραγωγικότητας.',
    items: [
      { name: 'AI', href: 'https://en.wikipedia.org/wiki/Artificial_intelligence', logo: 'AI', color: 'from-purple-500 to-pink-500' },
      { name: 'ChatGPT', href: 'https://chatgpt.com', logo: 'CG', color: 'from-emerald-500 to-teal-700' },
      { name: 'Claude', href: 'https://claude.ai', logo: 'CL', color: 'from-orange-400 to-amber-600' },
    ],
  },
];

function TechnologyCard({ name, href, logo, color }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`${name} (άνοιγμα σε νέο παράθυρο)`}
      className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white font-bold text-sm tracking-wide`}
          aria-hidden="true"
        >
          {logo}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{name}</p>
          <p className="text-sm text-gray-500 truncate">{href.replace(/^https?:\/\//, '')}</p>
        </div>
      </div>
    </a>
  );
}

export default function TechnologyPage() {
  return (
    <StaticPageLayout
      title="Τεχνολογίες Πλατφόρμας"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <section className="-mt-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6">
        <p className="text-lg text-gray-700 leading-relaxed">
          Το Appofa βασίζεται σε σύγχρονη στοίβα τεχνολογιών για frontend, backend, δεδομένα, χάρτες,
          ασφάλεια και παραγωγικότητα. Παρακάτω θα βρείτε τις βασικές τεχνολογίες με άμεσους συνδέσμους.
        </p>
      </section>

      <div className="space-y-8 mt-8">
        {technologyGroups.map((group) => (
          <section key={group.title}>
            <h2 className="text-xl font-semibold text-gray-900">{group.title}</h2>
            <p className="text-gray-600 mt-1 mb-4">{group.description}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => (
                <TechnologyCard key={item.name} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        Οι ονομασίες και τα εμπορικά σήματα των τεχνολογιών ανήκουν στους αντίστοιχους κατόχους τους.
      </section>
    </StaticPageLayout>
  );
}
