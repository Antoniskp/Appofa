'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { articleAPI, pollAPI, suggestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import HomeHero from '@/components/HomeHero';
import ArticleCard from '@/components/articles/ArticleCard';
import PollCard from '@/components/polls/PollCard';
import SuggestionCard from '@/components/SuggestionCard';
import HomepageSection from '@/components/HomepageSection';

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

    fetchLatestArticles();
    fetchSuggestions();
    fetchPolls();
    fetchLatestNews();
    fetchVideos();
  }, []);

  return (
    <div className="bg-gray-50">
      <HomeHero />

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
            <Link
              href="/register"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Εγγραφή
            </Link>
          )}
        </div>
      </section>

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
