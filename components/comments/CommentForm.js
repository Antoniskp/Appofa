'use client';

import { useState } from 'react';
import { commentAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Button from '@/components/ui/Button';

export default function CommentForm({
  entityType,
  entityId,
  parentId = null,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment...',
}) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    return (
      <p className="text-sm text-gray-500 italic">
        Please{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          log in
        </a>{' '}
        to comment.
      </p>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await commentAPI.createComment({
        entityType,
        entityId,
        parentId,
        body: body.trim(),
      });
      setBody('');
      if (onSuccess) onSuccess(result.data?.comment);
    } catch (err) {
      setError(err.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        maxLength={10000}
        className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={submitting}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={submitting || !body.trim()}
        >
          {submitting ? 'Posting...' : 'Post'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
