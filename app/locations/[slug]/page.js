'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { locationAPI } from '@/lib/api';
import Badge from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';

export default function LocationDetailPage() {
  const params = useParams();
  const { error: toastError } = useToast();
  const [entities, setEntities] = useState({ articles: [], users: [] });
  const [children, setChildren] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);

  const { data: location, loading, error } = useAsyncData(
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

        // Fetch entities linked to this location
        try {
          const entitiesResponse = await locationAPI.getLocationEntities(params.slug);
          if (entitiesResponse.success) {
            setEntities({
              articles: entitiesResponse.articles || [],
              users: entitiesResponse.users || [],
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
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {location.name}
                </h1>
                <Badge variant="primary" size="md">{location.type}</Badge>
              </div>
              {location.name_local && (
                <p className="text-xl text-gray-600 mb-4">{location.name_local}</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {location.code && (
              <div>
                <span className="font-medium text-gray-700">Code:</span>
                <span className="ml-2 text-gray-600">{location.code}</span>
              </div>
            )}
            {location.lat && location.lng && (
              <div>
                <span className="font-medium text-gray-700">Coordinates:</span>
                <span className="ml-2 text-gray-600">
                  {location.lat}, {location.lng}
                </span>
              </div>
            )}
            {location.wikipedia_url && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Wikipedia:</span>
                <a
                  href={location.wikipedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  View on Wikipedia →
                </a>
              </div>
            )}
          </div>

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

          {/* Empty State */}
          {entities.articles.length === 0 && entities.users.length === 0 && children.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
              <p className="text-center text-gray-500">
                No articles, users, or sub-locations linked to this location yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
