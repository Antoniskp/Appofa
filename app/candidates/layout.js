import { publicPageMetadata, MetadataLayout } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('candidates.page_title', 'candidates.page_description', '/candidates');
export default MetadataLayout;
