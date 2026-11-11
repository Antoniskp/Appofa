import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import StaticPageLayout from '@/components/StaticPageLayout';
import AnalyticalMappingExplorer from '@/components/political/AnalyticalMappingExplorer';
import regionsMetaData from '@/config/map-data/regions.metadata.json';
import districtsMetaData from '@/config/map-data/electoral-districts.metadata.json';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Περιφέρειες & Εκλογικές Περιφέρειες — Χαρτογράφηση & Ανάλυση',
  description: 'Αναλυτική χαρτογράφηση των 13 Περιφερειών της Ελλάδας με εκλογικές περιφέρειες, έδρες και σύνδεση με τις υπάρχουσες τοποθεσίες του Appofasi.',
  openGraph: {
    title: 'Περιφέρειες & Εκλογικές Περιφέρειες — Χαρτογράφηση & Ανάλυση',
    description: 'Αναλυτική χαρτογράφηση των 13 Περιφερειών της Ελλάδας με εκλογικές περιφέρειες, έδρες και σύνδεση με τις υπάρχουσες τοποθεσίες του Appofasi.',
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
const districtsByRegion = sortedRegions.map((region) => ({
  ...region,
  districts: region.districtIds
    .map((districtId) => districtsMetaData.electoralDistricts.find((district) => district.id === districtId))
    .filter(Boolean),
}));
const regionsGeoJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'config', 'map-data', 'regions.geojson'), 'utf8')
);
const districtsGeoJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'config', 'map-data', 'electoral-districts.geojson'), 'utf8')
);

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
        <h2 className="text-2xl font-semibold mb-3">Οι 59 Εκλογικές Περιφέρειες</h2>
        <p className="text-gray-600 leading-relaxed mb-5">
          Η παρακάτω λίστα οργανώνει τις βουλευτικές εκλογικές περιφέρειες ανά διοικητική Περιφέρεια.
          Η ομαδοποίηση είναι μόνο για ευκολότερη περιήγηση· τα όρια των εκλογικών περιφερειών
          είναι διαφορετικά από τα όρια των 13 διοικητικών Περιφερειών.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {districtsByRegion.map((region) => (
            <section key={region.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                {region.name} <span className="text-sm font-normal text-gray-500">({region.districts.length})</span>
              </h3>
              <ul className="space-y-1 text-sm text-gray-700">
                {region.districts.map((district) => (
                  <li key={district.id}>{district.name}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
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
        <AnalyticalMappingExplorer
          regionsGeoJson={regionsGeoJson}
          districtsGeoJson={districtsGeoJson}
        />
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
        <h2 className="text-xl font-semibold mb-2">Σημείωση για δεδομένα και γεωμετρία</h2>
        <p className="text-sm text-gray-700">
          Τα όρια των 59 εκλογικών περιφερειών βασίζονται στα πολύγωνα νομών του <a href="https://github.com/codeforgermany/click_that_hood/blob/main/public/data/greece-prefectures.geojson" className="text-blue-700 underline" target="_blank" rel="noreferrer">Click That Hood / Eurostat</a> (© EuroGeographics για τα διοικητικά όρια).
          Οι 10 περιφέρειες που χωρίζουν την Αττική και τη Θεσσαλονίκη σχηματίστηκαν από όρια δήμων του <a href="https://www.geoboundaries.org/api/current/gbOpen/GRC/ADM3/" className="text-blue-700 underline" target="_blank" rel="noreferrer">geoBoundaries GB Open ADM3</a> (<a href="https://creativecommons.org/publicdomain/zero/1.0/" className="text-blue-700 underline" target="_blank" rel="noreferrer">CC0 1.0</a>), σύμφωνα με την κατανομή δήμων του <a href="https://www.ypes.gr/statistika/ethnikes-ekloges/vouleutikes-ekloges/endiaferoyn-toys-syndyasmoys" className="text-blue-700 underline" target="_blank" rel="noreferrer">Υπουργείου Εσωτερικών</a>.
        </p>
      </section>
    </StaticPageLayout>
  );
}
