import { publicPageMetadata, MetadataLayout } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('users.title', 'users.subtitle', '/users');
export default MetadataLayout;
