'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const isSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const toYouTubeEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      const shortPath = parsed.pathname.split('/').filter(Boolean);
      const videoId = parsed.searchParams.get('v')
        || (shortPath[0] === 'shorts' ? shortPath[1] : null)
        || (shortPath[0] === 'embed' ? shortPath[1] : null);

      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
};

const toVimeoEmbedUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('vimeo.com')) return null;

    const segments = parsed.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
};

const components = {
  h1: ({ children }) => <h1 className="text-3xl font-bold mt-6">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-bold mt-5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-semibold mt-4">{children}</h3>,
  h4: ({ children }) => <h4 className="text-lg font-semibold mt-3">{children}</h4>,
  h5: ({ children }) => <h5 className="text-base font-semibold mt-2">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-semibold mt-2">{children}</h6>,
  p: ({ children }) => <p className="break-words">{children}</p>,
  strong: ({ children }) => <strong>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700">{children}</blockquote>
  ),
  ul: ({ children }) => <ul className="list-disc pl-6 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  code: ({ inline, children }) => {
    if (inline) {
      return <code className="bg-gray-100 rounded px-1 text-sm font-mono">{children}</code>;
    }
    return <code>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">{children}</pre>
  ),
  a: ({ href, children }) => {
    const safeHref = (href || '').trim();
    const childText = Array.isArray(children)
      ? children.filter((c) => typeof c === 'string').join('')
      : typeof children === 'string' ? children : '';

    if (/^video$/i.test(childText)) {
      if (!isSafeUrl(safeHref)) return null;
      const youtubeEmbedUrl = toYouTubeEmbedUrl(safeHref);
      const vimeoEmbedUrl = toVimeoEmbedUrl(safeHref);

      if (youtubeEmbedUrl || vimeoEmbedUrl) {
        return (
          <div className="my-4">
            <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={youtubeEmbedUrl || vimeoEmbedUrl}
                title="Embedded video"
                className="absolute left-0 top-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );
      }

      return (
        <video controls className="my-4 w-full rounded-lg">
          <source src={safeHref} />
          Your browser does not support video playback.
        </video>
      );
    }

    if (!isSafeUrl(safeHref)) return <>{children}</>;

    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => {
    const safeSrc = (src || '').trim();
    if (!isSafeUrl(safeSrc)) return null;
    const altText = alt || 'Article image';
    return (
      <figure className="my-4">
        <img src={safeSrc} alt={altText} className="w-full rounded-lg border border-gray-200" />
        {altText && altText !== 'Article image' && (
          <figcaption className="mt-2 text-sm text-gray-500">{altText}</figcaption>
        )}
      </figure>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-300 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
};

export default function RichArticleContent({ content = '' }) {
  return (
    <div className="space-y-2 text-gray-800 leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {String(content || '')}
      </ReactMarkdown>
    </div>
  );
}
