import Link from 'next/link';

export default function LocationBreadcrumb({ breadcrumb, homeBreadcrumb }) {
  const homeLocationIds = new Set(homeBreadcrumb.map((c) => c.id));
  const isInHomeHierarchy = breadcrumb.some((c) => homeLocationIds.has(c.id));

  return (
    <>
      {/* Home breadcrumb — always visible for logged-in users with a home location */}
      {homeBreadcrumb.length > 0 && (
        <nav className="mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <ol className="flex items-center flex-wrap gap-1 text-sm">
            <li className="flex items-center text-amber-700 font-semibold mr-1">🏠</li>
            {homeBreadcrumb.map((crumb, index) => (
              <li key={crumb.id} className="flex items-center">
                {index > 0 && <span className="mx-1 text-amber-400">/</span>}
                <Link
                  href={`/locations/${crumb.slug}`}
                  className={
                    breadcrumb.some((c) => c.id === crumb.id)
                      ? 'text-amber-700 font-semibold hover:text-amber-900'
                      : 'text-amber-600 hover:text-amber-800'
                  }
                >
                  {crumb.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Current location breadcrumb — shown when not in home hierarchy, or when no home location */}
      {homeBreadcrumb.length > 0 ? (
        !isInHomeHierarchy && breadcrumb.length > 0 && (
          <nav className="mb-4">
            <ol className="flex items-center flex-wrap gap-1 text-sm text-gray-500">
              <li className="flex items-center text-gray-500 mr-1">📍 <span className="ml-1">Currently viewing:</span></li>
              {breadcrumb.map((crumb, index) => (
                <li key={crumb.id} className="flex items-center">
                  {index > 0 && <span className="mx-1">/</span>}
                  {index === breadcrumb.length - 1 ? (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  ) : (
                    <Link
                      href={`/locations/${crumb.slug}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )
      ) : (
        breadcrumb.length > 0 && (
          <nav className="mb-4">
            <ol className="flex items-center flex-wrap gap-1 text-sm text-gray-500">
              {breadcrumb.map((crumb, index) => (
                <li key={crumb.id} className="flex items-center">
                  {index > 0 && <span className="mx-1">/</span>}
                  {index === breadcrumb.length - 1 ? (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  ) : (
                    <Link
                      href={`/locations/${crumb.slug}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )
      )}
    </>
  );
}
