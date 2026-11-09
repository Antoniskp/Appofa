import fs from 'node:fs';
import path from 'node:path';
import ParliamentarianDirectory from '@/components/political/ParliamentarianDirectory';

const regionsGeoJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config', 'map-data', 'regions.geojson'), 'utf8'));

export const metadata = {
  title: 'Βουλευτές | Appofasi',
  description: 'Αναζητήστε τους βουλευτές ανά κόμμα και εκλογική περιφέρεια.',
};

export default function ParliamentariansPage() {
  return <ParliamentarianDirectory regionsGeoJson={regionsGeoJson} />;
}
