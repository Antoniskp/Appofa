'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { locationAPI, locationSectionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Badge from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePermissions } from '@/hooks/usePermissions';
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { idSlug } from '@/lib/utils/slugify';
import LocationSections from '@/components/LocationSections';
import LocationSectionManager from '@/components/LocationSectionManager';

const VALID_TABS = ['polls', 'news', 'articles', 'users'];
const DEFAULT_TAB = 'polls';

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { canManageLocations } = usePermissions();
  const isAuthenticated = !authLoading && !!user;
  const [entities, setEntities] = useState({ articles: [], users: [], polls: [], usersCount: 0 });
  const [children, setChildren] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [imageError, setImageError] = useState(false);
  const [sections, setSections] = useState([]);

  // Derive active tab from URL query param
  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : DEFAULT_TAB;

  const handleTabChange = (tab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('tab', tab);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  // Helper function to format population with commas
  const formatPopulation = (pop) => {
    if (!pop) return null;
    return new Intl.NumberFormat('en-US').format(pop);
  };

  const { data: location, loading, error, refetch } = useAsyncData(
    async () => {
      const locationResponse = await locationAPI.getById(params.slug);
      if (!locationResponse.success) {
        throw new Error('Location not found');
      }
      return locationResponse.location;
    },
    [params.slug],
    {
      onSuccess: async (loc) => {
        // Build breadcrumb
        const crumbs = [];
        let current = loc;
        while (current) {
          crumbs.unshift(current);
          current = current.parent;
        }
        setBreadcrumb(crumbs);

        // Initialize edited data
        setEditedData({
          name: loc.name,
          name_local: loc.name_local || '',
          code: loc.code || '',
          lat: loc.lat || '',
          lng: loc.lng || '',
          wikipedia_url: loc.wikipedia_url || '',
        });

        // Use the resolved numeric ID for subsequent queries
        const locId = loc.id;

        // Fetch entities linked to this location
        try {
          const entitiesResponse = await locationAPI.getLocationEntities(locId);
          if (entitiesResponse.success) {
            setEntities({
              articles: entitiesResponse.articles || [],
              users: entitiesResponse.users || [],
              polls: entitiesResponse.polls || [],
              usersCount: entitiesResponse.usersCount || 0,
            });
          }
        } catch (err) {
          console.error('Failed to load entities:', err);
        }

        // Fetch child locations
        try {
          const childrenResponse = await locationAPI.getAll({ parent_id: locId });
          if (childrenResponse.success) {
            setChildren(childrenResponse.locations || []);
          }
        } catch (err) {
          console.error('Failed to load child locations:', err);
        }

        // Fetch location sections (public: only published; moderators see drafts too)
        try {
          const sectionsResponse = await locationSectionAPI.getSections(locId);
          if (sectionsResponse.success) {
            setSections(sectionsResponse.sections || []);
          }
        } catch (err) {
          console.error('Failed to load sections:', err);
        }
      },
      onError: (err) => {
        console.error('Failed to load location:', err);
        toastError(err || 'Location not found');
      }
    }
  );

  // Redirect numeric-ID URLs to canonical slug URLs
  useEffect(() => {
    if (!location?.slug) return;
    if (/^\d+$/.test(params.slug) && location.slug !== params.slug) {
      router.replace(`/locations/${location.slug}`);
    }
  }, [location, params.slug, router]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset edited data to original values
    if (location) {
      setEditedData({
        name: location.name,
        name_local: location.name_local || '',
        code: location.code || '',
        lat: location.lat || '',
        lng: location.lng || '',
        wikipedia_url: location.wikipedia_url || '',
      });
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!location) return;

    // Validate required field
    if (!editedData.name || !editedData.name.trim()) {
      toastError('Location name is required');
      return;
    }

    // Validate coordinates
    const lat = editedData.lat !== '' ? parseFloat(editedData.lat) : null;
    const lng = editedData.lng !== '' ? parseFloat(editedData.lng) : null;

    if (editedData.lat !== '' && (isNaN(lat) || lat < -90 || lat > 90)) {
      toastError('Latitude must be a number between -90 and 90');
      return;
    }

    if (editedData.lng !== '' && (isNaN(lng) || lng < -180 || lng > 180)) {
      toastError('Longitude must be a number between -180 and 180');
      return;
    }

    // Validate Wikipedia URL if provided
    if (editedData.wikipedia_url && editedData.wikipedia_url.trim()) {
      try {
        const url = new URL(editedData.wikipedia_url);
        if (!url.hostname.endsWith('.wikipedia.org')) {
          toastError('Wikipedia URL must be from a Wikipedia domain (e.g., en.wikipedia.org)');
          return;
        }
      } catch {
        toastError('Please enter a valid Wikipedia URL');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updateData = {
        name: editedData.name.trim(),
        name_local: editedData.name_local.trim() || null,
        code: editedData.code.trim() || null,
        lat,
        lng,
        wikipedia_url: editedData.wikipedia_url.trim() || null,
      };

      const response = await locationAPI.update(location.id, updateData);
      
      if (response.success) {
        toastSuccess('Location updated successfully');
        setIsEditing(false);
        // Refetch the location data
        await refetch();
      } else {
        toastError(response.message || 'Failed to update location');
      }
    } catch (err) {
      console.error('Failed to update location:', err);
      toastError(err.message || 'Failed to update location');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">Loading location...</p>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-red-600 mb-4">{error || 'Location not found'}</p>
        <Link href="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Separate articles into news and regular articles (single iteration)
  const { newsArticles, regularArticles } = entities.articles.reduce(
    (acc, article) => {
      if (article.type === 'news') {
        acc.newsArticles.push(article);
      } else {
        acc.regularArticles.push(article);
      }
      return acc;
    },
    { newsArticles: [], regularArticles: [] }
  );

  // Filter out archived polls (single iteration)
  const activePolls = entities.polls.filter(poll => poll.status !== 'archived');

  const locationNeedsModerator = !location.hasModerator;
  const moderatorDisplayName = [location?.moderatorPreview?.firstName, location?.moderatorPreview?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || location?.moderatorPreview?.username || '';

  const TAB_LABELS = {
    polls: `Polls${activePolls.length ? ` (${activePolls.length})` : ''}`,
    news: `News${newsArticles.length ? ` (${newsArticles.length})` : ''}`,
    articles: `Articles${regularArticles.length ? ` (${regularArticles.length})` : ''}`,
    users: `Users${entities.usersCount ? ` (${entities.usersCount})` : ''}`,
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        {breadcrumb.length > 1 && (
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              {breadcrumb.map((crumb, index) => (
                <li key={crumb.id} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
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
        )}

        {/* Compact Location Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {isEditing ? (
            /* ── Edit Mode ─────────────────────────────────────────── */
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Edit Location</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckIcon className="h-5 w-5" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    Cancel
                  </button>
                </div>
              </div>

              {/* Location detail fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editedData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Location name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local name</label>
                  <input
                    type="text"
                    value={editedData.name_local}
                    onChange={(e) => handleInputChange('name_local', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Local name (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={editedData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Location code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates (lat, lng)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={editedData.lat}
                      onChange={(e) => handleInputChange('lat', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={editedData.lng}
                      onChange={(e) => handleInputChange('lng', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Longitude"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wikipedia URL</label>
                  <input
                    type="url"
                    value={editedData.wikipedia_url}
                    onChange={(e) => handleInputChange('wikipedia_url', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://en.wikipedia.org/wiki/..."
                  />
                </div>
              </div>

              {/* Section manager — part of the same edit flow */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Manage Sections</h3>
                <LocationSectionManager locationId={location.id} />
              </div>
            </div>
          ) : (
            /* ── View Mode ─────────────────────────────────────────── */
            <>
              <div className="flex items-start gap-4">
                {/* Optional Wikipedia image thumbnail */}
                {location.wikipedia_image_url && !imageError && (
                  <div className="hidden sm:block flex-shrink-0">
                    <img
                      src={location.wikipedia_image_url}
                      alt={`${location.name} - Wikipedia`}
                      className="w-20 h-20 rounded-lg object-cover bg-gray-50 shadow-sm"
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
                        onClick={handleEdit}
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
                      <span className="font-semibold text-amber-700">Χρειάζεται Συντονιστή</span>
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

                  {/* Stats chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                      Polls: {activePolls.length}
                    </span>
                    <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                      News: {newsArticles.length}
                    </span>
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                      Articles: {regularArticles.length}
                    </span>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-medium">
                      Users: {entities.usersCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wikipedia image caption (mobile — shown below header) */}
              {location.wikipedia_image_url && !imageError && location.wikipedia_url && (
                <p className="sm:hidden text-xs text-gray-400 mt-2">
                  Image:{' '}
                  <a href={location.wikipedia_url} target="_blank" rel="noopener noreferrer" className="underline">
                    Wikipedia
                  </a>
                </p>
              )}

              {/* Sub-locations chips */}
              {children.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Sub-locations ({children.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {children.map(child => (
                      <Link
                        key={child.id}
                        href={`/locations/${child.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors text-sm"
                      >
                        <span className="font-medium">{child.name}</span>
                        {child.name_local && (
                          <span className="text-blue-500 text-xs">({child.name_local})</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Location Sections (published) — shown between header and tabs */}
        {!isEditing && sections.filter(s => s.isPublished).length > 0 && (
          <div className="mb-6">
            <LocationSections sections={sections} />
          </div>
        )}

        {/* Tabbed content — only shown when not editing */}
        {!isEditing && (
          <div className="bg-white rounded-lg shadow-md">
            {/* Tab bar */}
            <div
              className="flex border-b border-gray-200 overflow-x-auto"
              role="tablist"
              aria-label="Location content tabs"
            >
              {VALID_TABS.map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls={`tabpanel-${tab}`}
                  id={`tab-${tab}`}
                  onClick={() => handleTabChange(tab)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTabChange(tab);
                    }
                    if (e.key === 'ArrowRight') {
                      const next = VALID_TABS[(VALID_TABS.indexOf(tab) + 1) % VALID_TABS.length];
                      handleTabChange(next);
                    }
                    if (e.key === 'ArrowLeft') {
                      const prev = VALID_TABS[(VALID_TABS.indexOf(tab) - 1 + VALID_TABS.length) % VALID_TABS.length];
                      handleTabChange(prev);
                    }
                  }}
                  className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className="p-6">
              {/* Polls tab */}
              <div
                id="tabpanel-polls"
                role="tabpanel"
                aria-labelledby="tab-polls"
                hidden={activeTab !== 'polls'}
              >
                {activePolls.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No polls linked to this location yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activePolls.map(poll => (
                      <Link
                        key={poll.id}
                        href={`/polls/${idSlug(poll.id, poll.title)}`}
                        className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{poll.title}</h3>
                        {poll.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{poll.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span className="capitalize">{poll.status}</span>
                          {(poll.hideCreator ? 'Anonymous' : poll.creator?.username) && (
                            <>
                              <span>•</span>
                              <span>by {poll.hideCreator ? 'Anonymous' : poll.creator?.username}</span>
                            </>
                          )}
                          {poll.createdAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* News tab */}
              <div
                id="tabpanel-news"
                role="tabpanel"
                aria-labelledby="tab-news"
                hidden={activeTab !== 'news'}
              >
                {newsArticles.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No news linked to this location yet.</p>
                ) : (
                  <div className="space-y-3">
                    {newsArticles.map(article => (
                      <Link
                        key={article.id}
                        href={`/news/${idSlug(article.id, article.title)}`}
                        className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                        {article.summary && (
                          <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          {(article.hideAuthor ? 'Anonymous' : article.author?.username) && (
                            <span>by {article.hideAuthor ? 'Anonymous' : article.author?.username}</span>
                          )}
                          {article.createdAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Articles tab */}
              <div
                id="tabpanel-articles"
                role="tabpanel"
                aria-labelledby="tab-articles"
                hidden={activeTab !== 'articles'}
              >
                {regularArticles.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No articles linked to this location yet.</p>
                ) : (
                  <div className="space-y-3">
                    {regularArticles.map(article => (
                      <Link
                        key={article.id}
                        href={`/articles/${idSlug(article.id, article.title)}`}
                        className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                        {article.summary && (
                          <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{article.type}</span>
                          {(article.hideAuthor ? 'Anonymous' : article.author?.username) && (
                            <>
                              <span>•</span>
                              <span>by {article.hideAuthor ? 'Anonymous' : article.author?.username}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Users tab */}
              <div
                id="tabpanel-users"
                role="tabpanel"
                aria-labelledby="tab-users"
                hidden={activeTab !== 'users'}
              >
                {entities.usersCount === 0 ? (
                  <p className="text-center text-gray-500 py-8">No users linked to this location yet.</p>
                ) : isAuthenticated ? (
                  entities.users.length > 0 ? (
                    <div className="space-y-2">
                      {entities.users.map(u => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-md"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: u.avatarColor || '#64748b' }}
                          >
                            {u.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{u.username}</div>
                            {(u.firstName || u.lastName) && (
                              <div className="text-sm text-gray-500">
                                {u.firstName} {u.lastName}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No visible users to display.</p>
                  )
                ) : (
                  <div className="py-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Sign in or register to view {entities.usersCount} users from this location.
                    </p>
                    <div className="flex gap-3">
                      <Link
                        href="/login"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/register"
                        className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
