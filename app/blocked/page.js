import Link from 'next/link';

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="text-4xl mb-4" aria-hidden>🛡️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Access from your region is currently restricted.</h1>
        <p className="text-gray-600 mb-6">If you think this is a mistake, please contact support.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
