import { Suspense } from 'react';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }) {
  return <Suspense fallback={<div className="p-6" role="status">...</div>}>{children}</Suspense>;
}
