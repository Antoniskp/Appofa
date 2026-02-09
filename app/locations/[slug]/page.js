'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { locationAPI } from '@/lib/api';
import Badge from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePermissions } from '@/hooks/usePermissions';
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function LocationDetailPage() {
  const params = useParams();
  const { error: toastError, success: toastSuccess } = useToast();
  const { canManageLocations } = usePermissions();
  const [entities, setEntities] = useState({ articles: [], users: [], polls: [] });
  const [children, setChildren] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [imageError, setImageError] = useState(false);

  // Helper function to format population with commas
  const formatPopulation = (pop) => {
    if (!pop) return null;
    return pop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

        // Fetch entities linked to this location
        try {
          const entitiesResponse = await locationAPI.getLocationEntities(params.slug);
          if (entitiesResponse.success) {
            setEntities({
              articles: entitiesResponse.articles || [],
              users: entitiesResponse.users || [],
              polls: entitiesResponse.polls || [],
            });
          }
        } catch (err) {
          console.error('Failed to load entities:', err);
        }

        // Fetch child locations
        try {
          const childrenResponse = await locationAPI.getAll({ parent_id: params.slug });
          if (childrenResponse.success) {
            setChildren(childrenResponse.locations || []);
          }
        } catch (err) {
          console.error('Failed to load child locations:', err);
        }
      },
      onError: (err) => {
        console.error('Failed to load location:', err);
        toastError(err || 'Location not found');
      }
    }
  );

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

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        {breadcrumb.length > 1 && (
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              {breadcrumb.map((crumb, index) => (
                <li key={crumb.id} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  {index === breadcrumb.length - 1 ? (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  ) : (
                    <Link
                      href={`/locations/${crumb.id}`}
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

        {/* Location Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none px-2 py-1"
                    placeholder="Location name"
                    required
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900">
                    {location.name}
                  </h1>
                )}
                <Badge variant="primary" size="md">{location.type}</Badge>
              </div>
              <div className="mb-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.name_local}
                    onChange={(e) => handleInputChange('name_local', e.target.value)}
                    className="text-xl text-gray-600 border-b-2 border-blue-500 focus:outline-none px-2 py-1 w-full max-w-md"
                    placeholder="Local name (optional)"
                  />
                ) : (
                  location.name_local && (
                    <p className="text-xl text-gray-600">{location.name_local}</p>
                  )
                )}
              </div>
            </div>
            
            {/* Edit/Save/Cancel Buttons */}
            {canManageLocations() && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Save changes"
                    >
                      <CheckIcon className="h-5 w-5" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Cancel editing"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Edit location"
                  >
                    <PencilIcon className="h-5 w-5" />
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {(isEditing || location.code) && (
              <div>
                <span className="font-medium text-gray-700">Code:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="ml-2 text-gray-600 border-b border-blue-500 focus:outline-none px-2 py-1"
                    placeholder="Location code"
                  />
                ) : (
                  <span className="ml-2 text-gray-600">{location.code}</span>
                )}
              </div>
            )}
            {(isEditing || (location.lat && location.lng)) && (
              <div>
                <span className="font-medium text-gray-700">Coordinates:</span>
                {isEditing ? (
                  <div className="inline-flex gap-2 ml-2">
                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={editedData.lat}
                      onChange={(e) => handleInputChange('lat', e.target.value)}
                      className="w-32 text-gray-600 border-b border-blue-500 focus:outline-none px-2 py-1"
                      placeholder="Latitude"
                    />
                    <span className="text-gray-600">,</span>
                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={editedData.lng}
                      onChange={(e) => handleInputChange('lng', e.target.value)}
                      className="w-32 text-gray-600 border-b border-blue-500 focus:outline-none px-2 py-1"
                      placeholder="Longitude"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-600">
                    {location.lat}, {location.lng}
                  </span>
                )}
              </div>
            )}
            {(isEditing || location.wikipedia_url) && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Wikipedia:</span>
                {isEditing ? (
                  <input
                    type="url"
                    value={editedData.wikipedia_url}
                    onChange={(e) => handleInputChange('wikipedia_url', e.target.value)}
                    className="ml-2 text-gray-600 border-b border-blue-500 focus:outline-none px-2 py-1 w-full max-w-lg"
                    placeholder="https://en.wikipedia.org/wiki/..."
                  />
                ) : (
                  <a
                    href={location.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    View on Wikipedia →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Wikipedia Image and Population */}
          {(location.wikipedia_image_url || location.population) && !isEditing && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* Wikipedia Image */}
              {location.wikipedia_image_url && !imageError && (
                <div className="mb-4">
                  <img
                    src={location.wikipedia_image_url}
                    alt={`${location.name} - Wikipedia`}
                    className="w-full max-w-2xl rounded-lg shadow-sm"
                    onError={() => setImageError(true)}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    Image from{' '}
                    <a
                      href={location.wikipedia_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Wikipedia
                    </a>
                    {location.wikipedia_data_updated_at && (
                      <span>
                        {' '}- Last updated: {new Date(location.wikipedia_data_updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Population */}
              {location.population && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Population: </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPopulation(location.population)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Compact Sub-locations */}
          {children.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Sub-locations ({children.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {children.map(child => (
                  <Link
                    key={child.id}
                    href={`/locations/${child.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors text-sm"
                  >
                    <span className="font-medium">{child.name}</span>
                    {child.name_local && (
                      <span className="text-blue-600">({child.name_local})</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* News Articles */}
        {newsArticles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              News ({newsArticles.length})
            </h2>
            <div className="space-y-3">
              {newsArticles.map(article => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                  {article.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    {article.author && (
                      <span>by {article.author.username}</span>
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regular Articles */}
          {regularArticles.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Articles ({regularArticles.length})
              </h2>
              <div className="space-y-3">
                {regularArticles.map(article => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                    {article.summary && (
                      <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{article.type}</span>
                      {article.author && (
                        <>
                          <span>•</span>
                          <span>by {article.author.username}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Linked Users */}
          {entities.users.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Users from this Location ({entities.users.length})
              </h2>
              <div className="space-y-2">
                {entities.users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-md"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: user.avatarColor || '#64748b' }}
                    >
                      {user.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.username}</div>
                      {(user.firstName || user.lastName) && (
                        <div className="text-sm text-gray-500">
                          {user.firstName} {user.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Polls */}
          {entities.polls.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Polls ({entities.polls.length})
              </h2>
              <div className="space-y-3">
                {entities.polls.map(poll => (
                  <Link
                    key={poll.id}
                    href={`/polls/${poll.id}`}
                    className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{poll.title}</h3>
                    {poll.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{poll.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span className="capitalize">{poll.status}</span>
                      {poll.creator && (
                        <>
                          <span>•</span>
                          <span>by {poll.creator.username}</span>
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
            </div>
          )}

          {/* Empty State */}
          {entities.articles.length === 0 && entities.users.length === 0 && entities.polls.length === 0 && children.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
              <p className="text-center text-gray-500">
                No articles, users, polls, or sub-locations linked to this location yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
