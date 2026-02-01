'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { articleAPI } from '@/lib/api';
import ArticleCard from '@/components/ArticleCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'published',
    articleType: 'articles',
    category: '',
  });

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 10,
          ...filters,
        };
        
        // Remove empty filters
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });

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

    fetchArticles();
  }, [page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page on filter change
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <h1 className="text-4xl font-bold mb-8">Όλα τα Άρθρα</h1>

        {/* Filters */}
        <div className="card p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Κατηγορία
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder="Φίλτρο ανά κατηγορία..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Κατάσταση
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Όλα</option>
                <option value="published">Δημοσιευμένο</option>
                <option value="draft">Πρόχειρο</option>
                <option value="archived">Αρχειοθετημένο</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <SkeletonLoader count={5} variant="list" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <EmptyState
            type="error"
            title="Σφάλμα φόρτωσης άρθρων"
            description={error}
            action={{
              text: 'Δοκιμή ξανά',
              icon: ArrowPathIcon,
              onClick: () => window.location.reload()
            }}
          />
        )}

        {/* Articles List */}
        {!loading && !error && articles.length === 0 && (
          <EmptyState
            type="empty"
            title="Δεν βρέθηκαν άρθρα"
            description="Κανένα άρθρο δεν ταιριάζει με τα φίλτρα σας. Δοκιμάστε να αλλάξετε τα κριτήρια αναζήτησης."
          />
        )}

        <div className="space-y-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="list" />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Προηγούμενο
            </button>
            <span className="text-gray-700">
              Σελίδα {page} από {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Επόμενο
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
