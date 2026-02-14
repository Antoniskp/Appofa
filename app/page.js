'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { articleAPI, pollAPI } from '@/lib/api';
import HomeHero from '@/components/HomeHero';
import ArticleCard from '@/components/ArticleCard';
import PollCard from '@/components/PollCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

export default function HomePage() {
  const [latestNews, setLatestNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);
  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [pollsError, setPollsError] = useState(null);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const response = await articleAPI.getAll({ 
          status: 'published', 
          type: 'news',
          newsApproved: true,
          orderBy: 'newsApprovedAt',
          order: 'desc',
          limit: 9,
          page: 1 
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

    fetchLatestNews();
    fetchPolls();
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <HomeHero />

      {/* Latest News Section */}
      <section className="app-container py-16">
        <h2 className="section-title">Τελευταίες ειδήσεις</h2>
        {newsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={9} variant="grid" />
          </div>
        )}
        {newsError && (
          <EmptyState
            type="error"
            title="Error Loading News"
            description={newsError}
            action={{
              text: 'Try Again',
              onClick: () => window.location.reload()
            }}
          />
        )}
        {!newsLoading && !newsError && latestNews.length === 0 && (
          <EmptyState
            type="empty"
            title="No News Found"
            description="Δεν υπάρχουν εγκεκριμένες ειδήσεις αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestNews.map((article) => (
            <ArticleCard key={article.id} article={article} variant="grid" />
          ))}
        </div>
        {latestNews.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/articles" className="btn-primary">
              Όλες οι ειδήσεις
            </Link>
          </div>
        )}
      </section>

      {/* Biggest Polls Section */}
      <section className="app-container py-16">
        <h2 className="section-title">Μεγαλύτερες ψηφοφορίες</h2>
        {pollsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={3} variant="grid" />
          </div>
        )}
        {pollsError && (
          <EmptyState
            type="error"
            title="Error Loading Polls"
            description={pollsError}
            action={{
              text: 'Try Again',
              onClick: () => window.location.reload()
            }}
          />
        )}
        {!pollsLoading && !pollsError && polls.length === 0 && (
          <EmptyState
            type="empty"
            title="No Polls Found"
            description="Δεν υπάρχουν ψηφοφορίες αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!"
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls
            .sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0))
            .slice(0, 3)
            .map((poll) => (
              <PollCard key={poll.id} poll={poll} variant="grid" />
            ))}
        </div>
        {polls.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/polls" className="btn-primary">
              Όλες οι ψηφοφορίες
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
