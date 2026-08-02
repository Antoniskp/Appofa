export const VIDEO_PIN_CATEGORY_STYLES = {
  'local-news': { label: 'Local news', color: '#2563eb' },
  traffic: { label: 'Traffic', color: '#f59e0b' },
  weather: { label: 'Weather', color: '#0891b2' },
  events: { label: 'Events', color: '#7c3aed' },
  safety: { label: 'Safety', color: '#dc2626' },
  community: { label: 'Community', color: '#16a34a' },
  other: { label: 'Other', color: '#64748b' },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidCoord(value, min, max) {
  if (value == null || value === '') return false;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= min && numericValue <= max;
}

export function getVideoPinCategoryStyle(category) {
  return VIDEO_PIN_CATEGORY_STYLES[category] || VIDEO_PIN_CATEGORY_STYLES.other;
}

export function getVideoPinWatchUrl(pin) {
  try {
    const parsed = new URL(pin?.canonicalUrl || pin?.sourceUrl);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function buildVideoPinPopup(pin) {
  const style = getVideoPinCategoryStyle(pin.category);
  const title = escapeHtml(pin.title || pin.sourceMeta?.title || 'Video');
  const creator = pin.creatorHandle || pin.creatorName;
  const typeLabel = pin.contentType === 'live' ? 'Live' : 'Viral';
  const thumbnail = pin.thumbnailUrl
    ? `<img src="${escapeHtml(pin.thumbnailUrl)}" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;margin-bottom:8px;background:#111827" />`
    : '';
  const creatorLine = creator
    ? `<div style="font-size:12px;color:#475569;margin-top:2px">${escapeHtml(creator)}</div>`
    : '';
  const expiresLine = pin.contentType === 'live' && pin.expiresAt
    ? `<div style="font-size:11px;color:#64748b;margin-top:6px">Expires ${escapeHtml(new Date(pin.expiresAt).toLocaleString())}</div>`
    : '';
  const watchUrl = getVideoPinWatchUrl(pin);
  const action = watchUrl
    ? `<a href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;color:#1d4ed8;font-weight:700;text-decoration:none">Open video</a>`
    : '';

  return `<div style="min-width:190px">${thumbnail}<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><span style="font-size:11px;font-weight:700;color:#fff;background:${style.color};border-radius:999px;padding:2px 7px">${escapeHtml(typeLabel)}</span><span style="font-size:11px;font-weight:700;color:#334155;background:#f1f5f9;border-radius:999px;padding:2px 7px">${escapeHtml(style.label)}</span></div><strong>${title}</strong>${creatorLine}${expiresLine}${action}</div>`;
}

export function buildVideoPinMarkers(videoPins = [], highlightedMarkerId = null) {
  return videoPins.flatMap((pin) => {
    if (!isValidCoord(pin?.lat, -90, 90) || !isValidCoord(pin?.lng, -180, 180)) {
      return [];
    }

    const style = getVideoPinCategoryStyle(pin.category);
    const creator = pin.creatorHandle || pin.creatorName || '';
    const label = pin.title || pin.sourceMeta?.title || 'Video';
    const typeLabel = pin.contentType === 'live' ? 'Live' : 'Viral';

    return [{
      id: `video-pin:${pin.id}`,
      sourceId: pin.id,
      sourceType: 'video-pin',
      contentType: pin.contentType,
      category: pin.category || 'other',
      lat: Number(pin.lat),
      lng: Number(pin.lng),
      label,
      meta: creator || typeLabel,
      tooltip: creator ? `${label} - ${creator}` : label,
      popup: buildVideoPinPopup(pin),
      href: getVideoPinWatchUrl(pin),
      variant: `video-${pin.contentType || 'viral'}${`video-pin:${pin.id}` === highlightedMarkerId ? '-hovered' : ''}`,
      iconColor: style.color,
    }];
  });
}
