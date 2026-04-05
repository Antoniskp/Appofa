# Location Sections

Location Sections allow moderators and admins to add rich, structured "extra information" to any location page — beyond the core fields (name, coordinates, Wikipedia data, etc.).

Sections are **predefined by type**, so they remain structured and secure while still giving moderators flexibility to describe official websites, contacts, webcams, announcements, and local news sources.

---

## Table of Contents

1. [Section Types & JSON Shapes](#section-types--json-shapes)
2. [How Moderators Manage Sections](#how-moderators-manage-sections)
3. [Public Rendering](#public-rendering)
4. [API Reference](#api-reference)
5. [Adding a New Section Type](#adding-a-new-section-type)
6. [Validation Rules](#validation-rules)

---

## Section Types & JSON Shapes

Each section has a `type` (from the predefined enum) and a `content` object whose shape depends on the type.

### 1. `official_links` — Official Links

Links to external resources such as the official municipality website, government portal, etc.

```json
{
  "links": [
    { "label": "Municipality website", "url": "https://www.municipality.gr" },
    { "label": "Official tourism portal", "url": "https://visit.example.com" }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `links` | array | ✅ | Array of link objects |
| `links[].label` | string | ✅ | Human-readable label |
| `links[].url` | string | ✅ | Must start with `https://` |

---

### 2. `contacts` — Contacts

Phone numbers and email addresses for the location (e.g., town hall, tourist office).

```json
{
  "phones": [
    { "label": "Town hall", "value": "+30 210 000 0000" },
    { "label": "Tourist information", "value": "+30 210 111 1111" }
  ],
  "emails": [
    { "label": "General enquiries", "value": "info@municipality.gr" }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `phones` | array | ✅ | Array of phone objects (may be empty) |
| `phones[].label` | string | ✅ | Description of this number |
| `phones[].value` | string | ✅ | Phone number (any format) |
| `emails` | array | ✅ | Array of email objects (may be empty) |
| `emails[].label` | string | ✅ | Description of this address |
| `emails[].value` | string | ✅ | Email address |

---

### 3. `webcams` — Webcams

Live camera feeds for the location.

The `embedType` field is **auto-detected server-side** and should not be set by the moderator UI:
- URLs ending in `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` → `"image"` (rendered as `<img>`)
- All other URLs → `"link"` (shown as a clickable link)
- `"iframe"` remains a valid stored value but is not auto-detected (set programmatically if needed)

```json
{
  "webcams": [
    {
      "label": "Town square",
      "url": "https://webcam.municipality.gr/live",
      "embedType": "link"
    },
    {
      "label": "Harbour view",
      "url": "https://cam.example.com/harbour.jpg",
      "embedType": "image"
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `webcams` | array | ✅ | Array of webcam objects |
| `webcams[].label` | string | ✅ | Human-readable label |
| `webcams[].url` | string | ✅ | Must start with `https://` |
| `webcams[].embedType` | string | ❌ | Auto-detected: `"link"` (default) or `"image"` (for image URLs) |

> **Security note:** `iframe` embeds use `sandbox="allow-scripts allow-same-origin"` to limit risk. Arbitrary HTML is never allowed.

---

### 4. `announcements` — Announcements

Time-limited notices or alerts for the location. Items with an `endsAt` date in the past are automatically hidden on the public page.

Priority levels used in the moderator UI:
- **⚪ Normal** → `priority: 0` (shown with blue accent)
- **🟡 Important** → `priority: 3` (shown with yellow accent)
- **🔴 Urgent** → `priority: 5` (shown with red accent)

```json
{
  "items": [
    {
      "title": "Road closure — Main Street",
      "body": "Main Street will be closed from 08:00 to 20:00 for maintenance works.",
      "startsAt": "2025-06-01",
      "endsAt": "2025-06-07",
      "linkUrl": "https://municipality.gr/news/road-closure",
      "priority": 5
    },
    {
      "title": "Summer festival",
      "priority": 0
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `items` | array | ✅ | Array of announcement objects |
| `items[].title` | string | ✅ | Short heading |
| `items[].body` | string | ❌ | Optional longer description |
| `items[].startsAt` | ISO date string | ❌ | Display start date ("Show from") |
| `items[].endsAt` | ISO date string | ❌ | Items past this date are hidden publicly ("Show until") |
| `items[].linkUrl` | string | ❌ | Must start with `https://` if provided |
| `items[].priority` | integer 0–10 | ❌ | 0=Normal, 3=Important, 5=Urgent; higher values shown first |

---

### 5. `news_sources` — Local News Sources

Links to local news outlets associated with the location.

```json
{
  "sources": [
    { "name": "Εφημερίδα Θεσσαλίας", "url": "https://e-thessalia.gr" },
    { "name": "Ταχυδρόμος", "url": "https://taxydromos.gr" }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `sources` | array | ✅ | Array of news source objects (at least one) |
| `sources[].name` | string | ✅ | Name of the news outlet |
| `sources[].url` | string | ✅ | Must start with `https://` |

---

## How Moderators Manage Sections

Moderators and admins can manage sections directly on the public location page.

### Steps

1. Navigate to any location page: `/locations/<slug>`
2. If you are logged in with **admin** or **moderator** role, you will see a **"Manage Sections"** panel below the location header.
3. Click **"Show manager"** to expand the section manager.

### Available actions

| Action | Description |
|--------|-------------|
| **Add Section** | Click "Add Section" to open a visual card picker. Select a section type card, then fill in the content form and save |
| **Edit** | Click the pencil icon on any section row to edit its content, title, and published status |
| **Publish / Unpublish** | Click the eye icon to toggle visibility. Draft sections are shown only to moderators/admins |
| **Reorder** | Use the ▲ / ▼ arrows on each row to change display order |
| **Delete** | Click the trash icon; a confirmation prompt will appear |

### Draft vs Published

- **Draft** (`isPublished: false`): visible only to moderators/admins via the manager. Not shown on the public page.
- **Published** (`isPublished: true`): shown on the public location page in `sortOrder`.

### Title Override (Advanced)

The section form hides the optional **Title Override** field behind an "⚙️ Advanced options" toggle to reduce visual noise. Click it to reveal the input and set a custom display title (overrides the default type name).

---

## Public Rendering

Sections are rendered in two areas of the public location page (`/locations/<slug>`):

### Info box (right column)

The `official_links`, `contacts`, `webcams`, and `news_sources` section types are shown **inside the "Πληροφορίες" information box** in the compact header area. These types are rendered in a compact, single-line format:

- **official_links / contacts** — rendered as compact lists (globe / phone icons + labels)
- **webcams** — rendered as a compact list of links, one per camera: `[camera icon] <label>` linking to the camera URL. No embed (iframe/image) is used in this view.
- **news_sources** — rendered as a compact list of linked outlet names with a newspaper icon.

### Body area

All remaining section types (`announcements`) are rendered as full-width cards between the location header and the tabbed content area.

---

General rendering rules:

- Only **published** sections are rendered.
- Sections appear in ascending `sortOrder`.
- Each type uses a dedicated display component with appropriate styling.
- **Announcements** with a past `endsAt` are automatically hidden, regardless of `isPublished`.
- No raw HTML is ever rendered; all user-supplied values are text-interpolated through React to prevent XSS.

### Moderator access

The section manager is accessible through the single **Edit** button on the location header. When a moderator or admin clicks **Edit**, both the location detail fields (name, code, coordinates, Wikipedia URL) and the section manager appear in the same edit panel. There is no separate "Manage Sections" button — everything is consolidated into one edit flow.

---

## API Reference

All section routes are nested under `/api/locations/:locationId/sections`.

### Public

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/locations/:locationId/sections` | None | Returns **published** sections only. Moderators/admins authenticated via cookie also see drafts. |

### Moderator / Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/locations/:locationId/sections` | mod/admin | Create a new section |
| `PUT` | `/api/locations/:locationId/sections/:id` | mod/admin | Update section (title, content, isPublished, sortOrder) |
| `DELETE` | `/api/locations/:locationId/sections/:id` | mod/admin | Delete section |
| `PUT` | `/api/locations/:locationId/sections/reorder` | mod/admin | Bulk update sortOrder; body: `{ order: [{ id, sortOrder }] }` |

### Example: Create a section

```http
POST /api/locations/42/sections
Cookie: auth_token=<moderator_token>
Content-Type: application/json

{
  "type": "official_links",
  "title": "Useful Links",
  "content": {
    "links": [
      { "label": "Official website", "url": "https://www.municipality.gr" }
    ]
  },
  "isPublished": true
}
```

Response:
```json
{
  "success": true,
  "section": {
    "id": 1,
    "locationId": 42,
    "type": "official_links",
    "title": "Useful Links",
    "content": { "links": [{ "label": "Official website", "url": "https://www.municipality.gr" }] },
    "isPublished": true,
    "sortOrder": 1,
    "createdByUserId": 5,
    "updatedByUserId": 5,
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-01T10:00:00.000Z"
  }
}
```

---

## Adding a New Section Type

To extend the system with a new predefined type (e.g., `gallery`, `events`):

### 1. Add to the enum

In `src/models/LocationSection.js`, add the new value to the `SECTION_TYPES` array:

```js
const SECTION_TYPES = [
  'official_links',
  'contacts',
  'webcams',
  'announcements',
  'news_sources',
  'gallery', // new type
];
```

### 2. Add a migration

Create a new migration file (e.g., `src/migrations/YYYYMMDD-add-gallery-section-type.js`) to update the PostgreSQL enum:

```js
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_LocationSections_type" ADD VALUE IF NOT EXISTS 'gallery';
    `);
  },
  async down() { /* enum values cannot be removed in Postgres without recreating */ }
};
```

### 3. Add validation

In `src/controllers/locationSectionController.js`, add a `case 'gallery':` block inside `validateContent()` that validates the expected shape.

### 4. Add a public renderer

In `components/LocationSections.js`, add a new component (e.g., `GallerySection`) and a `case 'gallery':` entry in `SectionContent`. Also add entries to `DEFAULT_TITLES` and `SECTION_ICONS`.

### 5. Add a moderator editor

In `components/LocationSectionManager.js`, add a new editor component and a `case 'gallery':` entry in `ContentEditor`. Also add:
- `{ value: 'gallery', label: 'Gallery' }` to `SECTION_TYPES`
- A description to `SECTION_DESCRIPTIONS`
- An emoji to `SECTION_EMOJIS`
- A default `EMPTY_CONTENT.gallery` entry

### 6. Update this document

Document the new type's JSON shape in this file, following the pattern above.

---

## Validation Rules

All section content is validated server-side before saving.

| Rule | Details |
|------|---------|
| `type` must be predefined | One of: `official_links`, `contacts`, `webcams`, `announcements`, `news_sources` |
| `content` must be an object | Not null, not an array, not a string |
| All URLs must use `https://` | `http://` URLs are rejected to enforce security |
| Required string fields | See per-type tables above |
| `webcams[].embedType` | Auto-detected from URL; must be `"link"`, `"image"`, or `"iframe"` if explicitly provided |
| Date fields | `startsAt` / `endsAt` must be parseable by `Date.parse()` |
| `news_sources[].sources` | Must be a non-empty array; each entry needs `name` and `url` |

See `src/controllers/locationSectionController.js` → `validateContent()` for the authoritative implementation.

