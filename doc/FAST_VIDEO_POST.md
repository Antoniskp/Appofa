# Fast Video Post

Post a YouTube or TikTok video in under 10 seconds: paste the URL, confirm the auto-filled title, and hit **Δημοσίευση Βίντεο**.

---

## How to Use

1. Navigate to **`/videos/new`** (or click "Add Video" from the navigation).
2. **Paste** a YouTube or TikTok URL into the video field.
3. The app automatically fetches the video title, author, thumbnail, and embed URL.
4. (Optional) Edit the title or summary.
5. (Optional) Pick a **category** and/or **location**.
6. Click **Δημοσίευση Βίντεο** to publish instantly.

The video post is created as a published Article with `type: 'video'` and is immediately visible on the platform.

---

## Supported URL Formats

The same providers supported by the [Video Embeds](VIDEO_EMBEDS.md) feature:

### YouTube
- `https://www.youtube.com/watch?v=<id>`
- `https://youtu.be/<id>`
- `https://www.youtube.com/shorts/<id>`
- `https://m.youtube.com/watch?v=<id>`
- `https://music.youtube.com/watch?v=<id>`

### TikTok
- `https://www.tiktok.com/@<user>/video/<id>`
- `https://www.tiktok.com/@<user>/photo/<id>` (slideshow posts)
- `https://vm.tiktok.com/<code>/`
- `https://t.tiktok.com/<code>/`
- `https://m.tiktok.com/@<user>/video/<id>`

---

## Architecture

### Data Model

Fast Video Posts use the existing `Article` model with a new type value:

| Field | Value | Notes |
|-------|-------|-------|
| `type` | `'video'` | New ENUM value added to Articles |
| `sourceUrl` | Original pasted URL | Required for video posts |
| `sourceProvider` | `'youtube'` or `'tiktok'` | Detected from URL |
| `sourceMeta` | JSON | `{ title, authorName, thumbnailUrl }` |
| `embedUrl` | Safe embed URL | Used for playback |
| `embedHtml` | Provider HTML | TikTok only, sanitized |
| `content` | Text (optional) | Can be empty for video posts |
| `category` | String (optional) | From video category list |
| `status` | `'published'` | Published immediately on submit |

Content validation is relaxed for the `video` type: when a `sourceUrl` is present, the usual 10-character minimum for `content` is waived.

### Migration

Migration `031-add-video-article-type.js` adds `'video'` to the `enum_Articles_type` PostgreSQL ENUM:

```bash
node src/scripts/run-migrations.js
```

The migration is reversible — rolling back converts any existing video posts to `type: 'personal'` before removing the ENUM value.

### Categories

Video posts have their own set of categories defined in `config/articleCategories.json` under `articleTypes.video`:

| Category |
|----------|
| Γενικά |
| Πολιτική |
| Sports |
| Τεχνολογία |
| Ψυχαγωγία |
| Lifestyle |
| Υγεία |
| Εκπαίδευση |
| Περιβάλλον |
| Οικονομία |

Category selection is optional (`categoryRequired: false`).

### Location Linking

Video posts can optionally be linked to a location using the same `CascadingLocationSelector` and `LocationLink` system used by regular articles. See [LOCATION_MODEL.md](LOCATION_MODEL.md) for the hierarchical location system.

### API

Video posts are created through the existing Article API endpoint:

**Create a video post:**
```http
POST /api/articles
Content-Type: application/json
Authorization: Bearer <token>
X-CSRF-Token: <csrf-token>

{
  "title": "Rick Astley – Never Gonna Give You Up",
  "content": "",
  "summary": "Rick Astley",
  "type": "video",
  "status": "published",
  "category": "Ψυχαγωγία",
  "sourceUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "sourceProvider": "youtube",
  "sourceMeta": {
    "title": "Rick Astley – Never Gonna Give You Up",
    "authorName": "Rick Astley",
    "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
  },
  "embedUrl": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
  "embedHtml": null
}
```

**Link a location (optional):**
```http
POST /api/locations/link
Content-Type: application/json
Authorization: Bearer <token>
X-CSRF-Token: <csrf-token>

{
  "location_id": 3,
  "entity_type": "article",
  "entity_id": 42
}
```

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `VideoPostForm` | `components/articles/VideoPostForm.js` | Streamlined video post form |
| `VideoEmbedField` | `components/articles/VideoEmbedField.js` | URL input with auto-preview (reused) |
| `CascadingLocationSelector` | `components/CascadingLocationSelector.js` | Location picker (reused) |
| `NewVideoPage` | `app/videos/new/page.js` | `/videos/new` route page |

### Security

- Same SSRF protection as [Video Embeds](VIDEO_EMBEDS.md): only YouTube and TikTok hostnames allowed
- Same XSS prevention: embedHtml sanitized, YouTube uses `youtube-nocookie.com`
- Authentication required (JWT)
- CSRF protection on submit
- Rate-limited via `createLimiter` middleware

---

## User Flow Diagram

```
User navigates to /videos/new
        │
        ▼
  ┌──────────────┐
  │ Paste video  │ ← Only required input
  │    URL       │
  └──────┬───────┘
         │ Debounced fetch to POST /api/link-preview
         ▼
  ┌──────────────┐
  │ Auto-fill:   │
  │ • Title      │ ← From video metadata
  │ • Summary    │ ← From author name
  │ • Preview    │ ← Embedded player
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ (Optional)   │
  │ • Category   │ ← Dropdown
  │ • Location   │ ← Cascading selector
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Submit       │ → POST /api/articles (type: 'video')
  │              │ → POST /api/locations/link (if location selected)
  └──────┬───────┘
         │
         ▼
  Redirect to /articles/:id
```

---

## Environment Variables

No new environment variables are required. The feature works with the existing database and API configuration.

---

## Future Enhancements (Phase 2)

- **ChatGPT auto-title/summary**: If video metadata is insufficient, optionally call ChatGPT to generate a suggested title and summary from the video's description or transcript.
- **Video feed page**: A dedicated `/videos` listing page filtering articles by `type: 'video'`.
- **Social verdicts**: Community voting/verdict system optimized for video content.
- **Additional providers**: Support for Vimeo, Instagram Reels, and other video platforms.

---

## Related Documentation

- [Video Embeds](VIDEO_EMBEDS.md) — Full video embed feature (URL formats, oEmbed API, caching, security)
- [Categories](CATEGORIES.md) — Category system and how to suggest new categories
- [Location Model](LOCATION_MODEL.md) — Hierarchical location system
- [Migrations](MIGRATIONS.md) — Database migration reference
