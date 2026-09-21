'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { homepageAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import HomeHero from '@/components/HomeHero';
import HomeActionLanes from '@/components/HomeActionLanes';
import GovernmentSnapshotSection from '@/components/GovernmentSnapshotSection';
import ArticleCard from '@/components/articles/ArticleCard';
import PollCard from '@/components/polls/PollCard';
import SuggestionCard from '@/components/SuggestionCard';
import HomepageSection from '@/components/HomepageSection';
import OnboardingCard from '@/components/OnboardingCard';
import CountryEntryPopup from '@/components/geo/CountryEntryPopup';

  const VideoThumbnailCard = dynamic(() => import('@/components/articles/VideoThumbnailCard'));
  const ExploreLocationsMap = dynamic(() => import('@/components/locations/ExploreLocationsMap'), { ssr: false });

export default function HomePage() {
  const tHome = useTranslations('home');
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
  const [featuredPoll, setFeaturedPoll] = useState(null);
  const [featuredPollLoading, setFeaturedPollLoading] = useState(false);

  const [latestNews, setLatestNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState(null);

  const [manifestData, setManifestData] = useState([]);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [prefectures, setPrefectures] = useState([]);
  const [prefecturesLoading, setPrefecturesLoading] = useState(true);
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
    let active = true;
    const loadHomepage = async () => {
      try {
        const res = await homepageAPI.get();
        if (!active) return;
        if (!res?.success) throw new Error(res?.message || 'Failed to load homepage.');
        if (res?.success) {
          const payload = res.data || {};
          setLatestArticles(payload.latestArticles || []);
          setSuggestions(payload.suggestions || []);
          setPolls(payload.polls || []);
          setLatestNews(payload.latestNews || []);
          setVideos(payload.videos || []);
          setPrefectures(payload.prefectures || []);
          setArticleTags(payload.tags?.article || []);
          setSuggestionTags(payload.tags?.suggestion || []);
          setPollTags(payload.tags?.poll || []);
          setHomepageSettings(payload.homepageSettings || null);
          setFeaturedPoll(payload.featuredPoll || null);
          setManifestData(payload.manifestData || []);
        }
      } catch (err) {
        if (!active) return;
        const message = err?.message || 'Failed to load homepage.';
        setArticlesError(message);
        setSuggestionsError(message);
        setPollsError(message);
        setNewsError(message);
        setVideosError(message);
        setFeaturedPoll(null);
      } finally {
        if (active) {
        setArticlesLoading(false);
        setSuggestionsLoading(false);
        setPollsLoading(false);
        setNewsLoading(false);
        setVideosLoading(false);
        setPrefecturesLoading(false);
        setManifestLoading(false);
        setFeaturedPollLoading(false);
        }
      }
    };

    loadHomepage();
    return () => { active = false; };
  }, [user?.id]);

  const mergedLatestContent = [...latestNews, ...latestArticles]
    .sort((a, b) => {
      const dateA = new Date(a.newsApprovedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.newsApprovedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 6);

  const latestContentLoading = articlesLoading || newsLoading;
  const latestContentError = articlesError || newsError;
  const pollsSubtitle = !user
    ? `${tHome('top_polls_subtitle')} — ${tHome('top_polls_guest_note')}`
    : tHome('top_polls_subtitle');
  const featuredPollConfig = homepageSettings?.featuredPoll;
  const shouldShowFeaturedPoll =
    Boolean(featuredPollConfig?.enabled) &&
    isVisibleForAudience(featuredPollConfig?.audience || 'all') &&
    (featuredPollLoading || Boolean(featuredPoll));

  return (
    <div className="bg-ivory">
      <CountryEntryPopup isAuthenticated={Boolean(user)} />
      <HomeHero
        featuredPoll={shouldShowFeaturedPoll ? featuredPoll : null}
        featuredPollLoading={shouldShowFeaturedPoll && featuredPollLoading}
      />
      <HomeActionLanes user={user} />

      {user && (
        <div className="app-container pt-4 pb-0">
          <OnboardingCard user={user} />
        </div>
      )}

      <HomepageSection
        title={tHome('top_polls_title')}
        subtitle={pollsSubtitle}
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
        bgColor="bg-ivory"
        renderItem={(suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} />}
        topTags={suggestionTags}
      />

      {/* Featured Locations Section — map + prefecture pills, no location cards */}
      {(prefecturesLoading || prefectures.length > 0) && (
        <HomepageSection
          title={tHome('explore_locations_title')}
          subtitle={tHome('explore_locations_subtitle')}
          linkHref="/locations"
          loading={false}
          error={null}
          items={[]}
          emptyTitle=""
          emptyDescription=""
          skeletonCount={0}
          bgColor="bg-white"
          renderItem={() => null}
          mapSlot={
            <div className="-mt-2 md:-mt-3">
              <ExploreLocationsMap
                prefectures={prefectures}
                loading={prefecturesLoading}
              />
            </div>
          }
        />
      )}

      <GovernmentSnapshotSection />

      <HomepageSection
        title={tHome('latest_content_title')}
        subtitle={tHome('latest_content_subtitle')}
        linkHref="/news"
        loading={latestContentLoading}
        error={latestContentError}
        items={mergedLatestContent}
        emptyTitle={tHome('empty_news_title')}
        emptyDescription={tHome('empty_news_description')}
        skeletonCount={6}
        bgColor="bg-white"
        renderItem={(article) => (
          <div key={article.id} className="relative">
            <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-gray-700 shadow-sm border border-gray-200">
              {article.type === 'news' ? tHome('content_badge_news') : tHome('content_badge_article')}
            </span>
            <ArticleCard
              article={article}
              variant="grid"
              tagLinkPrefix={article.type === 'news' ? '/news' : '/articles'}
            />
          </div>
        )}
        topTags={articleTags}
        tagLinkPrefix="/articles"
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
        bgColor="bg-ivory"
        renderItem={(video) => <VideoThumbnailCard key={video.id} article={video} />}
        topTags={articleTags}
        tagLinkPrefix="/videos"
      />

      {/* Manifest Supporters Section */}
      {(homepageSettings?.manifestSection?.enabled ?? true) &&
        isVisibleForAudience(homepageSettings?.manifestSection?.audience || 'all') &&
        !manifestLoading && manifestData.length > 0 && (
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
        )}
    </div>
  );
}
