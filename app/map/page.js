import { pageMetadata } from '@/lib/seo';
import { resolveMapLayer } from '@/lib/map-layers';
import MapPageClient from '@/components/map/MapPageClient';

export const metadata = pageMetadata('Χάρτης', 'Εκλογικές περιφέρειες, βουλευτές, υποψήφιοι και δημόσια δραστηριότητα στον χάρτη.', '/map');

export default async function MapPage({ searchParams }) {
  const query = await searchParams;
  return <MapPageClient layer={resolveMapLayer(query.layer)} districtId={typeof query.district === 'string' ? query.district : ''} />;
}
