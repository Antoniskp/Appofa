import CamerasPageClient from '@/components/cameras/CamerasPageClient';
import { publicPageMetadata } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('cameras.title', 'cameras.subtitle', '/cameras');

export default function CamerasPage() {
  return <CamerasPageClient />;
}
