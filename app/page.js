'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { articleAPI, pollAPI, suggestionAPI } from '@/lib/api';
import HomeHero from '@/components/HomeHero';
import ArticleCard from '@/components/ArticleCard';
import PollCard from '@/components/PollCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import VideoThumbnailCard from '@/components/articles/VideoThumbnailCard';
import SuggestionCard from '@/components/SuggestionCard';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState(null);

  const [latestNews, setLatestNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  const [latestArticles, setLatestArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState(null);

  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [pollsError, setPollsError] = useState(null);

  useEffect(() => {
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

    const fetchLatestArticles = async () => {
      try {
        const response = await articleAPI.getAll({
          status: 'published',
          type: 'article',
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
        const response = await pollAPI.getAll({});
        if (response.success && Array.isArray(response.data)) {
          setPolls(response.data);
        }
      } catch (err) {
        setPollsError(err.message);
      } finally {
        setPollsLoading(false);
      }
    };

    fetchVideos();
    fetchLatestNews();
    fetchLatestArticles();
    fetchSuggestions();
    fetchPolls();
  }, []);

  return (
    <div className="bg-gray-50">
      <HomeHero />

      {/* Latest Videos Section */}
      <section className="bg-white">
        <div className="app-container py-16">
          <h2 className="section-title">Τελευταία Βίντεο</h2>
          {videosLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <SkeletonLoader type="card" count={6} variant="grid" />
            </div>
          )}
          {videosError && (
            <EmptyState
              type="error"
              title="Σφάλμα φόρτωσης βίντεο"
              description={videosError}
              action={{ text: 'Δοκιμάστε ξανά', onClick: () => window.location.reload() }}
            />
          )}
          {!videosLoading && !videosError && videos.length === 0 && (
            <EmptyState
              type="empty"
              title="Δεν βρέθηκαν βίντεο"
              description="Δεν υπάρχουν βίντεο αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
            />
          )}
          {videos.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <VideoThumbnailCard key={video.id} article={video} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/videos" className="btn-primary">
                  Όλα τα βίντεο
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Latest News Section */}
      <section className="bg-gray-50">
        <div className="app-container py-16">
          <h2 className="section-title">Τελευταίες Ειδήσεις</h2>
          {newsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonLoader type="card" count={3} variant="grid" />
            </div>
          )}
          {newsError && (
            <EmptyState
              type="error"
              title="Σφάλμα φόρτωσης ειδήσεων"
              description={newsError}
              action={{ text: 'Δοκιμάστε ξανά', onClick: () => window.location.reload() }}
            />
          )}
          {!newsLoading && !newsError && latestNews.length === 0 && (
            <EmptyState
              type="empty"
              title="Δεν βρέθηκαν ειδήσεις"
              description="Δεν υπάρχουν εγκεκριμένες ειδήσεις αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
            />
          )}
          {latestNews.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestNews.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="grid" />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/news" className="btn-primary">
                  Όλες οι ειδήσεις
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Latest Articles Section */}
      <section className="bg-white">
        <div className="app-container py-16">
          <h2 className="section-title">Τελευταία Άρθρα</h2>
          {articlesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonLoader type="card" count={3} variant="grid" />
            </div>
          )}
          {articlesError && (
            <EmptyState
              type="error"
              title="Σφάλμα φόρτωσης άρθρων"
              description={articlesError}
              action={{ text: 'Δοκιμάστε ξανά', onClick: () => window.location.reload() }}
            />
          )}
          {!articlesLoading && !articlesError && latestArticles.length === 0 && (
            <EmptyState
              type="empty"
              title="Δεν βρέθηκαν άρθρα"
              description="Δεν υπάρχουν άρθρα αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
            />
          )}
          {latestArticles.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="grid" />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/articles" className="btn-primary">
                  Όλα τα άρθρα
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Top Suggestions Section */}
      <section className="bg-gray-50">
        <div className="app-container py-16">
          <h2 className="section-title">Κορυφαίες Προτάσεις</h2>
          {suggestionsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonLoader type="card" count={3} variant="grid" />
            </div>
          )}
          {suggestionsError && (
            <EmptyState
              type="error"
              title="Σφάλμα φόρτωσης προτάσεων"
              description={suggestionsError}
              action={{ text: 'Δοκιμάστε ξανά', onClick: () => window.location.reload() }}
            />
          )}
          {!suggestionsLoading && !suggestionsError && suggestions.length === 0 && (
            <EmptyState
              type="empty"
              title="Δεν βρέθηκαν προτάσεις"
              description="Δεν υπάρχουν προτάσεις αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
            />
          )}
          {suggestions.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggestions.map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/suggestions" className="btn-primary">
                  Όλες οι προτάσεις
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Biggest Polls Section */}
      <section className="bg-white">
        <div className="app-container py-16">
          <h2 className="section-title">Μεγαλύτερες Ψηφοφορίες</h2>
          {pollsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonLoader type="card" count={3} variant="grid" />
            </div>
          )}
          {pollsError && (
            <EmptyState
              type="error"
              title="Σφάλμα φόρτωσης ψηφοφοριών"
              description={pollsError}
              action={{ text: 'Δοκιμάστε ξανά', onClick: () => window.location.reload() }}
            />
          )}
          {!pollsLoading && !pollsError && polls.length === 0 && (
            <EmptyState
              type="empty"
              title="Δεν βρέθηκαν ψηφοφορίες"
              description="Δεν υπάρχουν ψηφοφορίες αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
            />
          )}
          {polls.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {polls
                  .sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0))
                  .slice(0, 3)
                  .map((poll) => (
                    <PollCard key={poll.id} poll={poll} variant="grid" />
                  ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/polls" className="btn-primary">
                  Όλες οι ψηφοφορίες
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
