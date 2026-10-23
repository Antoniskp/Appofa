'use client';

import dynamic from 'next/dynamic';
import ManifestSupporters from '@/components/home/ManifestSupporters';
import ProgressFeed from '@/components/ProgressFeed';
import PollTopics from '@/components/home/PollTopics';
import { useTranslations } from 'next-intl';
import { useHomepageData } from '@/hooks/useHomepageData';
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

export default function HomePageClient({ initialPayload = null }) {
  const tHome = useTranslations('home');
  const { user } = useAuth();

  const { data, loading, error, retry } = useHomepageData(user, initialPayload);
  const { latestArticles = [], latestNews = [], videos = [], polls = [], suggestions = [],
    prefectures = [], manifestData = [], homepageSettings = null, featuredPoll = null } = data;
  const articleTags = data.tags?.article || [];
  const suggestionTags = data.tags?.suggestion || [];
  const pollTags = data.tags?.poll || [];
  const articlesLoading = loading('latestArticles');
  const newsLoading = loading('latestNews');
  const pollsLoading = loading('polls');
  const suggestionsLoading = loading('suggestions');
  const videosLoading = loading('videos');
  const prefecturesLoading = loading('prefectures');
  const manifestLoading = loading('manifestData');
  const featuredPollLoading = loading('featuredPoll');
  const articlesError = error('latestArticles');
  const newsError = error('latestNews');
  const pollsError = error('polls');
  const suggestionsError = error('suggestions');
  const videosError = error('videos');
  const isVisibleForAudience = audience => audience === 'all' ||
    (audience === 'guest' && !user) || (audience === 'registered' && Boolean(user));

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
        onRetry={() => retry(['polls'])}
        items={polls}
        emptyTitle={tHome('empty_polls_title')}
        emptyDescription={tHome('empty_polls_description')}
        skeletonCount={3}
        bgColor="bg-white"
        renderItem={(poll) => <PollCard key={poll.id} poll={poll} variant="grid" />}
        introSlot={<PollTopics tags={pollTags} />}
      />

      <HomepageSection
        title={tHome('top_suggestions_title')}
        subtitle={tHome('top_suggestions_subtitle')}
        linkHref="/suggestions"
        loading={suggestionsLoading}
        error={suggestionsError}
        onRetry={() => retry(['suggestions'])}
        items={suggestions}
        emptyTitle={tHome('empty_suggestions_title')}
        emptyDescription={tHome('empty_suggestions_description')}
        skeletonCount={3}
        bgColor="bg-ivory"
        renderItem={(suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} />}
        topTags={suggestionTags}
      />

      {/* Featured Locations Section — map + prefecture pills, no location cards */}
      {(prefecturesLoading || error('prefectures') || prefectures.length > 0) && (
        <HomepageSection
          title={tHome('explore_locations_title')}
          subtitle={tHome('explore_locations_subtitle')}
          linkHref="/locations"
          loading={prefecturesLoading}
          error={error('prefectures')}
          onRetry={() => retry(['prefectures'])}
          items={[]}
          emptyTitle=""
          emptyDescription=""
          skeletonCount={3}
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

      <section className="app-container py-8" aria-label="Πρόοδος προτάσεων">
        <h2 className="mb-5 text-2xl font-bold">Τι έγινε μετά τη συμμετοχή;</h2>
        <ProgressFeed preview />
      </section>
      <GovernmentSnapshotSection />

      <HomepageSection
        title={tHome('latest_content_title')}
        subtitle={tHome('latest_content_subtitle')}
        linkHref="/news"
        loading={latestContentLoading}
        error={latestContentError}
        onRetry={() => retry(['latestArticles', 'latestNews'].filter(section => error(section)))}
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
        onRetry={() => retry(['videos'])}
        items={videos}
        emptyTitle={tHome('empty_videos_title')}
        emptyDescription={tHome('empty_videos_description')}
        skeletonCount={3}
        bgColor="bg-ivory"
        renderItem={(video) => <VideoThumbnailCard key={video.id} article={video} />}
        topTags={articleTags}
        tagLinkPrefix="/videos"
      />

      {(homepageSettings?.manifestSection?.enabled ?? true) &&
        !error('homepageSettings') &&
        isVisibleForAudience(homepageSettings?.manifestSection?.audience || 'all') &&
        !manifestLoading && manifestData.length > 0 && <ManifestSupporters manifestData={manifestData} />}

    </div>
  );
}
