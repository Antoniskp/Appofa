import { publicPageMetadata, MetadataLayout } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('static_pages.contact_title', 'metadata.contactDescription', '/contact');
export default MetadataLayout;
