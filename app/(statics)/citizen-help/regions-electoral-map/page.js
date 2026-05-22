import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AnalyticalMappingExplorer from '@/components/political/AnalyticalMappingExplorer';
import regionsMetaData from '@/config/map-data/regions.metadata.json';
import districtsMetaData from '@/config/map-data/electoral-districts.metadata.json';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Περιφέρειες & Εκλογικές Περιφέρειες — Χαρτογράφηση & Ανάλυση',
  description: 'Αναλυτική χαρτογράφηση των 13 Περιφερειών της Ελλάδας με εκλογικές περιφέρειες, έδρες και σύνδεση με τις υπάρχουσες τοποθεσίες του Appofa.',
  openGraph: {
    title: 'Περιφέρειες & Εκλογικές Περιφέρειες — Χαρτογράφηση & Ανάλυση',
    description: 'Αναλυτική χαρτογράφηση των 13 Περιφερειών της Ελλάδας με εκλογικές περιφέρειες, έδρες και σύνδεση με τις υπάρχουσες τοποθεσίες του Appofa.',
    url: `${SITE_URL}/citizen-help/regions-electoral-map`,
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/regions-electoral-map`,
  },
};

const sortedRegions = [...regionsMetaData.regions].sort((a, b) => b.totalSeats - a.totalSeats);
const totalDistricts = districtsMetaData.electoralDistricts.length;
const totalRegionSeats = sortedRegions.reduce((sum, region) => sum + region.totalSeats, 0);

function getRegionBadge(totalSeats) {
  if (totalSeats >= 30) return { label: '30+ έδρες', className: 'bg-red-100 text-red-800' };
  if (totalSeats >= 15) return { label: '15–29 έδρες', className: 'bg-yellow-100 text-yellow-800' };
  if (totalSeats >= 8) return { label: '8–14 έδρες', className: 'bg-blue-100 text-blue-800' };
  return { label: '< 8 έδρες', className: 'bg-green-100 text-green-800' };
}

export default function RegionsElectoralMapPage() {
  return (
    <StaticPageLayout
      title="Περιφέρειες & Εκλογικές Περιφέρειες"
      maxWidth="max-w-6xl"
      breadcrumb={
        <Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκλογές &amp; Πολιτική
        </Link>
      }
    >
      <section>
        <p className="text-lg text-gray-700 leading-relaxed">
          Η σελίδα <strong>Αναλυτική Χαρτογράφηση</strong> παρουσιάζει τις 13 Περιφέρειες και τις 59 εκλογικές
          περιφέρειες με reusable αρχιτεκτονική (ξεχωριστά metadata + GeoJSON), ώστε τα πολύγωνα να μπορούν
          να βελτιωθούν στο μέλλον χωρίς αλλαγές στον UI κώδικα.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Συγκεντρωτικός Πίνακας</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden" aria-label="Πίνακας Περιφερειών">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Περιφέρεια</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Πρωτεύουσα</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700 text-right">Εκλ. Περιφέρειες</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700 text-right">Σύνολο Εδρών</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Κατηγορία</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedRegions.map((region, index) => {
                const badge = getRegionBadge(region.totalSeats);
                return (
                  <tr key={region.id} className={index % 2 === 1 ? 'bg-gray-50' : undefined}>
                    <td className="px-4 py-3 text-gray-700 font-medium">{region.name}</td>
                    <td className="px-4 py-3 text-gray-600">{region.capital}</td>
                    <td className="px-4 py-3 text-gray-800 font-bold text-right">{region.districtIds.length}</td>
                    <td className="px-4 py-3 text-gray-800 font-bold text-right">{region.totalSeats}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr>
                <td className="px-4 py-3 text-gray-700">Σύνολο</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-gray-800 text-right">{totalDistricts}</td>
                <td className="px-4 py-3 text-gray-800 text-right">{totalRegionSeats}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Αναλυτική Χαρτογράφηση</h2>
        <AnalyticalMappingExplorer />
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
        <h2 className="text-xl font-semibold mb-2">Σημείωση για δεδομένα και γεωμετρία</h2>
        <p className="text-sm text-gray-700">
          Τα metadata των πολιτικών ενοτήτων και τα GeoJSON πολύγωνα είναι ξεχωριστά αρχεία με stable IDs,
          ώστε η ένωση δεδομένων να γίνεται με αξιόπιστο τρόπο. Τα γεωμετρικά όρια είναι προς το παρόν
          απλοποιημένα/placeholder για άμεση παραγωγική χρήση και μπορούν να αντικατασταθούν με
          επαληθευμένα δεδομένα χωρίς αλλαγή των components.
        </p>
      </section>
    </StaticPageLayout>
  );
}
