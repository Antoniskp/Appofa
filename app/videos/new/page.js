'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import VideoPostForm from '@/components/articles/VideoPostForm';

function NewVideoContent() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Αρχική
        </Link>

        {/* Header */}
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Γρήγορη Δημοσίευση Βίντεο
        </h1>

        {/* Form card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <VideoPostForm />
        </div>
      </div>
    </div>
  );
}

export default function NewVideoPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'editor', 'moderator', 'viewer']}>
      <NewVideoContent />
    </ProtectedRoute>
  );
}
