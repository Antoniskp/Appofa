import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const geojson = await fs.readFile(path.join(process.cwd(), 'config', 'map-data', 'electoral-districts.geojson'), 'utf8');
  return new Response(geojson, { headers: { 'Content-Type': 'application/geo+json' } });
}
