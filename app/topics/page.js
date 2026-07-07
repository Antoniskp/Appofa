'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, TagIcon } from '@heroicons/react/24/outline';
import { topicAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import SearchInput from '@/components/ui/SearchInput';

function TopicCard({ topic }) {
  return (
    <Link
      href={`/topics/${encodeURIComponent(topic.slug)}`}
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-purple-200 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{topic.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{topic.count} linked items</p>
        </div>
        <span className="shrink-0 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          Topic
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
        <span>{topic.counts?.article || 0} articles</span>
        <span>{topic.counts?.poll || 0} polls</span>
        <span>{topic.counts?.suggestion || 0} suggestions</span>
        {topic.externalLinks?.length > 0 && <span>{topic.externalLinks.length} links</span>}
        {topic.followersCount > 0 && <span>{topic.followersCount} followers</span>}
      </div>
    </Link>
  );
}

export default function TopicsPage() {
  const { user, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState([]);
  const [followedTopics, setFollowedTopics] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    topicAPI.getAll({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setTopics(Array.isArray(res?.topics) ? res.topics : []);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load topics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setFollowedTopics([]);
      return;
    }

    let cancelled = false;
    setFollowingLoading(true);
    topicAPI.getFollowing()
      .then((res) => {
        if (!cancelled) setFollowedTopics(Array.isArray(res?.topics) ? res.topics : []);
      })
      .catch(() => {
        if (!cancelled) setFollowedTopics([]);
      })
      .finally(() => {
        if (!cancelled) setFollowingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const filteredTopics = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return topics;
    return topics.filter((topic) => topic.name.toLowerCase().includes(term));
  }, [query, topics]);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-purple-700 mb-2">
            <TagIcon className="h-5 w-5" />
            Topics
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Explore by topic</h1>
          <p className="text-gray-600 max-w-3xl">
            Browse the civic conversations that connect articles, news, polls, and suggestions across Appofa.
          </p>
        </div>

        <div className="mb-6 max-w-xl">
          <SearchInput
            name="topic-search"
            placeholder="Search topics..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full"
          />
        </div>

        {!authLoading && user && (followingLoading || followedTopics.length > 0) && (
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <CheckCircleIcon className="h-5 w-5 text-purple-600" />
              Following
            </div>
            {followingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SkeletonLoader type="card" count={3} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followedTopics.map((topic) => (
                  <TopicCard key={topic.slug} topic={topic} />
                ))}
              </div>
            )}
          </section>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {!loading && error && (
          <EmptyState type="error" title="Topics could not load" description={error} />
        )}

        {!loading && !error && filteredTopics.length === 0 && (
          <EmptyState
            type="empty"
            title="No topics found"
            description="Try a different search term or add tags to articles, polls, and suggestions."
          />
        )}

        {!loading && !error && filteredTopics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => (
              <TopicCard key={topic.slug} topic={topic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
