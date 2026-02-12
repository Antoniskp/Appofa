'use client';

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

const renderInlineText = (text, keyPrefix) => {
  if (!text) return null;

  const pattern = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={`${keyPrefix}-b-${match.index}`}>{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={`${keyPrefix}-i-${match.index}`}>{match[4]}</em>);
    } else if (match[6] && match[7]) {
      const href = match[7].trim();
      if (isSafeUrl(href)) {
        parts.push(
          <a
            key={`${keyPrefix}-l-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {match[6]}
          </a>
        );
      } else {
        parts.push(match[0]);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const renderVideo = (url, key) => {
  const safeUrl = url.trim();
  if (!isSafeUrl(safeUrl)) {
    return null;
  }

  const youtubeEmbedUrl = toYouTubeEmbedUrl(safeUrl);
  const vimeoEmbedUrl = toVimeoEmbedUrl(safeUrl);

  if (youtubeEmbedUrl || vimeoEmbedUrl) {
    return (
      <div key={key} className="my-4">
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
    <video key={key} controls className="my-4 w-full rounded-lg">
      <source src={safeUrl} />
      Your browser does not support video playback.
    </video>
  );
};

export default function RichArticleContent({ content = '' }) {
  const lines = String(content || '').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: 'code', content: codeLines.join('\n') });
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items = [];
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().replace(/^-\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', content: line.replace(/^>\s+/, '') });
      index += 1;
      continue;
    }

    blocks.push({ type: 'line', content: rawLine });
    index += 1;
  }

  return (
    <div className="space-y-3 text-gray-800 leading-relaxed">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <pre key={`code-${index}`} className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              <code>{block.content}</code>
            </pre>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={`ul-${index}`} className="list-disc pl-6 space-y-1">
              {block.items.map((item, itemIndex) => (
                <li key={`ul-item-${index}-${itemIndex}`}>{renderInlineText(item, `ul-${index}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={`ol-${index}`} className="list-decimal pl-6 space-y-1">
              {block.items.map((item, itemIndex) => (
                <li key={`ol-item-${index}-${itemIndex}`}>{renderInlineText(item, `ol-${index}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={`quote-${index}`} className="border-l-4 border-gray-300 pl-4 italic text-gray-700">
              {renderInlineText(block.content, `quote-${index}`)}
            </blockquote>
          );
        }

        const line = (block.content || '').trim();

        if (!line) {
          return <div key={`spacer-${index}`} className="h-2" />;
        }

        const imageMatch = line.match(/^!\[(.*?)\]\((.+?)\)$/);
        if (imageMatch) {
          const alt = imageMatch[1] || 'Article image';
          const src = imageMatch[2].trim();

          if (!isSafeUrl(src)) {
            return null;
          }

          return (
            <figure key={`img-${index}`} className="my-4">
              <img src={src} alt={alt} className="w-full rounded-lg border border-gray-200" />
              {alt && alt !== 'Article image' && (
                <figcaption className="mt-2 text-sm text-gray-500">{alt}</figcaption>
              )}
            </figure>
          );
        }

        const videoMatch = line.match(/^\[video\]\((.+?)\)$/i);
        if (videoMatch) {
          return renderVideo(videoMatch[1], `video-${index}`);
        }

        if (line.startsWith('### ')) {
          return (
            <h3 key={`h3-${index}`} className="text-xl font-semibold mt-4">
              {renderInlineText(line.replace(/^###\s+/, ''), `h3-${index}`)}
            </h3>
          );
        }

        if (line.startsWith('## ')) {
          return (
            <h2 key={`h2-${index}`} className="text-2xl font-bold mt-5">
              {renderInlineText(line.replace(/^##\s+/, ''), `h2-${index}`)}
            </h2>
          );
        }

        return (
          <p key={`p-${index}`} className="break-words">
            {renderInlineText(line, `p-${index}`)}
          </p>
        );
      })}
    </div>
  );
}
