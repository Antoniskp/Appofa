'use client';

import { useTranslations } from 'next-intl';

function ContentsList({ headings, nested = false }) {
  return (
    <ol className={nested ? 'mt-1 space-y-1 border-l border-gray-200 pl-3' : 'space-y-1'}>
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className="block rounded px-2 py-1.5 text-sm leading-snug text-gray-600 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 break-words"
          >
            {heading.title}
          </a>
          {heading.children.length > 0 && <ContentsList headings={heading.children} nested />}
        </li>
      ))}
    </ol>
  );
}

export default function ArticleContents({ headings }) {
  const t = useTranslations('articles');
  return (
    <nav data-article-contents aria-label={t('contents')} className="not-prose min-w-0 rounded-xl border border-gray-200 bg-gray-50 xl:sticky xl:top-6 print:hidden">
      <details open>
        <summary className="cursor-pointer rounded-t-xl px-4 py-3 font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
          {t('contents')}
        </summary>
        <div className="max-h-64 overflow-y-auto border-t border-gray-200 p-3 xl:max-h-[70vh]">
          <ContentsList headings={headings} />
        </div>
      </details>
    </nav>
  );
}
