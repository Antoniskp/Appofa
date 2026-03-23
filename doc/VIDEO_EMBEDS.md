# Video Embeds Feature

Embed YouTube and TikTok videos directly inside Articles, News, and Personal posts via a simple copy-paste URL.

---

## How to Use

### Creating a Post with an Embedded Video

1. Navigate to **Create Article** (or create News / Personal post).
2. In the **Video URL** field at the top of the form, paste a YouTube or TikTok link.
3. The app automatically:
   - Fetches the video title, author, and thumbnail from the provider.
   - Auto-fills the **Title** field (only if you haven't already typed one).
   - Shows a live embed preview directly in the form.
4. You can add commentary in the **Content** field (optional when a video URL is provided).
5. Submit as usual.

### Supported URL Formats

#### YouTube
- `https://www.youtube.com/watch?v=<id>`
- `https://youtu.be/<id>`
- `https://www.youtube.com/shorts/<id>`
- `https://m.youtube.com/watch?v=<id>`
- `https://music.youtube.com/watch?v=<id>`

#### TikTok
- `https://www.tiktok.com/@<user>/video/<id>`
- `https://vm.tiktok.com/<code>/`
- `https://m.tiktok.com/@<user>/video/<id>`

---

## Architecture

### Backend: `POST /api/link-preview`

**Request body:**
```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": "youtube",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Rick Astley – Never Gonna Give You Up",
    "authorName": "Rick Astley",
    "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "providerName": "YouTube",
    "providerUrl": "https://www.youtube.com",
    "embedUrl": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
    "embedHtml": null,
    "cached": false
  }
}
```

### Database

New columns added to the `Articles` table:

| Column | Type | Description |
|--------|------|-------------|
| `sourceUrl` | STRING | Original pasted video URL |
| `sourceProvider` | STRING(50) | `youtube` or `tiktok` |
| `sourceMeta` | JSON | Fetched metadata (title, author, thumbnail, etc.) |
| `embedUrl` | STRING | Safe embed URL (YouTube uses `youtube-nocookie.com`) |
| `embedHtml` | TEXT | Provider oEmbed HTML (TikTok only, sanitized before render) |

A new `LinkPreviewCaches` table caches oEmbed API responses (default TTL: 7 days) to avoid repeated calls to provider APIs.

### Security

- **SSRF protection:** Only YouTube and TikTok hostnames are allowed. Private/loopback IPs, credentials in URLs, and non-HTTP(S) protocols are rejected.
- **XSS prevention:** TikTok `embedHtml` is sanitized before rendering. Only `<iframe>` elements with a `www.tiktok.com` src are allowed. No `<script>` tags are ever injected.
- **YouTube embeds** use the privacy-enhanced `youtube-nocookie.com` domain.
- All fetches from the server to provider APIs are strictly allowlisted; no user-supplied URL is ever fetched directly.

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `VideoEmbedField` | `components/articles/VideoEmbedField.js` | URL input with debounced preview |
| `VideoEmbed` | `components/articles/VideoEmbed.js` | Embed player on detail pages |

### Caching

Preview results are cached in the `LinkPreviewCaches` Postgres table (keyed by normalized URL, TTL 7 days). This means:
- Repeated requests for the same URL are served from DB without hitting YouTube/TikTok APIs.
- No Redis / external cache service required.
- Expired entries are purged asynchronously on each request.

---

## Running Migrations

```bash
node src/run-migrations.js
```

This will apply:
- `029-add-article-embed-fields.js` — adds embed columns to `Articles`
- `030-create-link-preview-cache-table.js` — creates `LinkPreviewCaches` table

---

## Environment Variables

No new environment variables are required. The feature works with the existing database configuration.

Optional tuning (edit `src/controllers/linkPreviewController.js`):
- `CACHE_TTL_MS` — cache lifetime (default: 7 days)
- `FETCH_TIMEOUT_MS` — oEmbed fetch timeout (default: 8 seconds)
- `MAX_BODY_BYTES` — max response body size (default: 512 KB)

---

## Limitations

- Only YouTube and TikTok are supported. To add more providers, extend the allowlists and add provider-specific oEmbed fetching in `linkPreviewController.js`.
- TikTok may rate-limit or change their oEmbed API. The fallback renders a clickable card linking to TikTok.
- Live embed preview in the form editor (VideoEmbedField) requires network access to `/api/link-preview` from the browser.
