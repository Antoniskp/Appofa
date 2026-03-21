#!/usr/bin/env node
/**
 * build-docs.js
 * Converts all doc/*.md files into static HTML pages under static/docs/.
 * Run with: node tools/build-docs.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ─── Configuration ───────────────────────────────────────────────────────────

const DOC_DIR = path.resolve(__dirname, '../doc');
const OUT_DIR = path.resolve(__dirname, '../static/docs');

// Files to skip (internal / not for end users)
const SKIP_FILES = new Set(['COPILOT_AGENTS.md', 'INDEX.md']);

// Ordered categories used for the sidebar and landing page
const CATEGORIES = [
  {
    title: 'Core',
    files: ['PROJECT_SUMMARY.md', 'ARCHITECTURE.md', 'SECURITY.md', 'CONTRIBUTING.md'],
  },
  {
    title: 'Features',
    files: [
      'POLL_FEATURE.md',
      'POLL_EXPORT_AUDIT.md',
      'SUGGESTIONS_FEATURE.md',
      'LOCATION_MODEL.md',
      'LOCATION_SECTIONS.md',
      'OAUTH.md',
      'GOOGLE_ANALYTICS.md',
      'MESSAGE_SYSTEM_IMPLEMENTATION.md',
    ],
  },
  {
    title: 'Deployment & Operations',
    files: [
      'DEPLOYMENT_GUIDE.md',
      'VPS_SETUP.md',
      'UPGRADE_GUIDE.md',
      'MIGRATION_GUIDE.md',
      'MIGRATIONS.md',
      'NODE_UPGRADE_VPS.md',
      'TROUBLESHOOTING.md',
      'DEPENDENCY_UPDATES.md',
    ],
  },
  {
    title: 'Development & Testing',
    files: [
      'API_TESTING.md',
      'POLL_TESTING.md',
      'MESSAGE_SYSTEM_TESTING.md',
      'ARTICLE_TYPES_TESTING.md',
    ],
  },
  {
    title: 'Test Reports',
    files: ['MIGRATION_017_TEST_REPORT.md', 'INTERNATIONAL_LOCATION_TEST_REPORT.md'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert SOME_FILE.md → some-file */
function toSlug(filename) {
  return filename.replace(/\.md$/, '').toLowerCase().replace(/_/g, '-');
}

/** Convert SOME_FILE.md → Some File, with known abbreviation overrides */
const TITLE_OVERRIDES = {
  'OAUTH.md': 'OAuth',
  'VPS_SETUP.md': 'VPS Setup',
  'API_TESTING.md': 'API Testing',
  'NODE_UPGRADE_VPS.md': 'Node Upgrade (VPS)',
  'POLL_EXPORT_AUDIT.md': 'Poll Export & Audit',
  'MIGRATION_017_TEST_REPORT.md': 'Migration 017 Test Report',
  'INTERNATIONAL_LOCATION_TEST_REPORT.md': 'International Location Test Report',
  'MESSAGE_SYSTEM_IMPLEMENTATION.md': 'Message System Implementation',
  'MESSAGE_SYSTEM_TESTING.md': 'Message System Testing',
  'ARTICLE_TYPES_TESTING.md': 'Article Types Testing',
  'DEPENDENCY_UPDATES.md': 'Dependency Updates',
  'GOOGLE_ANALYTICS.md': 'Google Analytics',
  'LOCATION_SECTIONS.md': 'Location Sections',
  'LOCATION_MODEL.md': 'Location Model',
  'MIGRATION_GUIDE.md': 'Migration Guide',
  'UPGRADE_GUIDE.md': 'Upgrade Guide',
  'DEPLOYMENT_GUIDE.md': 'Deployment Guide',
  'CONTRIBUTING.md': 'Contributing',
  'TROUBLESHOOTING.md': 'Troubleshooting',
  'PROJECT_SUMMARY.md': 'Project Summary',
  'ARCHITECTURE.md': 'Architecture',
  'SECURITY.md': 'Security',
  'MIGRATIONS.md': 'Migrations',
  'POLL_FEATURE.md': 'Poll Feature',
  'POLL_TESTING.md': 'Poll Testing',
  'SUGGESTIONS_FEATURE.md': 'Suggestions Feature',
};

function toTitle(filename) {
  return (
    TITLE_OVERRIDES[filename] ||
    filename
      .replace(/\.md$/, '')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  );
}

/** Build a flat list of { filename, slug, title, category } for all published docs */
function buildDocList() {
  const docs = [];
  for (const cat of CATEGORIES) {
    for (const file of cat.files) {
      const filePath = path.join(DOC_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`  [WARN] ${file} listed in CATEGORIES but not found in doc/ – skipping`);
        continue;
      }
      docs.push({ filename: file, slug: toSlug(file), title: toTitle(file), category: cat.title });
    }
  }
  return docs;
}

// ─── HTML Templates ──────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --sidebar-w: 260px;
    --brand: #1a56db;
    --brand-dark: #1e429f;
    --bg: #f9fafb;
    --surface: #ffffff;
    --sidebar-bg: #1e293b;
    --sidebar-text: #cbd5e1;
    --sidebar-active: #ffffff;
    --sidebar-hover: #334155;
    --border: #e5e7eb;
    --text: #111827;
    --muted: #6b7280;
    --code-bg: #f3f4f6;
    --pre-bg: #1e293b;
    --pre-text: #e2e8f0;
  }

  html { font-size: 16px; scroll-behavior: smooth; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
         background: var(--bg); color: var(--text); display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  #sidebar {
    width: var(--sidebar-w);
    min-width: var(--sidebar-w);
    background: var(--sidebar-bg);
    color: var(--sidebar-text);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }
  #sidebar-header {
    padding: 20px 16px 16px;
    border-bottom: 1px solid #334155;
  }
  #sidebar-header a {
    text-decoration: none;
    color: #fff;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  #sidebar-header a span.logo { font-size: 1.3rem; }
  #sidebar nav { padding: 12px 0; flex: 1; }
  #sidebar nav .cat-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #64748b;
    padding: 12px 16px 4px;
  }
  #sidebar nav a {
    display: block;
    padding: 6px 16px 6px 20px;
    color: var(--sidebar-text);
    text-decoration: none;
    font-size: 0.83rem;
    line-height: 1.4;
    border-left: 3px solid transparent;
    transition: background 0.15s, color 0.15s;
  }
  #sidebar nav a:hover { background: var(--sidebar-hover); color: var(--sidebar-active); }
  #sidebar nav a.active {
    background: rgba(26,86,219,0.25);
    color: var(--sidebar-active);
    border-left-color: var(--brand);
    font-weight: 600;
  }

  /* ── Main content ── */
  #content {
    flex: 1;
    padding: 36px 48px 60px;
    max-width: 900px;
  }
  #breadcrumb {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 20px;
  }
  #breadcrumb a { color: var(--brand); text-decoration: none; }
  #breadcrumb a:hover { text-decoration: underline; }

  /* ── Markdown typography ── */
  .md h1, .md h2, .md h3, .md h4 { color: var(--text); font-weight: 700; line-height: 1.3; }
  .md h1 { font-size: 2rem; margin-bottom: 0.5rem; padding-bottom: 0.4rem; border-bottom: 2px solid var(--border); }
  .md h2 { font-size: 1.35rem; margin-top: 2rem; margin-bottom: 0.5rem; padding-bottom: 0.2rem; border-bottom: 1px solid var(--border); }
  .md h3 { font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.4rem; }
  .md h4 { font-size: 0.95rem; margin-top: 1.2rem; margin-bottom: 0.3rem; }
  .md p { margin-bottom: 0.9rem; line-height: 1.7; }
  .md ul, .md ol { margin: 0 0 0.9rem 1.4rem; }
  .md li { margin-bottom: 0.3rem; line-height: 1.6; }
  .md a { color: var(--brand); text-decoration: none; }
  .md a:hover { text-decoration: underline; }
  .md strong { font-weight: 700; }
  .md em { font-style: italic; }
  .md hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
  .md blockquote {
    border-left: 4px solid var(--brand);
    background: #eff6ff;
    padding: 10px 16px;
    margin: 1rem 0;
    border-radius: 0 6px 6px 0;
    color: #1e40af;
  }
  .md code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    background: var(--code-bg);
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 0.85em;
  }
  .md pre {
    background: var(--pre-bg);
    color: var(--pre-text);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0 1.2rem;
    line-height: 1.5;
  }
  .md pre code { background: none; padding: 0; font-size: 0.82rem; color: inherit; }
  .md table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.88rem; }
  .md th { background: #f1f5f9; font-weight: 700; text-align: left; }
  .md th, .md td { border: 1px solid var(--border); padding: 8px 12px; }
  .md tr:nth-child(even) td { background: #f9fafb; }
  .md img { max-width: 100%; border-radius: 6px; margin: 0.5rem 0; }

  /* ── Landing page cards ── */
  .cat-section h2 { font-size: 1.1rem; font-weight: 700; color: var(--muted);
                    letter-spacing: 0.05em; text-transform: uppercase;
                    margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 32px;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    text-decoration: none;
    color: var(--text);
    transition: box-shadow 0.15s, border-color 0.15s;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--brand); }
  .card .card-icon { font-size: 1.3rem; margin-top: 1px; }
  .card .card-title { font-weight: 600; font-size: 0.88rem; line-height: 1.4; }

  /* ── Hero (landing) ── */
  .hero {
    background: linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 100%);
    color: white;
    padding: 32px 36px;
    border-radius: 12px;
    margin-bottom: 36px;
  }
  .hero h1 { font-size: 1.9rem; font-weight: 800; margin-bottom: 8px; border: none; }
  .hero p { font-size: 1rem; opacity: 0.9; max-width: 560px; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    body { flex-direction: column; }
    #sidebar { width: 100%; min-width: unset; height: auto; position: static; }
    #sidebar nav { display: none; }
    #content { padding: 24px 20px 48px; }
  }
`;

function buildSidebar(docs, activeSlug) {
  let html = '';
  for (const cat of CATEGORIES) {
    const catDocs = docs.filter((d) => d.category === cat.title);
    if (catDocs.length === 0) continue;
    html += `<div class="cat-label">${escHtml(cat.title)}</div>\n`;
    for (const doc of catDocs) {
      const cls = doc.slug === activeSlug ? ' class="active"' : '';
      html += `<a href="${doc.slug}.html"${cls}>${escHtml(doc.title)}</a>\n`;
    }
  }
  return html;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const categoryIcons = {
  Core: '📖',
  Features: '⚙️',
  'Deployment & Operations': '🚀',
  'Development & Testing': '🧪',
  'Test Reports': '📊',
};

function pageTemplate({ title, bodyHtml, sidebarHtml, breadcrumb }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)} – Appofa Docs</title>
  <style>${CSS}</style>
</head>
<body>
  <aside id="sidebar">
    <div id="sidebar-header">
      <a href="index.html"><span class="logo">📰</span> Appofa Docs</a>
    </div>
    <nav>${sidebarHtml}</nav>
  </aside>
  <main id="content">
    <div id="breadcrumb">${breadcrumb}</div>
    <article class="md">${bodyHtml}</article>
  </main>
</body>
</html>`;
}

function indexTemplate({ sidebarHtml, docs }) {
  let categorySections = '';
  for (const cat of CATEGORIES) {
    const catDocs = docs.filter((d) => d.category === cat.title);
    if (catDocs.length === 0) continue;
    const icon = categoryIcons[cat.title] || '📄';
    const cards = catDocs
      .map(
        (doc) =>
          `<a class="card" href="${doc.slug}.html"><span class="card-icon">${icon}</span><span class="card-title">${escHtml(doc.title)}</span></a>`
      )
      .join('\n');
    categorySections += `<section class="cat-section">
  <h2>${escHtml(cat.title)}</h2>
  <div class="card-grid">${cards}</div>
</section>\n`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appofa Docs</title>
  <style>${CSS}</style>
</head>
<body>
  <aside id="sidebar">
    <div id="sidebar-header">
      <a href="index.html"><span class="logo">📰</span> Appofa Docs</a>
    </div>
    <nav>${sidebarHtml}</nav>
  </aside>
  <main id="content">
    <div class="hero">
      <h1>📰 Appofa Documentation</h1>
      <p>Comprehensive guides for developers and operators of the Appofa news application.</p>
    </div>
    ${categorySections}
  </main>
</body>
</html>`;
}

// ─── Link rewriter ────────────────────────────────────────────────────────────

/**
 * Rewrite internal Markdown links in rendered HTML so that cross-doc links
 * resolve correctly in the static output.
 * e.g. href="POLL_FEATURE.md"               → href="poll-feature.html"
 *      href="VPS_SETUP.md#some-anchor"       → href="vps-setup.html#some-anchor"
 *      href="INDEX.md"                       → href="index.html"
 *      href="../README.md"                   → (kept as-is, external)
 */
function rewriteLinks(html, publishedSlugs) {
  return html.replace(/href="([^"]+)"/g, (match, href) => {
    // Split off any anchor fragment
    const hashIdx = href.indexOf('#');
    const filePart = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
    const hashPart = hashIdx >= 0 ? href.slice(hashIdx) : '';

    // Skip external or relative-parent links
    if (href.startsWith('http') || href.startsWith('../') || !filePart.endsWith('.md')) {
      return match;
    }

    // INDEX.md maps to index.html (the landing page)
    if (filePart === 'INDEX.md') {
      return `href="index.html${hashPart}"`;
    }

    const basename = path.basename(filePart);
    const slug = toSlug(basename);
    if (publishedSlugs.has(slug)) {
      return `href="${slug}.html${hashPart}"`;
    }

    return match;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const docs = buildDocList();
  const publishedSlugs = new Set(docs.map((d) => d.slug));

  // Configure marked options
  marked.setOptions({ gfm: true, breaks: false });

  console.log(`Building ${docs.length} documentation pages → ${OUT_DIR}\n`);

  for (const doc of docs) {
    const srcPath = path.join(DOC_DIR, doc.filename);
    const outPath = path.join(OUT_DIR, `${doc.slug}.html`);

    const raw = fs.readFileSync(srcPath, 'utf8');
    let bodyHtml = marked.parse(raw);
    bodyHtml = rewriteLinks(bodyHtml, publishedSlugs);

    const sidebarHtml = buildSidebar(docs, doc.slug);
    const breadcrumb = `<a href="index.html">Docs</a> › ${escHtml(doc.title)}`;

    const html = pageTemplate({
      title: doc.title,
      bodyHtml,
      sidebarHtml,
      breadcrumb,
    });

    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`  ✓ ${doc.slug}.html`);
  }

  // Generate index page
  const sidebarHtml = buildSidebar(docs, null);
  const indexHtml = indexTemplate({ sidebarHtml, docs });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml, 'utf8');
  console.log(`  ✓ index.html`);

  console.log(`\nDone. Open static/docs/index.html in your browser to preview.`);
}

build();
