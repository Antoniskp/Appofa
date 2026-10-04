import Link from 'next/link';
import { idSlug } from '@/lib/utils/slugify';

export default function LocationActionSummary({ polls = [], suggestions = [], news = [], articles = [], loading }) {
  const recent = (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
  const votes = polls.filter(p => p.status === 'active').sort(recent).slice(0, 2).map(p => ({ ...p, kind: 'Ανοιχτή ψηφοφορία', href: '/polls/' + idSlug(p.id, p.title), excerpt: p.description }));
  const updates = [
    ...suggestions.map(p => ({ ...p, kind: 'Πρόταση', href: '/suggestions/' + p.id, excerpt: p.body })),
    ...news.map(p => ({ ...p, kind: 'Είδηση', href: '/news/' + idSlug(p.id, p.title), excerpt: p.summary })),
    ...articles.map(p => ({ ...p, kind: 'Άρθρο', href: '/articles/' + idSlug(p.id, p.title), excerpt: p.summary })),
  ].sort(recent);
  const items = [...votes, ...updates].slice(0, 4);
  return (
    <section id="location-overview" className="mb-8 scroll-mt-36">
      <h2 className="text-lg font-semibold text-gray-950">Τι συμβαίνει εδώ;</h2>
      {loading ? <p role="status" className="py-6 text-sm text-gray-500">Φόρτωση δραστηριότητας…</p> : items.length ? (
        <div className="mt-3 divide-y divide-gray-200">
          {items.map(item => <Link key={item.href} href={item.href} className="block py-4 group">
            <p className="text-xs text-gray-500">{item.kind}{item.createdAt && !Number.isNaN(Date.parse(item.createdAt)) ? ' · ' + new Date(item.createdAt).toLocaleDateString('el-GR') : ''}</p>
            <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-blue-700">{item.title}</h3>
            {item.excerpt && <p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.excerpt}</p>}
            {item.kind === 'Ανοιχτή ψηφοφορία' && <span className="mt-2 inline-block text-sm font-semibold text-blue-700">Δες την ψηφοφορία →</span>}
          </Link>)}
        </div>
      ) : <p className="mt-3 text-sm leading-6 text-gray-600">Δεν υπάρχει ακόμη πρόσφατη δραστηριότητα. Μπορείς να ξεκινήσεις την πρώτη πρόταση για την περιοχή ή να γνωρίσεις τους εκπροσώπους και τις τοπικές πληροφορίες παρακάτω.</p>}
    </section>
  );
}
