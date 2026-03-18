# Location Sections

Location Sections allow moderators and admins to add rich, structured "extra information" to any location page — beyond the core fields (name, coordinates, Wikipedia data, etc.).

Sections are **predefined by type**, so they remain structured and secure while still giving moderators flexibility to describe official websites, contacts, important people, webcams, and announcements.

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

### 3. `people` — Important People

Key figures associated with the location: mayor, prime minister, regional governor, etc.

```json
{
  "people": [
    {
      "name": "Jane Doe",
      "role": "Mayor",
      "websiteUrl": "https://janedoe.gr",
      "photoUrl": "https://cdn.example.com/janedoe.jpg"
    },
    {
      "name": "John Smith",
      "role": "Regional Governor"
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `people` | array | ✅ | Array of person objects |
| `people[].name` | string | ✅ | Full name |
| `people[].role` | string | ✅ | Official title or role |
| `people[].websiteUrl` | string | ❌ | Must start with `https://` if provided |
| `people[].photoUrl` | string | ❌ | Must start with `https://` if provided |

---

### 4. `webcams` — Webcams

Live camera feeds for the location. Three embed strategies are supported:

- `"link"` — A simple link, opens in new tab (safest, always works)
- `"image"` — Rendered as a `<img>` tag (for MJPEG stills/refreshing images)
- `"iframe"` — Rendered in a sandboxed `<iframe>` (for interactive streams)

```json
{
  "webcams": [
    {
      "label": "Town square",
      "url": "https://webcam.municipality.gr/live",
      "embedType": "iframe"
    },
    {
      "label": "Harbour view",
      "url": "https://cam.example.com/harbour.jpg",
      "embedType": "image"
    },
    {
      "label": "Mountain cam",
      "url": "https://cam.example.com/mountain",
      "embedType": "link"
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `webcams` | array | ✅ | Array of webcam objects |
| `webcams[].label` | string | ✅ | Human-readable label |
| `webcams[].url` | string | ✅ | Must start with `https://` |
| `webcams[].embedType` | string | ❌ | `"link"` (default), `"image"`, or `"iframe"` |

> **Security note:** `iframe` embeds use `sandbox="allow-scripts allow-same-origin"` to limit risk. Arbitrary HTML is never allowed.

---

### 5. `announcements` — Announcements

Time-limited notices or alerts for the location. Items with an `endsAt` date in the past are automatically hidden on the public page.

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
      "priority": 2
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `items` | array | ✅ | Array of announcement objects |
| `items[].title` | string | ✅ | Short heading |
| `items[].body` | string | ❌ | Optional longer description |
| `items[].startsAt` | ISO date string | ❌ | Display start date |
| `items[].endsAt` | ISO date string | ❌ | Items past this date are hidden publicly |
| `items[].linkUrl` | string | ❌ | Must start with `https://` if provided |
| `items[].priority` | integer 0–10 | ❌ | Higher = shown first; ≥5 displayed in red, ≥3 in yellow |

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
| **Add Section** | Choose a type, fill in the content form, optionally set a title override, and save |
| **Edit** | Click the pencil icon on any section row to edit its content, title, and published status |
| **Publish / Unpublish** | Click the eye icon to toggle visibility. Draft sections are shown only to moderators/admins |
| **Reorder** | Use the ▲ / ▼ arrows on each row to change display order |
| **Delete** | Click the trash icon; a confirmation prompt will appear |

### Draft vs Published

- **Draft** (`isPublished: false`): visible only to moderators/admins via the manager. Not shown on the public page.
- **Published** (`isPublished: true`): shown on the public location page in `sortOrder`.

---

## Public Rendering

Sections are rendered on the public location page (`/locations/<slug>`) between the compact location header and the tabbed content area (Polls / News / Articles / Users).

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
  'people',
  'webcams',
  'announcements',
  'gallery', // new type
];
```

### 2. Add a migration

Create a new migration file (e.g., `src/migrations/027-add-gallery-section-type.js`) to update the PostgreSQL enum:

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

In `components/LocationSections.js`, add a new component (e.g., `GallerySection`) and a `case 'gallery':` entry in `SectionContent`.

### 5. Add a moderator editor

In `components/LocationSectionManager.js`, add a new editor component and a `case 'gallery':` entry in `ContentEditor`. Also add a default `EMPTY_CONTENT.gallery` entry.

### 6. Update this document

Document the new type's JSON shape in this file, following the pattern above.

---

## Validation Rules

All section content is validated server-side before saving.

| Rule | Details |
|------|---------|
| `type` must be predefined | One of: `official_links`, `contacts`, `people`, `webcams`, `announcements` |
| `content` must be an object | Not null, not an array, not a string |
| All URLs must use `https://` | `http://` URLs are rejected to enforce security |
| Required string fields | See per-type tables above |
| `webcams[].embedType` | Must be `"link"`, `"image"`, or `"iframe"` if specified |
| Date fields | `startsAt` / `endsAt` must be parseable by `Date.parse()` |

See `src/controllers/locationSectionController.js` → `validateContent()` for the authoritative implementation.
