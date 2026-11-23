import { publicPageMetadata, MetadataLayout } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('metadata.proposalProgress', 'metadata.progressDescription', '/progress');
export default MetadataLayout;
