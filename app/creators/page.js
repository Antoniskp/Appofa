import TikTokCreatorDirectory from '@/components/creators/TikTokCreatorDirectory';
import { publicPageMetadata } from '@/lib/route-metadata';
import { TIKTOK_CREATOR_CATEGORIES } from '@/config/tiktokCreators';

const creatorMetadata = publicPageMetadata('tiktokCreators.invitationTitle', 'tiktokCreators.shareDescription', '/creators');

export async function generateMetadata() {
  const metadata = await creatorMetadata();
  const image = new URL('/images/branding/tiktok-creator-share.jpg', metadata.openGraph.url).href;
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: [{ url: image, width: 1200, height: 630, alt: metadata.openGraph.title }] },
    twitter: { ...metadata.twitter, images: [image] },
  };
}

export default async function CreatorsPage({ searchParams }) {
  const { category, locationId, q } = await searchParams;
  const initialCategory = TIKTOK_CREATOR_CATEGORIES.includes(category) ? category : '';
  const id = typeof locationId === 'string' && /^\d+$/.test(locationId) ? Number(locationId) : 0;
  const initialLocationId = id > 0 && id <= 2147483647 ? id : null;
  const initialSearch = typeof q === 'string' ? q.slice(0, 100) : '';
  return <TikTokCreatorDirectory key={`${initialCategory}-${initialLocationId}-${initialSearch}`}
    initialCategory={initialCategory} initialLocationId={initialLocationId} initialSearch={initialSearch} />;
}
