'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { articleAPI, pollAPI, suggestionAPI, manifestAPI, locationAPI, tagAPI, homepageSettingsAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import HomeHero from '@/components/HomeHero';
import HomepageInfoSection from '@/components/HomepageInfoSection';
import ArticleCard from '@/components/articles/ArticleCard';
import PollCard from '@/components/polls/PollCard';
import SuggestionCard from '@/components/SuggestionCard';
import HomepageSection from '@/components/HomepageSection';
import LocationCard from '@/components/locations/LocationCard';

const VideoThumbnailCard = dynamic(() => import('@/components/articles/VideoThumbnailCard'));

export default function HomePage() {
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const { user } = useAuth();

  const [latestArticles, setLatestArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState(null);

  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [pollsError, setPollsError] = useState(null);

  const [latestNews, setLatestNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState(null);

  const [manifestData, setManifestData] = useState([]);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [locationDiscovery, setLocationDiscovery] = useState([]);
  const [locationDiscoveryLoading, setLocationDiscoveryLoading] = useState(true);
  const [articleTags, setArticleTags] = useState([]);
  const [suggestionTags, setSuggestionTags] = useState([]);
  const [pollTags, setPollTags] = useState([]);
  const [homepageSettings, setHomepageSettings] = useState(null);

  const isVisibleForAudience = (audience) => {
    if (audience === 'all') return true;
    if (audience === 'guest') return !user;
    if (audience === 'registered') return !!user;
    return false;
  };

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const response = await articleAPI.getAll({
          status: 'published',
          type: 'articles',
          orderBy: 'createdAt',
          order: 'desc',
          limit: 3,
          page: 1,
        });
        if (response.success) {
          setLatestArticles(response.data.articles || []);
        }
      } catch (err) {
        setArticlesError(err.message);
      } finally {
        setArticlesLoading(false);
      }
    };

    const fetchSuggestions = async () => {
      try {
        const response = await suggestionAPI.getAll({ sort: 'top', limit: 3, page: 1 });
        if (response.success) {
          setSuggestions(response.data?.suggestions || response.data || []);
        }
      } catch (err) {
        setSuggestionsError(err.message);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    const fetchPolls = async () => {
      try {
        const response = await pollAPI.getAll({ limit: 3 });
        if (response.success && Array.isArray(response.data)) {
          setPolls(response.data);
        }
      } catch (err) {
        setPollsError(err.message);
      } finally {
        setPollsLoading(false);
      }
    };

    const fetchLatestNews = async () => {
      try {
        const response = await articleAPI.getAll({
          status: 'published',
          type: 'news',
          newsApproved: true,
          orderBy: 'newsApprovedAt',
          order: 'desc',
          limit: 3,
          page: 1,
        });
        if (response.success) {
          setLatestNews(response.data.articles || []);
        }
      } catch (err) {
        setNewsError(err.message);
      } finally {
        setNewsLoading(false);
      }
    };

    const fetchVideos = async () => {
      try {
        const response = await articleAPI.getAll({
          type: 'video',
          status: 'published',
          limit: 6,
          orderBy: 'createdAt',
          order: 'desc',
        });
        if (response.success) {
          setVideos(response.data.articles || []);
        }
      } catch (err) {
        setVideosError(err.message);
      } finally {
        setVideosLoading(false);
      }
    };

    const fetchLocationDiscovery = async () => {
      try {
        const response = await locationAPI.getAll({ sort: 'mostUsers', limit: 6 });
        if (response.success) {
          setLocationDiscovery(response.locations || []);
        }
      } catch {
        // non-critical — fail silently
      } finally {
        setLocationDiscoveryLoading(false);
      }
    };

    const fetchTagsForType = async (entityType, setter) => {
      try {
        const response = await tagAPI.getSuggestions({ entityType });
        const tags = Array.isArray(response?.tags) ? response.tags : [];
        setter(
          tags
            .slice(0, 5)
            .map((tag) => tag?.name || tag)
            .filter(Boolean)
        );
      } catch {
        // non-critical — fail silently
      }
    };

    const fetchHomepageSettings = async () => {
      try {
        const res = await homepageSettingsAPI.get();
        if (res?.success) {
          setHomepageSettings(res.data);
        }
      } catch (err) {
        // Non-critical but log for debugging
        console.warn('[HomepageSettings] Failed to load:', err?.message || err);
      }
    };

    fetchLatestArticles();
    fetchSuggestions();
    fetchPolls();
    fetchLatestNews();
    fetchVideos();
    fetchLocationDiscovery();
    fetchTagsForType('article', setArticleTags);
    fetchTagsForType('suggestion', setSuggestionTags);
    fetchTagsForType('poll', setPollTags);
    fetchHomepageSettings();

    // Fetch manifest supporters for homepage
    const fetchManifestSupporters = async () => {
      try {
        const res = await manifestAPI.getAll();
        if (res?.success && res.data?.manifests?.length) {
          const manifests = res.data.manifests;
          const withSupporters = await Promise.all(
            manifests.map(async (m) => {
              try {
                const supportersRes = await manifestAPI.getRandomSupporters(m.slug, 8);
                return {
                  ...m,
                  randomSupporters: supportersRes?.success ? supportersRes.data?.users || [] : [],
                };
              } catch {
                return { ...m, randomSupporters: [] };
              }
            })
          );
          setManifestData(withSupporters);
        }
      } catch {
        // non-critical
      } finally {
        setManifestLoading(false);
      }
    };
    fetchManifestSupporters();
  }, []);

  return (
    <div className="bg-gray-50">
      <HomeHero />
      {homepageSettings?.infoSection?.enabled && isVisibleForAudience(homepageSettings?.infoSection?.audience) && (
        <HomepageInfoSection settings={homepageSettings.infoSection} />
      )}

        <HomepageSection
        title={tHome('latest_articles_title')}
        subtitle={tHome('latest_articles_subtitle')}
        linkHref="/articles"
        loading={articlesLoading}
        error={articlesError}
        items={latestArticles}
        emptyTitle={tHome('empty_articles_title')}
        emptyDescription={tHome('empty_articles_description')}
        skeletonCount={3}
        bgColor="bg-white"
        renderItem={(article) => <ArticleCard key={article.id} article={article} variant="grid" />}
        topTags={articleTags}
      />

      <HomepageSection
        title={tHome('top_suggestions_title')}
        subtitle={tHome('top_suggestions_subtitle')}
        linkHref="/suggestions"
        loading={suggestionsLoading}
        error={suggestionsError}
        items={suggestions}
        emptyTitle={tHome('empty_suggestions_title')}
        emptyDescription={tHome('empty_suggestions_description')}
        skeletonCount={3}
        bgColor="bg-gray-50"
        renderItem={(suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} />}
        topTags={suggestionTags}
      />

      <HomepageSection
        title={tHome('top_polls_title')}
        subtitle={tHome('top_polls_subtitle')}
        linkHref="/polls"
        loading={pollsLoading}
        error={pollsError}
        items={polls}
        emptyTitle={tHome('empty_polls_title')}
        emptyDescription={tHome('empty_polls_description')}
        skeletonCount={3}
        bgColor="bg-white"
        renderItem={(poll) => <PollCard key={poll.id} poll={poll} variant="grid" />}
        topTags={pollTags}
      />

      {/* Featured Locations Section */}
      {(locationDiscoveryLoading || locationDiscovery.length > 0) && (
        <HomepageSection
          title={tHome('explore_locations_title')}
          subtitle={tHome('explore_locations_subtitle')}
          linkHref="/locations"
          loading={locationDiscoveryLoading}
          error={null}
          items={locationDiscovery}
          emptyTitle=""
          emptyDescription=""
          skeletonCount={6}
          bgColor="bg-gray-50"
          renderItem={(loc) => <LocationCard key={loc.id} location={loc} />}
        />
      )}

      {/* CTA / Engagement Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="app-container py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">{tHome('cta_title')}</h2>
          <p className="text-blue-100 mb-6">
            {tHome('cta_description')}
          </p>
          {user ? (
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/articles/new"
                className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {tHome('cta_write_article')}
              </Link>
              <Link
                href="/suggestions/new"
                className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg border border-blue-300 hover:bg-blue-400 transition-colors"
              >
                {tHome('cta_submit_suggestion')}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-blue-100 text-sm">
                {tHome('cta_guest_description')}
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link
                  href="/locations"
                  className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg border border-blue-300 hover:bg-blue-400 transition-colors"
                >
                  {tHome('cta_view_locations')}
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {tCommon('register')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Manifest Supporters Section */}
      {(homepageSettings?.manifestSection?.enabled ?? true) &&
        isVisibleForAudience(homepageSettings?.manifestSection?.audience || 'all') &&
        !manifestLoading && manifestData.length > 0 && (
        <section className="bg-gradient-to-b from-gray-50 to-white">
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
        )}

      <HomepageSection
         title={tHome('latest_news_title')}
         subtitle={tHome('latest_news_subtitle')}
        linkHref="/news"
        loading={newsLoading}
        error={newsError}
        items={latestNews}
         emptyTitle={tHome('empty_news_title')}
         emptyDescription={tHome('empty_news_description')}
        skeletonCount={3}
        bgColor="bg-gray-50"
        renderItem={(article) => <ArticleCard key={article.id} article={article} variant="grid" />}
        topTags={articleTags}
        tagLinkPrefix="/news"
      />

      <HomepageSection
         title={tHome('latest_videos_title')}
         subtitle={tHome('latest_videos_subtitle')}
        linkHref="/videos"
        loading={videosLoading}
        error={videosError}
        items={videos}
         emptyTitle={tHome('empty_videos_title')}
         emptyDescription={tHome('empty_videos_description')}
        skeletonCount={3}
        bgColor="bg-white"
        renderItem={(video) => <VideoThumbnailCard key={video.id} article={video} />}
        topTags={articleTags}
        tagLinkPrefix="/videos"
      />
    </div>
  );
}
