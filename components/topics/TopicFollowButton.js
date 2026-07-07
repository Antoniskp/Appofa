'use client';

import { useState } from 'react';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { topicAPI } from '@/lib/api';
import LoginLink from '@/components/ui/LoginLink';

export default function TopicFollowButton({ topic, onChange, className = '' }) {
  const { user, loading: authLoading } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  if (!topic?.slug) return null;

  const followersCount = topic.followersCount || 0;
  const isFollowing = Boolean(topic.isFollowing);

  const handleToggle = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setError('');
    try {
      const response = isFollowing
        ? await topicAPI.unfollow(topic.slug)
        : await topicAPI.follow(topic.slug);
      if (response?.topic && typeof onChange === 'function') {
        onChange(response.topic);
      }
    } catch (err) {
      setError(err?.message || 'Could not update topic follow.');
    } finally {
      setIsBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div className={`inline-flex h-10 w-32 animate-pulse rounded-md bg-gray-200 ${className}`} />
    );
  }

  if (!user) {
    return (
      <div className={className}>
        <LoginLink
          className="inline-flex h-10 items-center gap-2 rounded-md border border-purple-200 bg-white px-4 text-sm font-semibold text-purple-700 hover:bg-purple-50"
          redirectTo={`/topics/${encodeURIComponent(topic.slug)}`}
        >
          <PlusIcon className="h-4 w-4" />
          Follow
        </LoginLink>
        <div className="mt-1 text-xs text-gray-500">{followersCount} followers</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isBusy}
        className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:opacity-60 ${
          isFollowing
            ? 'border border-purple-200 bg-purple-50 text-purple-700 hover:bg-white'
            : 'border border-purple-600 bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isFollowing ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        {isFollowing ? 'Following' : 'Follow'}
      </button>
      <div className="mt-1 text-xs text-gray-500">{followersCount} followers</div>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}
