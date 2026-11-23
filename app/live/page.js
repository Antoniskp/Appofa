import LiveStreamsMap from '@/components/live/LiveStreamsMap';
import { publicPageMetadata } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('nav.live_map', 'metadata.liveDescription', '/live');

export default function LivePage() {
  return <LiveStreamsMap />;
}
