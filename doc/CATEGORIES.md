# Categories

The platform provides a **static Categories page** (`/categories`) that lists all content categories for Articles, News, and Polls, sourced from a committed JSON file.

## Categories page

**Route:** `/categories`

The page is statically rendered at build time using Next.js App Router. It imports the JSON file at build time (no API call needed) and renders all category groups in a clean, responsive grid.

It also includes a prominent **"Suggest a category"** button that opens a pre-filled GitHub Issue in the `Antoniskp/Appofa` repository.

## JSON file location

```
src/data/categories.json
```

### Schema

```
{
  "version": "1.0",          // Schema version string
  "description": "...",      // Human-readable schema description
  "groups": [                // Array of category groups
    {
      "id": "articles",      // Unique identifier (snake_case)
      "label": "Άρθρα",      // Display label (Greek)
      "labelEn": "Articles", // Display label (English)
      "description": "...",  // Short description of the group
      "icon": "✍️",          // Emoji icon for visual identification
      "categories": [        // Array of categories in this group
        {
          "id": "articles-general",  // Unique identifier (group-name format)
          "label": "Γενικά",         // Display label
          "description": "...",      // Optional longer description
          "parentId": null           // Optional: ID of a parent category
        }
      ]
    }
  ]
}
```

Current groups: `articles`, `news`, `polls`.

## Suggesting a category

### Option A: GitHub Issue (recommended for most users)

Click **"Πρότεινε κατηγορία"** on the [Categories page](/categories) or open an issue directly:

[https://github.com/Antoniskp/Appofa/issues/new?labels=category-suggestion](https://github.com/Antoniskp/Appofa/issues/new?labels=category-suggestion)

The pre-filled issue template prompts for:
- **Proposed category name**
- **Parent group** (Articles / News / Polls, optional)
- **Description / justification**
- **Links / sources** (optional)

A maintainer will review the suggestion and apply it by editing `src/data/categories.json` in a PR.

### Option B: Pull Request (for contributors)

1. **Fork** the [repository](https://github.com/Antoniskp/Appofa).
2. **Edit** `src/data/categories.json`:
   - Add your category object to the appropriate `categories` array inside the relevant `group`.
   - Follow the existing schema (see above).
   - Give the category a unique `id` following the `<group>-<name>` convention (e.g., `articles-climate`).
3. **Open a Pull Request** against `main` with a clear description.

Example addition to the `articles` group:

```json
{
  "id": "articles-climate",
  "label": "Κλίμα & Φυσικές Καταστροφές"
}
```

## Navigation

The Categories page is accessible from:

- **Top navigation bar** — "Κατηγορίες" link (desktop and mobile)
- **Pages hub** (`/pages`) — Listed under the "Κατηγορίες" section
