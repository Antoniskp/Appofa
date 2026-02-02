'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { articleAPI } from '@/lib/api';
import ArticleCard from '@/components/ArticleCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 10,
          status: 'published',
          type: 'news',
        };

        const response = await articleAPI.getAll(params);
        if (response.success) {
          setArticles(response.data.articles || []);
          setTotalPages(response.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [page]);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">News</h1>
            <p className="text-gray-600">Approved news stories from our community.</p>
          </div>
          <Link href="/articles" className="text-blue-600 hover:text-blue-800 font-medium">
            Browse Articles →
          </Link>
        </div>

        {loading && (
          <div className="space-y-6">
            <SkeletonLoader count={5} variant="list" />
          </div>
        )}

        {error && (
          <EmptyState
            type="error"
            title="Error Loading News"
            description={error}
            action={{
              text: 'Try Again',
              onClick: () => window.location.reload()
            }}
          />
        )}

        {!loading && !error && articles.length === 0 && (
          <EmptyState
            type="empty"
            title="No News Available"
            description="There are no approved news stories yet. Check back soon!"
          />
        )}

        <div className="space-y-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="list" />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
