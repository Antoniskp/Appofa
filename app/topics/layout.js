import { publicPageMetadata, MetadataLayout } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('nav.topics', 'metadata.topicDescription', '/topics');
export default MetadataLayout;
