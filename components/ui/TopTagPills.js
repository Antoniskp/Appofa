import Link from 'next/link';

/**
 * Renders a row of top-tag pills (purple, rounded-full) that link
 * to a listing page filtered by tag.
 *
 * @param {string[]} tags       — tag names to display
 * @param {string}   linkPrefix — e.g. "/articles", "/polls", "/suggestions"
 */
export default function TopTagPills({ tags = [], linkPrefix = '/articles' }) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`${linkPrefix}?tag=${encodeURIComponent(tag)}`}
          className="px-4 py-1 rounded-full border text-sm font-medium bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors"
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
