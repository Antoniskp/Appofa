'use client';

import { useEffect, useState } from 'react';
import { articleAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import ArticleCard from '@/components/ArticleCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tagFilter, setTagFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const newsCategoryOptions = articleCategories.articleTypes?.news?.categories ?? [];

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

        if (tagFilter) {
          params.tag = tagFilter;
        }
        if (categoryFilter) {
          params.category = categoryFilter;
        }

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
  }, [page, tagFilter, categoryFilter]);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="card p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All categories</option>
                {newsCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-2">
                Tag
              </label>
              <input
                type="text"
                id="tag"
                name="tag"
                value={tagFilter}
                onChange={(event) => {
                  setTagFilter(event.target.value);
                  setPage(1);
                }}
                placeholder="Filter by tag..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
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
