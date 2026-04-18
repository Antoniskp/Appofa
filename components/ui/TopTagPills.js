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
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`${linkPrefix}?tag=${encodeURIComponent(tag)}`}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
