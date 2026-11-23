import { Suspense } from 'react';
import { privatePageMetadata } from '@/lib/route-metadata';

const adminMetadata = privatePageMetadata('metadata.adminDashboard');

export async function generateMetadata(_props, parent) {
  const [metadata, { icons }] = await Promise.all([adminMetadata(), parent]);
  return {
    ...metadata,
    icons: {
      ...icons,
      icon: [{ url: '/images/branding/admin-favicon.png', sizes: '48x48', type: 'image/png' }],
    },
  };
}

export default function AdminLayout({ children }) {
  return <Suspense fallback={<div className="p-6" role="status">...</div>}>{children}</Suspense>;
}
