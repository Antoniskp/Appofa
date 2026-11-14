// Trusted SVG paths shared by Leaflet markers and React cards. Never interpolate user SVG.
export const MAP_ISSUE_ICON_PATHS = {
  pothole: 'M4 5h16M8 5l-4 14m12-14 4 14M12 7v3m0 4v3M9 12h6',
  neglected_building: 'M4 21V7l8-4 8 4v14M2 21h20M8 8v2m8-2v2M8 13v2m8-2v2m-6 6v-4h4v4',
  broken_lighting: 'M9 18h6m-5 3h4M8 13a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3M12 1v1M2 8h2m16 0h2',
  sidewalk_access: 'M9 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0M10 7v6h6l3 6M10 10h6M7 11a6 6 0 1 0 7 9',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  unsafe_crossing: 'M12 3 2 21h20L12 3Zm0 6v5m0 3v1',
  flooding: 'M12 3s-7 7-7 11a7 7 0 0 0 14 0c0-4-7-11-7-11ZM8 15a4 4 0 0 0 4 4',
  illegal_dumping: 'M3 20h18M4 20l3-7 4 3 3-7 6 11M5 7l2-3 4 2-2 4-4-3Z',
  graffiti_vandalism: 'm4 17 12-12 3 3L7 20H4v-3Zm10-10 3 3M4 4h5M3 9h3m12 8h3m-9 4h9',
  abandoned_vehicle: 'm5 7 2-4h10l2 4M3 7h18v11H3V7Zm0 6h18M6 17v4m12-4v4M6 10h1m10 0h1',
  noise: 'M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  other: 'M12 8v5m0 3v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

export function mapIssueSvg(issueType) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${MAP_ISSUE_ICON_PATHS[issueType] || MAP_ISSUE_ICON_PATHS.other}"/></svg>`;
}

export function mapCameraSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 8l6-4v16l-6-4M3 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>';
}
