'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ManifestSupporters({ manifestData }) {
  const tHome = useTranslations('home');
  return (
        <section className="bg-gradient-to-b from-ivory to-white">
          <div className="app-container py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {tHome('manifest_supporters_title')}
            </h2>
            <p className="text-sm text-gray-500 mb-8">{tHome('manifest_supporters_subtitle')}</p>
            <div className="space-y-10">
              {manifestData.map((manifest) => (
                <div key={manifest.slug}>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{manifest.title}</h3>
                      <p className="text-xs text-gray-400">
                         {tHome('manifest_total_supporters', { count: manifest.supportersCount || 0 })}
                      </p>
                    </div>
                    <Link
                      href={`/manifest-supporters?manifest=${encodeURIComponent(manifest.slug)}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                       {tHome('view_all')}
                    </Link>
                  </div>
                  {manifest.randomSupporters.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                      {manifest.randomSupporters.map((supporter) => (
                        <Link
                          key={supporter.id}
                          href={`/users/${supporter.username}`}
                          className="flex flex-col items-center group"
                        >
                          <div className="relative">
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold group-hover:ring-2 ring-blue-400 transition overflow-hidden"
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
                                className="absolute -bottom-1 -right-1 w-5 h-5"
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-600 mt-1 truncate max-w-[80px] text-center">
                            {supporter.firstName || supporter.username}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                     <p className="text-sm text-gray-400">{tHome('no_manifest_supporters')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
  );
}
