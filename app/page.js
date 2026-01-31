'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { articleAPI } from '@/lib/api';
import HomeHero from '@/components/HomeHero';
import ArticleCard from '@/components/ArticleCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

export default function HomePage() {
  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const response = await articleAPI.getAll({ 
          status: 'published', 
          limit: 6,
          page: 1 
        });
        if (response.success) {
          setLatestArticles(response.data.articles || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticles();
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <HomeHero />

      {/* Latest News Section */}
      <section className="app-container py-16">
        <h2 className="section-title">Latest News</h2>
        
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader count={6} variant="grid" />
          </div>
        )}

        {error && (
          <EmptyState
            type="error"
            title="Error Loading Articles"
            description={error}
            action={{
              text: 'Try Again',
              onClick: () => window.location.reload()
            }}
          />
        )}

        {!loading && !error && latestArticles.length === 0 && (
          <EmptyState
            type="empty"
            title="No Articles Found"
            description="There are no published articles at the moment. Check back soon!"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestArticles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="grid" />
          ))}
        </div>

        {latestArticles.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/articles" className="btn-primary">
              View All Articles
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
