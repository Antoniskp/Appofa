'use client';

import { useEffect, useState, useCallback } from 'react';
import { commentAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import CommentForm from './CommentForm';
import { formatDistanceToNow } from 'date-fns';

const DEFAULT_AVATAR_COLOR = '#64748b';
const MAX_DEPTH = 5;

function CommentAvatar({ author }) {
  const [avatarError, setAvatarError] = useState(false);
  const initial = (author?.username || 'U').charAt(0).toUpperCase();
  return (
    <div
      className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
      style={{ backgroundColor: author?.avatarColor || DEFAULT_AVATAR_COLOR }}
    >
      {author?.avatar && !avatarError ? (
        <img
          src={author.avatar}
          alt={author.username}
          className="h-full w-full object-cover"
          onError={() => setAvatarError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  entityType,
  entityId,
  user,
  onCommentAdded,
  onCommentUpdated,
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [moderating, setModerating] = useState(false);

  const isAdminOrMod = user && ['admin', 'moderator'].includes(user.role);
  const isAuthor = user && user.id === comment.authorId;
  const canDelete = isAdminOrMod || isAuthor;
  const canHide = isAdminOrMod;
  const showModerationControls = canHide || canDelete;

  const handleHide = async () => {
    setModerating(true);
    try {
      const result = await (comment.status === 'hidden'
        ? commentAPI.unhideComment(comment.id)
        : commentAPI.hideComment(comment.id));
      if (onCommentUpdated)
        onCommentUpdated(
          result.data?.comment || {
            ...comment,
            status: comment.status === 'hidden' ? 'visible' : 'hidden',
          }
        );
    } catch (err) {
      console.error(err);
    } finally {
      setModerating(false);
    }
  };

  const handleDelete = async () => {
    setModerating(true);
    try {
      await commentAPI.deleteComment(comment.id);
      if (onCommentUpdated)
        onCommentUpdated({ ...comment, status: 'deleted', body: null });
    } catch (err) {
      console.error(err);
    } finally {
      setModerating(false);
    }
  };

  const isDeleted = comment.status === 'deleted' || comment._deleted;
  const isHidden = comment.status === 'hidden';

  const replies = comment.replies || [];

  return (
    <div
      className={`flex gap-3 ${
        depth > 1 ? 'ml-8 border-l-2 border-gray-100 pl-3' : ''
      }`}
    >
      <CommentAvatar author={comment.author} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-800">
            {comment.author?.username || 'Unknown'}
          </span>
          <span className="text-xs text-gray-400">
            {comment.createdAt
              ? formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })
              : ''}
          </span>
          {isHidden && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
              Hidden
            </span>
          )}
        </div>
        <div
          className={`text-sm mt-1 ${
            isHidden && !isAdminOrMod ? 'italic text-gray-400' : 'text-gray-700'
          }`}
        >
          {isDeleted ? (
            <em className="text-gray-400">This comment has been deleted.</em>
          ) : isHidden && !isAdminOrMod ? (
            <em>This comment is hidden.</em>
          ) : (
            comment.body
          )}
        </div>
        {!isDeleted && user && (
          <div className="flex gap-3 mt-1 flex-wrap">
            {depth < MAX_DEPTH && (
              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={() => setShowReplyForm((v) => !v)}
              >
                {showReplyForm ? 'Cancel' : 'Reply'}
              </button>
            )}
            {showModerationControls && (
              <>
                {canHide && (
                  <button
                    className="text-xs text-yellow-600 hover:underline disabled:opacity-50"
                    onClick={handleHide}
                    disabled={moderating}
                  >
                    {comment.status === 'hidden' ? 'Unhide' : 'Hide'}
                  </button>
                )}
                {canDelete && (
                  <button
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                    onClick={handleDelete}
                    disabled={moderating}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {showReplyForm && (
          <div className="mt-2">
            <CommentForm
              entityType={entityType}
              entityId={entityId}
              parentId={comment.id}
              placeholder="Write a reply..."
              onSuccess={(newComment) => {
                setShowReplyForm(false);
                if (onCommentAdded) onCommentAdded(newComment);
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                entityType={entityType}
                entityId={entityId}
                user={user}
                onCommentAdded={onCommentAdded}
                onCommentUpdated={onCommentUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildTree(comments) {
  const map = {};
  const roots = [];
  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });
  comments.forEach((c) => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

export default function CommentsThread({
  entityType,
  entityId,
  commentsEnabled = true,
  commentsLocked = false,
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!user) {
      setComments([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await commentAPI.getComments(entityType, entityId);
      const flat = result.data?.comments || [];
      setTotalCount(flat.length);
      setComments(buildTree(flat));
    } catch (err) {
      setError(err.message || 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentAdded = useCallback(
    (newComment) => {
      if (newComment) fetchComments();
    },
    [fetchComments]
  );

  const handleCommentUpdated = useCallback((updatedComment) => {
    setComments((prev) => {
      function updateInTree(nodes) {
        return nodes.map((n) => {
          if (n.id === updatedComment.id) return { ...n, ...updatedComment };
          return { ...n, replies: updateInTree(n.replies || []) };
        });
      }
      return updateInTree(prev);
    });
  }, []);

  if (!user) {
    return (
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        <p className="text-sm text-gray-500 italic">
          Please{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            log in
          </a>{' '}
          to view and post comments.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold mb-4">
        Comments{' '}
        {totalCount > 0 && (
          <span className="text-gray-400 text-base font-normal">
            ({totalCount})
          </span>
        )}
      </h2>

      {!commentsEnabled ? (
        <p className="text-sm text-gray-500 italic">Comments are disabled.</p>
      ) : commentsLocked ? (
        <>
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-4">
            Comments are locked. No new comments can be posted.
          </p>
          {loading ? (
            <p className="text-sm text-gray-400">Loading comments...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  depth={1}
                  entityType={entityType}
                  entityId={entityId}
                  user={user}
                  onCommentAdded={handleCommentAdded}
                  onCommentUpdated={handleCommentUpdated}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <CommentForm
              entityType={entityType}
              entityId={entityId}
              onSuccess={handleCommentAdded}
            />
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading comments...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  depth={1}
                  entityType={entityType}
                  entityId={entityId}
                  user={user}
                  onCommentAdded={handleCommentAdded}
                  onCommentUpdated={handleCommentUpdated}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
