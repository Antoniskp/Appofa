import LiveStreamsMap from '@/components/live/LiveStreamsMap';
import { publicPageMetadata } from '@/lib/route-metadata';
import { normalizeTikTokHandle } from '@/config/tiktokCreators';

export const generateMetadata = publicPageMetadata('nav.live_map', 'metadata.liveDescription', '/live');

export default async function LivePage({ searchParams }) {
  const { creator } = await searchParams;
  const handle = normalizeTikTokHandle(creator);
  return <LiveStreamsMap key={`creator:${handle || ''}`} creatorHandle={handle} />;
}
