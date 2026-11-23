import TikTokCreatorDirectory from '@/components/creators/TikTokCreatorDirectory';
import { publicPageMetadata } from '@/lib/route-metadata';
import { TIKTOK_CREATOR_CATEGORIES } from '@/config/tiktokCreators';

export const generateMetadata = publicPageMetadata('tiktokCreators.title', 'tiktokCreators.subtitle', '/creators');

export default async function CreatorsPage({ searchParams }) {
  const { category, locationId, q } = await searchParams;
  const initialCategory = TIKTOK_CREATOR_CATEGORIES.includes(category) ? category : '';
  const id = typeof locationId === 'string' && /^\d+$/.test(locationId) ? Number(locationId) : 0;
  const initialLocationId = id > 0 && id <= 2147483647 ? id : null;
  const initialSearch = typeof q === 'string' ? q.slice(0, 100) : '';
  return <TikTokCreatorDirectory key={`${initialCategory}-${initialLocationId}-${initialSearch}`}
    initialCategory={initialCategory} initialLocationId={initialLocationId} initialSearch={initialSearch} />;
}
