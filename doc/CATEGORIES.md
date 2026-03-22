# Categories

The platform provides a **static Categories page** (`/categories`) that lists all content categories for Articles, News, and Polls, sourced from the committed JSON file `config/articleCategories.json`.

## Categories page

**Route:** `/categories`

The page is statically rendered at build time using Next.js App Router. It imports the JSON file at build time (no API call needed) and renders all category sections in a clean, responsive layout.

It also includes a prominent **"Suggest a category"** button that opens a pre-filled GitHub Issue in the `Antoniskp/Appofa` repository.

The page is accessible from the **Pages hub** (`/pages`) under the "Κατηγορίες" section.

## JSON file location

```
config/articleCategories.json
```

### Schema

```json
{
  "articleTypes": {
    "<key>": {
      "value": "articles",          // Internal identifier
      "label": "Articles",          // Display label (English)
      "labelEl": "Άρθρα",           // Display label (Greek)
      "description": "...",         // Short description
      "categoryRequired": false,    // Whether a category must be selected
      "categories": [               // Array of category name strings (Greek)
        "Γενικά",
        "Επιστήμη & Τεχνολογία"
      ]
    }
  },
  "pollCategories": [               // Array of category name strings for polls
    "Πολιτική & Κοινωνία"
  ]
}
```

Current `articleTypes` keys: `personal` (hidden from public page), `articles`, `news`.

## Suggesting a category

### Option A: GitHub Issue (recommended for most users)

Click **"Πρότεινε κατηγορία"** on the [Categories page](/categories) or open an issue directly:

[https://github.com/Antoniskp/Appofa/issues/new?labels=category-suggestion](https://github.com/Antoniskp/Appofa/issues/new?labels=category-suggestion)

The pre-filled issue template prompts for:
- **Proposed category name**
- **Parent group** (Articles / News / Polls, optional)
- **Description / justification**
- **Links / sources** (optional)

A maintainer will review the suggestion and apply it by editing `config/articleCategories.json` in a PR.

### Option B: Pull Request (for contributors)

1. **Fork** the [repository](https://github.com/Antoniskp/Appofa).
2. **Edit** `config/articleCategories.json`:
   - Add your category string to the appropriate `categories` array under `articleTypes.articles`, `articleTypes.news`, or `pollCategories`.
3. **Open a Pull Request** against `main` with a clear description.

Example addition to the `articles` type:

```json
"Κλίμα & Φυσικές Καταστροφές"
```

## Navigation

The Categories page is accessible from:

- **Pages hub** (`/pages`) — Listed under the "Πληροφορίες" section
