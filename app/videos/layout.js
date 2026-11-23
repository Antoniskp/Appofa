import { publicPageMetadata, MetadataLayout } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('videos.title', 'videos.subtitle', '/videos');
export default MetadataLayout;
