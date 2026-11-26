import Link from 'next/link';
import { topicHref } from '@/lib/utils/topics';

/**
 * Renders a row of top-tag pills (dashed outline, "#tag") that link
 * to a listing page filtered by tag.
 *
 * @param {string[]} tags       — tag names to display
 * @param {string}   linkPrefix — e.g. "/articles", "/polls", "/suggestions"
 */
export default function TopTagPills({ tags = [] }) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={topicHref(tag)}
          className="px-4 py-1 rounded-full border text-sm font-medium border-dashed bg-white text-gray-600 border-gray-300 hover:bg-blue-50 transition-colors"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
