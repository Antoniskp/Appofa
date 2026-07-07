'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, NewspaperIcon, ChatBubbleLeftRightIcon, ChartBarIcon, LinkIcon } from '@heroicons/react/24/outline';
import { articleAPI, pollAPI, suggestionAPI, topicAPI } from '@/lib/api';
import ArticleCard from '@/components/articles/ArticleCard';
import PollCard from '@/components/polls/PollCard';
import SuggestionCard from '@/components/SuggestionCard';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import TopicFollowButton from '@/components/topics/TopicFollowButton';

function Section({ title, icon: Icon, href, children, count }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-5 w-5 text-gray-500 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900 truncate">{title}</h2>
          {typeof count === 'number' && (
            <span className="text-sm text-gray-500">({count})</span>
          )}
        </div>
        {href && (
          <Link href={href} className="text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0">
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ExternalLinkCard({ link }) {
  const providerLabel = link.provider === 'x' ? 'X' : link.provider === 'twitter' ? 'Twitter' : link.provider;
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition flex flex-col"
    >
      {link.thumbnailUrl ? (
        <img
          src={link.thumbnailUrl}
          alt={link.title || 'Topic link'}
          className="h-36 w-full object-cover bg-gray-100"
          loading="lazy"
        />
      ) : (
        <div className="h-28 bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
          {providerLabel || 'Link'}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs font-semibold uppercase text-purple-700 mb-2">{providerLabel || 'website'}</div>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {link.title || link.url}
        </h3>
        {link.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-3">{link.description}</p>
        )}
      </div>
    </a>
  );
}

export default function TopicDetailPage() {
  const params = useParams();
  const slug = params?.slug ? decodeURIComponent(params.slug) : '';
  const [topic, setTopic] = useState(null);
  const [articles, setArticles] = useState([]);
  const [polls, setPolls] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    topicAPI.getBySlug(slug)
      .then(async (topicRes) => {
        if (!topicRes?.success || !topicRes.topic) {
          throw new Error(topicRes?.message || 'Topic not found.');
        }
        const topicData = topicRes.topic;
        const tag = topicData.tagName || topicData.name;
        const [articleRes, newsRes, pollRes, suggestionRes] = await Promise.all([
          articleAPI.getAll({ tag, status: 'published', type: 'articles', limit: 6 }),
          articleAPI.getAll({ tag, status: 'published', type: 'news', limit: 6 }),
          pollAPI.getAll({ tag, limit: 6 }),
          suggestionAPI.getAll({ tag, limit: 6 }),
        ]);
        if (cancelled) return;

        const articleItems = articleRes?.data?.articles || [];
        const newsItems = newsRes?.data?.articles || [];
        setTopic(topicData);
        setArticles([...newsItems, ...articleItems].slice(0, 6));
        setPolls(pollRes?.data || []);
        setSuggestions(suggestionRes?.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load topic.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const topicTagQuery = useMemo(() => {
    if (!topic?.name) return '';
    return encodeURIComponent(topic.name);
  }, [topic?.name]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container">
          <div className="mb-8">
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-10 w-72 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-5 w-full max-w-2xl bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container">
          <Link href="/topics" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeftIcon className="h-4 w-4" />
            Topics
          </Link>
          <EmptyState type="error" title="Topic could not load" description={error || 'Topic not found.'} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <Link href="/topics" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeftIcon className="h-4 w-4" />
          Topics
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-purple-700 font-medium">
            <span className="rounded-full bg-purple-50 px-3 py-1">Topic</span>
            <span>{topic.count} linked items</span>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{topic.name}</h1>
              <p className="text-gray-600 max-w-3xl">
                {topic.description || 'Articles, news, polls, and suggestions connected through this topic.'}
              </p>
            </div>
            <TopicFollowButton topic={topic} onChange={setTopic} className="shrink-0" />
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-gray-900">{topic.counts?.article || 0}</div>
              <div className="text-sm text-gray-500">Articles and news</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-gray-900">{topic.counts?.poll || 0}</div>
              <div className="text-sm text-gray-500">Polls</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-gray-900">{topic.counts?.suggestion || 0}</div>
              <div className="text-sm text-gray-500">Suggestions</div>
            </div>
          </div>
        </header>

        {topic.externalLinks?.length > 0 && (
          <Section title="External links" icon={LinkIcon} count={topic.externalLinks.length}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topic.externalLinks.map((link) => (
                <ExternalLinkCard key={link.id || link.url} link={link} />
              ))}
            </div>
          </Section>
        )}

        <Section
          title="Articles and news"
          icon={NewspaperIcon}
          href={`/articles?tag=${topicTagQuery}`}
          count={topic.counts?.article || 0}
        >
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="grid" />
              ))}
            </div>
          ) : (
            <EmptyState type="empty" title="No articles yet" description="Articles tagged with this topic will appear here." />
          )}
        </Section>

        <Section
          title="Polls"
          icon={ChartBarIcon}
          href={`/polls?tag=${topicTagQuery}`}
          count={topic.counts?.poll || 0}
        >
          {polls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} variant="grid" />
              ))}
            </div>
          ) : (
            <EmptyState type="empty" title="No polls yet" description="Polls tagged with this topic will appear here." />
          )}
        </Section>

        <Section
          title="Suggestions"
          icon={ChatBubbleLeftRightIcon}
          href={`/suggestions?tag=${topicTagQuery}`}
          count={topic.counts?.suggestion || 0}
        >
          {suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          ) : (
            <EmptyState type="empty" title="No suggestions yet" description="Suggestions tagged with this topic will appear here." />
          )}
        </Section>
      </div>
    </div>
  );
}
