'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { manifestAPI } from '@/lib/api';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';
import { Pagination } from '@/components/ui';

const PAGE_SIZE = 20;

function ManifestSupportersContent() {
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get('manifest') || null;

  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supportersMap, setSupportersMap] = useState({});
  const [pageMap, setPageMap] = useState({});
  const [totalMap, setTotalMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const sectionRefs = useRef({});

  // Fetch manifests
  useEffect(() => {
    const fetchManifests = async () => {
      try {
        const res = await manifestAPI.getAll();
        if (res?.success) {
          const items = res.data?.manifests || [];
          setManifests(items);
          // Initialize pages
          const pages = {};
          items.forEach((m) => { pages[m.slug] = 1; });
          setPageMap(pages);
        } else {
          setError('Αποτυχία φόρτωσης μανιφέστων.');
        }
      } catch (err) {
        setError(err.message || 'Αποτυχία φόρτωσης μανιφέστων.');
      } finally {
        setLoading(false);
      }
    };
    fetchManifests();
  }, []);

  // Fetch supporters when manifests or pages change
  useEffect(() => {
    if (manifests.length === 0) return;

    manifests.forEach((manifest) => {
      const page = pageMap[manifest.slug] || 1;
      fetchSupporters(manifest.slug, page);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifests, pageMap]);

  // Auto-scroll to highlighted manifest
  useEffect(() => {
    if (highlightSlug && !loading && sectionRefs.current[highlightSlug]) {
      setTimeout(() => {
        sectionRefs.current[highlightSlug]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [highlightSlug, loading]);

  const fetchSupporters = async (slug, page) => {
    setLoadingMap((prev) => ({ ...prev, [slug]: true }));
    try {
      const res = await manifestAPI.getSupporters(slug, { page, limit: PAGE_SIZE });
      if (res?.success) {
        setSupportersMap((prev) => ({ ...prev, [slug]: res.data?.users || [] }));
        setTotalMap((prev) => ({ ...prev, [slug]: res.data?.total || 0 }));
      }
    } catch {
      // non-critical
    } finally {
      setLoadingMap((prev) => ({ ...prev, [slug]: false }));
    }
  };

  const handlePageChange = (slug, newPage) => {
    setPageMap((prev) => ({ ...prev, [slug]: newPage }));
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AlertMessage type="error" message={error} />
        </div>
      </div>
    );
  }

  if (manifests.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Υποστηρικτές Μανιφέστου</h1>
          <p className="text-gray-500">Δεν υπάρχουν ενεργά μανιφέστα αυτή τη στιγμή.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          📜 Υποστηρικτές Μανιφέστου
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Δείτε ποιοι αποδέχτηκαν τα μανιφέστα μας
        </p>

        <div className="space-y-10">
          {manifests.map((manifest) => {
            const slug = manifest.slug;
            const supporters = supportersMap[slug] || [];
            const total = totalMap[slug] || 0;
            const currentPage = pageMap[slug] || 1;
            const totalPages = Math.ceil(total / PAGE_SIZE);
            const isLoading = loadingMap[slug];
            const isHighlighted = highlightSlug === slug;

            return (
              <section
                key={slug}
                ref={(el) => { sectionRefs.current[slug] = el; }}
                className={`bg-white rounded-xl shadow-sm border p-6 ${
                  isHighlighted ? 'ring-2 ring-blue-400 border-blue-300' : 'border-gray-200'
                }`}
              >
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{manifest.title}</h2>
                  {manifest.description && (
                    <p className="text-sm text-gray-500 mt-1">{manifest.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <a
                      href={manifest.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Διαβάστε το πλήρες κείμενο →
                    </a>
                    <span className="text-sm text-gray-400">
                      {total} υποστηρικτές
                    </span>
                  </div>
                </div>

                {isLoading ? (
                  <SkeletonLoader type="list" count={4} />
                ) : supporters.length === 0 ? (
                  <p className="text-sm text-gray-400">Δεν υπάρχουν ακόμα υποστηρικτές.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {supporters.map((supporter) => (
                        <Link
                          key={supporter.id}
                          href={`/users/${supporter.username}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group"
                        >
                          <div className="relative shrink-0">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
                              style={{ backgroundColor: supporter.avatarColor || '#dbeafe' }}
                            >
                              {supporter.avatar ? (
                                <img
                                  src={supporter.avatar}
                                  alt={supporter.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-blue-600">
                                  {(supporter.firstName || supporter.username || '?')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            {supporter.displayBadgeSlug && supporter.displayBadgeTier && (
                              <img
                                src={`/images/badges/${supporter.displayBadgeSlug}-${supporter.displayBadgeTier}.svg`}
                                alt=""
                                className="absolute -bottom-1 -right-1 w-4 h-4"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">
                              {supporter.firstName && supporter.lastName
                                ? `${supporter.firstName} ${supporter.lastName}`
                                : supporter.username}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(supporter.acceptedAt).toLocaleDateString('el-GR')}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-6">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={(p) => handlePageChange(slug, p)}
                          onPrevious={() => handlePageChange(slug, Math.max(1, currentPage - 1))}
                          onNext={() => handlePageChange(slug, Math.min(totalPages, currentPage + 1))}
                        />
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ManifestSupportersPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    }>
      <ManifestSupportersContent />
    </Suspense>
  );
}
