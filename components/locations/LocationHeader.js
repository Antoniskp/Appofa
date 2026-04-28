import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { PencilIcon } from '@heroicons/react/24/outline';
import LocationSections from '@/components/LocationSections';
import { HEADER_SECTION_TYPES } from '@/lib/constants/locations';

export default function LocationHeader({
  location,
  sections,
  children,
  activePolls,
  newsArticles,
  regularArticles,
  entities,
  imageError,
  setImageError,
  canManageLocations,
  onEdit,
}) {
  const publishedSections = sections.filter(s => s.isPublished);
  const headerSections = publishedSections.filter(s => HEADER_SECTION_TYPES.includes(s.type));

  const locationNeedsModerator = !location.hasModerator;
  const moderatorDisplayName = [location?.moderatorPreview?.firstNameNative, location?.moderatorPreview?.lastNameNative]
    .filter(Boolean)
    .join(' ')
    .trim() || location?.moderatorPreview?.username || '';

  const formatPopulation = (pop) => {
    if (!pop) return null;
    return new Intl.NumberFormat('en-US').format(pop);
  };

  return (
    <>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        {/* ── Left / main column ── */}
        <div className="md:col-span-2">
          <div className="flex items-start gap-4">
            {/* Location image: uploaded image takes priority, falls back to Wikipedia */}
            {(location.imageUrl || location.wikipedia_image_url) && !imageError && (
              <div className="flex-shrink-0">
                <img
                  src={location.imageUrl || location.wikipedia_image_url}
                  alt={`${location.name}${!location.imageUrl ? ' - Wikipedia' : ''}`}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover bg-gray-50 shadow-sm"
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">{location.name}</h1>
                    <Badge variant="primary" size="sm">{location.type}</Badge>
                  </div>
                  {location.name_local && (
                    <p className="text-base text-gray-500 mt-0.5">{location.name_local}</p>
                  )}
                </div>

                {/* Single edit entry point */}
                {canManageLocations() && (
                  <button
                    onClick={onEdit}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    title="Edit location"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* Compact metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                {location.code && (
                  <span><span className="font-medium text-gray-700">Code:</span> {location.code}</span>
                )}
                {location.lat && location.lng && (
                  <span><span className="font-medium text-gray-700">Coords:</span> {location.lat}, {location.lng}</span>
                )}
                {location.population && (
                  <span><span className="font-medium text-gray-700">Pop:</span> {formatPopulation(location.population)}</span>
                )}
                {location.wikipedia_url && (
                  <a
                    href={location.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Wikipedia ↗
                  </a>
                )}
              </div>

              {/* Moderator row */}
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="font-medium text-gray-700">Συντονιστής:</span>
                {locationNeedsModerator ? (
                  <Link
                    href={`/locations/${location.slug}?apply=moderator`}
                    className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-semibold hover:bg-amber-200 transition-colors"
                    title="Γίνε συντονιστής αυτής της τοποθεσίας"
                  >
                    Χρειάζεται Συντονιστή →
                  </Link>
                ) : location.moderatorPreview ? (
                  <div className="inline-flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold text-white border border-green-200"
                      style={{ backgroundColor: location.moderatorPreview.avatarColor || '#64748b' }}
                      aria-label="Moderator avatar"
                    >
                      {location.moderatorPreview.avatar ? (
                        <img
                          src={location.moderatorPreview.avatar}
                          alt={moderatorDisplayName || 'Moderator'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (location.moderatorPreview.username?.[0] || '?').toUpperCase()
                      )}
                    </div>
                    <span className="text-gray-800">{moderatorDisplayName}</span>
                  </div>
                ) : null}
              </div>

              {/* Stats chips — only show non-zero counts */}
              {(activePolls.length > 0 || newsArticles.length > 0 || regularArticles.length > 0 || entities.usersCount > 0) ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {activePolls.length > 0 && (
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                      Ψηφοφορίες: {activePolls.length}
                    </span>
                  )}
                  {newsArticles.length > 0 && (
                    <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                      Ειδήσεις: {newsArticles.length}
                    </span>
                  )}
                  {regularArticles.length > 0 && (
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                      Άρθρα: {regularArticles.length}
                    </span>
                  )}
                  {entities.usersCount > 0 && (
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-medium">
                      Χρήστες: {entities.usersCount}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-400 italic">Δεν υπάρχει περιεχόμενο ακόμα</p>
              )}
            </div>
          </div>

          {/* Sub-locations chips */}
          {children.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Υποπεριοχές ({children.length})</p>
              <div className="flex flex-wrap gap-2">
                {children.map(child => (
                  <Link
                    key={child.id}
                    href={`/locations/${child.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors text-sm"
                  >
                    <span className="font-medium">{child.name_local || child.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column — Info panel ── */}
        {(location.wikipedia_url || headerSections.length > 0) && (
          <div className="mt-6 md:mt-0 md:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 h-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Πληροφορίες</h3>

              {/* Wikipedia link + last-updated */}
              {location.wikipedia_url && (
                <div className="text-sm mb-3">
                  <a
                    href={location.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Wikipedia ↗
                  </a>
                  {location.wikipedia_data_updated_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      Ενημερώθηκε: {new Date(location.wikipedia_data_updated_at).toLocaleDateString('el-GR')}
                    </div>
                  )}
                </div>
              )}

              {/* Official links + contacts sections */}
              {headerSections.length > 0 && (
                <div className="space-y-4">
                  {headerSections.map(section => (
                    <div key={section.id}>
                      <LocationSections sections={[section]} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
