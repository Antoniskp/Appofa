'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Button from '@/components/Button';
import Tooltip from '@/components/Tooltip';
import { useToast } from '@/components/ToastProvider';

/**
 * FollowButton renders a follow/unfollow button for a target user.
 *
 * @param {number|string} targetUserId - ID of the user to follow/unfollow.
 * @param {function} [onCountChange] - Optional callback when follower count changes.
 */
export default function FollowButton({ targetUserId, onCountChange }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const toast = useToast();

  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  const isSelf = !authLoading && authUser && authUser.id === Number(targetUserId);
  const isAuthenticated = !authLoading && !!authUser;

  useEffect(() => {
    if (!isAuthenticated || isSelf || !targetUserId) {
      setStatusLoaded(true);
      return;
    }
    let cancelled = false;
    authAPI.isFollowing(targetUserId)
      .then((res) => {
        if (!cancelled) {
          setFollowing(res?.data?.following ?? false);
          setStatusLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setStatusLoaded(true);
      });
    return () => { cancelled = true; };
  }, [targetUserId, isAuthenticated, isSelf]);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const willFollow = !following;
    // Optimistic update
    setFollowing(willFollow);
    try {
      if (willFollow) {
        await authAPI.followUser(targetUserId);
        toast.success('You are now following this user.');
      } else {
        await authAPI.unfollowUser(targetUserId);
        toast.info('You unfollowed this user.');
      }
      if (onCountChange) onCountChange();
    } catch (err) {
      // Revert optimistic update
      setFollowing(!willFollow);
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !statusLoaded) return null;

  if (!isAuthenticated) return null;

  if (isSelf) {
    return (
      <Tooltip content="You cannot follow yourself">
        <Button variant="secondary" size="sm" disabled>
          Follow
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      size="sm"
      loading={loading}
      onClick={handleClick}
      aria-pressed={following}
    >
      {following ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
