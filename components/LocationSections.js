'use client';

import { useState } from 'react';
import { GlobeAltIcon, PhoneIcon, VideoCameraIcon, MegaphoneIcon, NewspaperIcon } from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Default titles per section type
// ---------------------------------------------------------------------------
const DEFAULT_TITLES = {
  official_links: 'Official Links',
  contacts: 'Contacts',
  webcams: 'Live Webcams',
  announcements: 'Announcements',
  news_sources: 'Τοπικά Μέσα Ενημέρωσης',
};

const SECTION_ICONS = {
  official_links: GlobeAltIcon,
  contacts: PhoneIcon,
  webcams: VideoCameraIcon,
  announcements: MegaphoneIcon,
  news_sources: NewspaperIcon,
};

// ---------------------------------------------------------------------------
// Section type renderers
// ---------------------------------------------------------------------------

function OfficialLinksSection({ content }) {
  const links = content?.links || [];
  if (links.length === 0) return <p className="text-gray-500 text-sm">No links available.</p>;
  return (
    <ul className="space-y-2">
      {links.map((link, i) => (
        <li key={i} className="flex items-center gap-2">
          <GlobeAltIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function ContactsSection({ content }) {
  const phones = content?.phones || [];
  const emails = content?.emails || [];
  if (phones.length === 0 && emails.length === 0) {
    return <p className="text-gray-500 text-sm">No contact information available.</p>;
  }
  return (
    <div className="space-y-4">
      {phones.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phone</h4>
          <ul className="space-y-1">
            {phones.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <PhoneIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600 font-medium">{p.label}:</span>
                <a href={`tel:${p.value}`} className="text-blue-600 hover:underline">{p.value}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {emails.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email</h4>
          <ul className="space-y-1">
            {emails.map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 font-medium">{e.label}:</span>
                <a href={`mailto:${e.value}`} className="text-blue-600 hover:underline">{e.value}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function WebcamsSection({ content, compact = false }) {
  const webcams = content?.webcams || [];
  if (webcams.length === 0) return <p className="text-gray-500 text-sm">No webcams available.</p>;

  if (compact) {
    return (
      <ul className="space-y-1">
        {webcams.map((cam, i) => (
          <li key={i} className="flex items-center gap-2">
            <VideoCameraIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <a
              href={cam.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm truncate"
            >
              {cam.label}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      {webcams.map((cam, i) => {
        const embedType = cam.embedType || 'link';
        return (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{cam.label}</span>
              <a
                href={cam.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Open ↗
              </a>
            </div>
            {embedType === 'image' ? (
              <img
                src={cam.url}
                alt={cam.label}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            ) : embedType === 'iframe' ? (
              <iframe
                src={cam.url}
                title={cam.label}
                className="w-full h-48 border-0"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="px-3 py-4 text-sm text-gray-600">
                <a
                  href={cam.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <VideoCameraIcon className="w-4 h-4" />
                  View webcam
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnnouncementsSection({ content }) {
  const items = content?.items || [];
  const now = new Date();
  // Show only active announcements (not expired)
  const active = items.filter(item => {
    if (item.endsAt && new Date(item.endsAt) < now) return false;
    return true;
  });
  if (active.length === 0) return <p className="text-gray-500 text-sm">No active announcements.</p>;

  // Sort by priority descending (higher = more important)
  const sorted = [...active].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return (
    <div className="space-y-3">
      {sorted.map((ann, i) => (
        <div
          key={i}
          className={`p-4 rounded-lg border-l-4 ${
            (ann.priority || 0) >= 5
              ? 'border-red-400 bg-red-50'
              : (ann.priority || 0) >= 3
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-blue-400 bg-blue-50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {ann.linkUrl ? (
                <a
                  href={ann.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-700"
                >
                  {ann.title}
                </a>
              ) : (
                ann.title
              )}
            </h4>
            {ann.startsAt && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {new Date(ann.startsAt).toLocaleDateString('el-GR')}
              </span>
            )}
          </div>
          {ann.body && (
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{ann.body}</p>
          )}
          {ann.endsAt && (
            <p className="text-xs text-gray-400 mt-2">
              Until: {new Date(ann.endsAt).toLocaleDateString('el-GR')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Small inner component that loads a site's favicon with a fallback to NewspaperIcon
function SourceFavicon({ url, size = 'sm' }) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  let faviconUrl = null;
  try {
    const origin = new URL(url).origin;
    faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=32`;
  } catch {
    // invalid URL — fall through to icon fallback
  }

  if (!faviconUrl || imgError) {
    return <NewspaperIcon className={`${sizeClass} text-blue-500 flex-shrink-0`} />;
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      className={`${sizeClass} flex-shrink-0 object-contain`}
      onError={() => setImgError(true)}
    />
  );
}

function NewsSourcesSection({ content, compact = false }) {
  const sources = content?.sources || [];
  if (sources.length === 0) return <p className="text-gray-500 text-sm">No news sources listed.</p>;

  if (compact) {
    return (
      <ul className="space-y-1">
        {sources.map((source, i) => (
          <li key={i} className="flex items-center gap-2">
            <SourceFavicon url={source.url} size="sm" />
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm truncate"
            >
              {source.name}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((source, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <SourceFavicon url={source.url} size="lg" />
          <div className="min-w-0 flex-1">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-blue-600 hover:underline break-words"
            >
              {source.name}
            </a>
            <p className="text-xs text-gray-400 truncate">{source.url}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderer (dispatches by type)
// ---------------------------------------------------------------------------
function SectionContent({ type, content, compact = false }) {
  switch (type) {
    case 'official_links': return <OfficialLinksSection content={content} />;
    case 'contacts': return <ContactsSection content={content} />;
    case 'webcams': return <WebcamsSection content={content} compact={compact} />;
    case 'announcements': return <AnnouncementsSection content={content} />;
    case 'news_sources': return <NewsSourcesSection content={content} compact={compact} />;
    default: return <p className="text-gray-500 text-sm">Unknown section type.</p>;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LocationSections({ sections, compact = false }) {
  if (!sections || sections.length === 0) return null;

  const published = sections.filter(s => s.isPublished);
  if (published.length === 0) return null;

  if (compact) {
    return (
      <div className="space-y-4">
        {published.map((section) => (
          <div key={section.id}>
            <SectionContent type={section.type} content={section.content} compact />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {published.map((section) => {
        const Icon = SECTION_ICONS[section.type] || GlobeAltIcon;
        const title = section.title || DEFAULT_TITLES[section.type] || section.type;
        return (
          <div key={section.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <SectionContent type={section.type} content={section.content} />
          </div>
        );
      })}
    </div>
  );
}
