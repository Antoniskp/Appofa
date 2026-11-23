import { Suspense } from 'react';
import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('metadata.adminDashboard');

export default function AdminLayout({ children }) {
  return <Suspense fallback={<div className="p-6" role="status">...</div>}>{children}</Suspense>;
}
