import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { PencilIcon } from '@heroicons/react/24/outline';
import LocationSections from '@/components/LocationSections';
import { HEADER_SECTION_TYPES, getChildLocationTerminology } from '@/lib/constants/locations';

const CHILDREN_PREVIEW_COUNT = 8;

function getFlagEmoji(code) {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return String.fromCodePoint(...[...upper].map(c => 127397 + c.charCodeAt(0)));
}

function getTypeIcon(type, code) {
  if (type === 'country') return getFlagEmoji(code) || '🌍';
  if (type === 'prefecture') return '🗺️';
  if (type === 'municipality') return '🏙️';
  if (type === 'electoral_district') return '🗳️';
  return '📍';
}

export default function LocationHeader({
  location,
  sections,
  children,
  hideChildren = false,
  activePolls,
  newsArticles,
  regularArticles,
  suggestionsCount = 0,
  entities,
  imageError,
  setImageError,
  canManageLocations,
  onEdit,
}) {
  const [showAllChildren, setShowAllChildren] = useState(false);
  const [shareState, setShareState] = useState('idle');

  const publishedSections = sections.filter(s => s.isPublished);
  const headerSections = publishedSections.filter(s => HEADER_SECTION_TYPES.includes(s.type));
  const visibleChildren = showAllChildren ? children : children.slice(0, CHILDREN_PREVIEW_COUNT);
  const hiddenChildrenCount = Math.max(children.length - visibleChildren.length, 0);
  const populationValue = location.population_override ?? location.population;
  const childLocationTerms = getChildLocationTerminology(location?.type);

  const locationNeedsModerator = !location.hasModerator;
  const hasActivePolls = activePolls.length > 0;
  const hasSuggestions = suggestionsCount > 0;
  const canEditLocation = canManageLocations();
  const moderatorDisplayName = [location?.moderatorPreview?.firstNameNative, location?.moderatorPreview?.lastNameNative]
    .filter(Boolean)
    .join(' ')
    .trim() || location?.moderatorPreview?.username || '';

  const formatPopulation = (pop) => {
    if (!pop) return null;
    return new Intl.NumberFormat('en-US').format(pop);
  };

  const locationIdentifier = location.slug || location.id;

  const hasExtendedInfo = Boolean(
    location.code
    || (location.lat && location.lng)
    || location.wikipedia_url
    || location.wikipedia_data_updated_at
    || headerSections.length > 0
  );
  const tabHref = (tab) => `/locations/${locationIdentifier}?tab=${tab}#location-content`;
  const primaryAction = hasActivePolls
    ? { href: tabHref('polls'), label: 'Ψήφισε τώρα' }
    : { href: '/suggestions/new', label: 'Κάνε πρόταση' };
  const secondaryAction = hasActivePolls
    ? { href: '/suggestions/new', label: 'Κάνε πρόταση' }
    : { href: tabHref('polls'), label: 'Δες ψηφοφορίες' };

  const shareLocation = async () => {
    const path = `/locations/${locationIdentifier}`;
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}${path}`
      : path;
    const text = `${location.name_local || location.name} — Appofa`;
    const hasNavigator = typeof navigator !== 'undefined';

    try {
      if (hasNavigator && navigator.share) {
        await navigator.share({ title: text, url });
      } else if (hasNavigator && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 1800);
      } else {
        setShareState('unsupported');
        setTimeout(() => setShareState('idle'), 1800);
        return;
      }
    } catch (error) {
      console.warn('Location share failed:', error);
      setShareState('error');
      setTimeout(() => setShareState('idle'), 1800);
    }
  };

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex items-start gap-4">
            {(() => {
              const uploadedSrc = location.imageUrl
                ? (location.imageUpdatedAt
                  ? `${location.imageUrl}?v=${new Date(location.imageUpdatedAt).getTime()}`
                  : location.imageUrl)
                : null;
              const displaySrc = uploadedSrc || location.wikipedia_image_url || null;
              if (!displaySrc || imageError) return null;
              return (
                <div className="flex-shrink-0">
                  <img
                    src={displaySrc}
                    alt={`${location.name}${!location.imageUrl ? ' - Wikipedia' : ''}`}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover bg-gray-50 shadow-sm"
                    onError={() => setImageError(true)}
                  />
                </div>
              );
            })()}

            <div className="flex-1 min-w-0">
              <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl" aria-hidden="true">{getTypeIcon(location.type, location.code)}</span>
                    <h1 className="text-2xl font-bold text-gray-900 truncate">{location.name}</h1>
                    <Badge variant="primary" size="sm">{location.type}</Badge>
                    {canEditLocation && (
                      <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        title="Επεξεργασία τοποθεσίας"
                        aria-label="Επεξεργασία τοποθεσίας"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {location.name_local && (
                    <p className="text-base text-gray-500 mt-0.5">{location.name_local}</p>
                  )}
                  {location.parent && (
                    <p className="mt-1 text-sm text-gray-600">
                      Ανήκει στην τοποθεσία: <span className="font-medium text-gray-800">{location.parent.name_local || location.parent.name}</span>
                    </p>
                  )}
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-sm">
                <span className="font-medium text-gray-700">Συντονιστής:</span>
                {locationNeedsModerator ? (
                  <Link
                    href={`/locations/${locationIdentifier}?apply=moderator`}
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

              {(populationValue || activePolls.length > 0 || suggestionsCount > 0 || entities.usersCount > 0 || newsArticles.length > 0 || regularArticles.length > 0) ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {populationValue && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Πληθυσμός</div>
                      <div className="text-sm font-semibold text-gray-900">{formatPopulation(populationValue)}</div>
                    </div>
                  )}
                  <div className={`rounded-lg border px-3 py-2 ${hasActivePolls ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`text-[11px] font-medium uppercase tracking-wide ${hasActivePolls ? 'text-blue-600' : 'text-gray-500'}`}>Ψηφοφορίες</div>
                    <div className={`text-sm font-semibold ${hasActivePolls ? 'text-blue-900' : 'text-gray-700'}`}>{activePolls.length}</div>
                  </div>
                  <div className={`rounded-lg border px-3 py-2 ${hasSuggestions ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`text-[11px] font-medium uppercase tracking-wide ${hasSuggestions ? 'text-indigo-600' : 'text-gray-500'}`}>Προτάσεις</div>
                    <div className={`text-sm font-semibold ${hasSuggestions ? 'text-indigo-900' : 'text-gray-700'}`}>{suggestionsCount}</div>
                  </div>
                  <div className={`rounded-lg border px-3 py-2 ${(entities.usersCount || 0) > 0 ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`text-[11px] font-medium uppercase tracking-wide ${(entities.usersCount || 0) > 0 ? 'text-violet-600' : 'text-gray-500'}`}>Χρήστες</div>
                    <div className={`text-sm font-semibold ${(entities.usersCount || 0) > 0 ? 'text-violet-900' : 'text-gray-700'}`}>{entities.usersCount || 0}</div>
                  </div>
                  {(newsArticles.length > 0 || regularArticles.length > 0) && (
                    <div className="col-span-2 sm:col-span-4 text-xs text-gray-500 pt-1">
                      Περιεχόμενο: Ειδήσεις {newsArticles.length} • Άρθρα {regularArticles.length}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-400 italic">Δεν υπάρχει περιεχόμενο ακόμα</p>
              )}

              {hasExtendedInfo && (
                <details className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 lg:hidden">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Περισσότερες πληροφορίες
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    {location.code && (
                      <p><span className="font-medium text-gray-700">Code:</span> {location.code}</p>
                    )}
                    {location.lat && location.lng && (
                      <p><span className="font-medium text-gray-700">Συντεταγμένες:</span> {location.lat}, {location.lng}</p>
                    )}
                    {location.wikipedia_url && (
                      <a
                        href={location.wikipedia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        Wikipedia ↗
                      </a>
                    )}
                    {location.wikipedia_data_updated_at && (
                      <p className="text-xs text-gray-500">
                        Ενημερώθηκε: {new Date(location.wikipedia_data_updated_at).toLocaleDateString('el-GR')}
                      </p>
                    )}
                    {headerSections.length > 0 && (
                      <div className="pt-2 space-y-3">
                        {headerSections.map(section => (
                          <div key={section.id}>
                            <LocationSections sections={[section]} compact />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>

          {children.length > 0 && !hideChildren && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">{childLocationTerms.label} ({children.length})</p>
              <div className="flex flex-wrap gap-2">
                {visibleChildren.map(child => (
                  <Link
                    key={child.id}
                    href={`/locations/${child.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-700 rounded-full hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 transition-colors text-sm"
                  >
                    <span className="font-medium">{child.name_local || child.name}</span>
                  </Link>
                ))}
              </div>
              {hiddenChildrenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllChildren(v => !v)}
                  aria-label={`Εναλλαγή προβολής ${childLocationTerms.genitivePlural}`}
                  className="mt-3 inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {showAllChildren ? 'Εμφάνιση λιγότερων' : `+${hiddenChildrenCount} ακόμα ${childLocationTerms.lowerPlural}`}
                </button>
              )}
            </div>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-800">Συμμετοχή τώρα</h3>
              <div className="mt-3 grid gap-2">
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  {primaryAction.label}
                </Link>
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {secondaryAction.label}
                </Link>
                <Link
                  href={tabHref('suggestions')}
                  className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  Προτάσεις περιοχής
                </Link>
                <button
                  type="button"
                  onClick={shareLocation}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {shareState === 'copied'
                    ? 'Σύνδεσμος αντιγράφηκε'
                    : shareState === 'unsupported'
                      ? 'Η κοινοποίηση δεν υποστηρίζεται'
                      : shareState === 'error'
                        ? 'Αδυναμία κοινοποίησης'
                        : 'Κοινοποίηση'}
                </button>
              </div>
            </div>

            {hasExtendedInfo && (
              <div className="hidden lg:block rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-800">Περισσότερες πληροφορίες</h3>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  {location.code && (
                    <p><span className="font-medium text-gray-700">Code:</span> {location.code}</p>
                  )}
                  {location.lat && location.lng && (
                    <p><span className="font-medium text-gray-700">Συντεταγμένες:</span> {location.lat}, {location.lng}</p>
                  )}
                  {location.wikipedia_url && (
                    <a
                      href={location.wikipedia_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Wikipedia ↗
                    </a>
                  )}
                  {location.wikipedia_data_updated_at && (
                    <p className="text-xs text-gray-500">
                      Ενημερώθηκε: {new Date(location.wikipedia_data_updated_at).toLocaleDateString('el-GR')}
                    </p>
                  )}
                  {headerSections.length > 0 && (
                    <div className="pt-2 space-y-3">
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
        </aside>
      </div>
    </>
  );
}
