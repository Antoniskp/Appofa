const {
  buildVideoPinMarkers,
  getVideoPinWatchUrl,
  getVideoPinCategoryStyle,
} = require('../lib/utils/videoPinMarkers');

describe('video pin marker helpers', () => {
  test('builds category-colored live and viral markers', () => {
    const markers = buildVideoPinMarkers([
      {
        id: 12,
        contentType: 'live',
        category: 'traffic',
        title: 'Traffic live from port',
        creatorHandle: '@portwatch',
        canonicalUrl: 'https://www.tiktok.com/@portwatch/video/123',
        thumbnailUrl: 'https://p16.tiktokcdn.com/thumb.jpg',
        lat: '37.9838100',
        lng: '23.7275400',
        expiresAt: '2026-08-03T10:00:00Z',
      },
      {
        id: 13,
        contentType: 'viral',
        category: 'community',
        title: 'Festival clip',
        sourceUrl: 'https://www.youtube.com/watch?v=abc123',
        lat: 38,
        lng: 24,
      },
    ]);

    expect(markers).toHaveLength(2);
    expect(markers[0]).toMatchObject({
      id: 'video-pin:12',
      sourceId: 12,
      sourceType: 'video-pin',
      contentType: 'live',
      category: 'traffic',
      lat: 37.98381,
      lng: 23.72754,
      iconColor: '#f59e0b',
      href: 'https://www.tiktok.com/@portwatch/video/123',
    });
    expect(markers[0].tooltip).toContain('@portwatch');
    expect(markers[0].popup).toContain('Traffic live from port');
    expect(markers[0].popup).toContain('Open video');
    expect(markers[1].iconColor).toBe('#16a34a');
  });

  test('skips invalid coordinates', () => {
    const markers = buildVideoPinMarkers([
      { id: 1, title: 'Bad lat', lat: 999, lng: 24 },
      { id: 2, title: 'Bad lng', lat: 38, lng: -999 },
      { id: 3, title: 'Missing coords' },
    ]);

    expect(markers).toEqual([]);
  });

  test('sanitizes watch URLs and falls back to the other category style', () => {
    expect(getVideoPinWatchUrl({ sourceUrl: 'javascript:alert(1)' })).toBeNull();
    expect(getVideoPinWatchUrl({ sourceUrl: 'https://www.tiktok.com/@user/video/123' }))
      .toBe('https://www.tiktok.com/@user/video/123');
    expect(getVideoPinCategoryStyle('unknown')).toMatchObject({
      label: 'Other',
      color: '#64748b',
    });
  });
});
