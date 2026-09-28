import logos from '@/config/partyLogos.json';

const normalize = (name) => String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('el-GR').trim().replace(/\s+/g, ' ');
const byName = new Map(logos.flatMap(logo => logo.names.map(name => [normalize(name), logo])));

// Exact normalized aliases only: never guess a party from a partial name.
export function getPartyLogo(name) {
  const logo = byName.get(normalize(name));
  return logo ? { src: `/images/parties/${logo.id}.png`, dark: Boolean(logo.dark) } : null;
}
