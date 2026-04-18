'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { articleAPI, pollAPI, suggestionAPI, manifestAPI, locationAPI, tagAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import HomeHero from '@/components/HomeHero';
import ArticleCard from '@/components/articles/ArticleCard';
import PollCard from '@/components/polls/PollCard';
import SuggestionCard from '@/components/SuggestionCard';
import HomepageSection from '@/components/HomepageSection';
import LocationCard from '@/components/locations/LocationCard';

const VideoThumbnailCard = dynamic(() => import('@/components/articles/VideoThumbnailCard'));

export default function HomePage() {
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
  const [topTags, setTopTags] = useState([]);
  const [topTagsLoading, setTopTagsLoading] = useState(true);

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

    const fetchTopTags = async () => {
      try {
        const response = await tagAPI.getSuggestions();
        const tags = Array.isArray(response?.tags) ? response.tags : [];
        setTopTags(
          tags
            .slice(0, 5)
            .map((tag) => tag?.name || tag)
            .filter(Boolean)
        );
      } catch {
        // non-critical — fail silently
      } finally {
        setTopTagsLoading(false);
      }
    };

    fetchLatestArticles();
    fetchSuggestions();
    fetchPolls();
    fetchLatestNews();
    fetchVideos();
    fetchLocationDiscovery();
    fetchTopTags();

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

      {!topTagsLoading && topTags.length > 0 && (
        <section className="bg-white">
          <div className="app-container py-10">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">🏷️ Δημοφιλείς Ετικέτες</h2>
              <Link href="/articles" className="btn-primary text-sm">
                Δείτε όλα
              </Link>
            </div>
            <p className="text-sm text-gray-500 mb-4">Τα πιο χρησιμοποιούμενα tags</p>
            <div className="flex flex-wrap gap-2">
              {topTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/articles?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <HomepageSection
        title="Τελευταία Άρθρα"
        subtitle="Αναλύσεις και απόψεις από την κοινότητα"
        linkHref="/articles"
        loading={articlesLoading}
        error={articlesError}
        items={latestArticles}
        emptyTitle="Δεν βρέθηκαν άρθρα"
        emptyDescription="Δεν υπάρχουν άρθρα αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
        skeletonCount={3}
        bgColor="bg-white"
        renderItem={(article) => <ArticleCard key={article.id} article={article} variant="grid" />}
      />

      <HomepageSection
        title="Κορυφαίες Προτάσεις"
        subtitle="Οι πιο δημοφιλείς προτάσεις πολιτών"
        linkHref="/suggestions"
        loading={suggestionsLoading}
        error={suggestionsError}
        items={suggestions}
        emptyTitle="Δεν βρέθηκαν προτάσεις"
        emptyDescription="Δεν υπάρχουν προτάσεις αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
        skeletonCount={3}
        bgColor="bg-gray-50"
        renderItem={(suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} />}
      />

      <HomepageSection
        title="Μεγαλύτερες Ψηφοφορίες"
        subtitle="Ψηφίστε στα πιο δημοφιλή θέματα"
        linkHref="/polls"
        loading={pollsLoading}
        error={pollsError}
        items={polls}
        emptyTitle="Δεν βρέθηκαν ψηφοφορίες"
        emptyDescription="Δεν υπάρχουν ψηφοφορίες αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
        skeletonCount={3}
        bgColor="bg-white"
        renderItem={(poll) => <PollCard key={poll.id} poll={poll} variant="grid" />}
      />

      {/* Featured Locations Section */}
      {(locationDiscoveryLoading || locationDiscovery.length > 0) && (
        <HomepageSection
          title="🗺️ Εξερεύνησε Περιοχές"
          subtitle="Ανακάλυψε άρθρα, ψηφοφορίες και πολίτες ανά περιοχή"
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
          <h2 className="text-3xl font-bold text-white mb-2">Έχεις κάτι να πεις;</h2>
          <p className="text-blue-100 mb-6">
            Γράψε ένα άρθρο, κατέθεσε πρόταση ή ψήφισε σε ανοιχτές ψηφοφορίες!
          </p>
          {user ? (
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/articles/new"
                className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Γράψε Άρθρο
              </Link>
              <Link
                href="/suggestions/new"
                className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg border border-blue-300 hover:bg-blue-400 transition-colors"
              >
                Κατέθεσε Πρόταση
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-blue-100 text-sm">
                Εγγράψου για να παρακολουθείς την περιοχή σου και να συμμετέχεις στα τοπικά νέα!
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link
                  href="/locations"
                  className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg border border-blue-300 hover:bg-blue-400 transition-colors"
                >
                  🗺️ Δες Περιοχές
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Εγγραφή
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Manifest Supporters Section */}
      {!manifestLoading && manifestData.length > 0 && (
        <section className="bg-gradient-to-b from-gray-50 to-white">
          <div className="app-container py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              📜 Υποστηρικτές Μανιφέστου
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              Μέλη που αποδέχτηκαν τα μανιφέστα μας
            </p>
            <div className="space-y-10">
              {manifestData.map((manifest) => (
                <div key={manifest.slug}>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{manifest.title}</h3>
                      <p className="text-xs text-gray-400">
                        {manifest.supportersCount || 0} συνολικά υποστηρικτές
                      </p>
                    </div>
                    <Link
                      href={`/manifest-supporters?manifest=${encodeURIComponent(manifest.slug)}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Δείτε όλους →
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
                    <p className="text-sm text-gray-400">Δεν υπάρχουν ακόμα υποστηρικτές.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <HomepageSection
        title="Τελευταίες Ειδήσεις"
        subtitle="Τα τελευταία νέα από εγκεκριμένες πηγές"
        linkHref="/news"
        loading={newsLoading}
        error={newsError}
        items={latestNews}
        emptyTitle="Δεν βρέθηκαν ειδήσεις"
        emptyDescription="Δεν υπάρχουν εγκεκριμένες ειδήσεις αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
        skeletonCount={3}
        bgColor="bg-gray-50"
        renderItem={(article) => <ArticleCard key={article.id} article={article} variant="grid" />}
      />

      <HomepageSection
        title="Τελευταία Βίντεο"
        subtitle="Βίντεο αναλύσεις και συζητήσεις"
        linkHref="/videos"
        loading={videosLoading}
        error={videosError}
        items={videos}
        emptyTitle="Δεν βρέθηκαν βίντεο"
        emptyDescription="Δεν υπάρχουν βίντεο αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
        skeletonCount={3}
        bgColor="bg-white"
        renderItem={(video) => <VideoThumbnailCard key={video.id} article={video} />}
      />
    </div>
  );
}
