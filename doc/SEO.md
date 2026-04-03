# SEO Configuration

The application includes built-in SEO support: `robots.txt`, dynamic `sitemap.xml`, canonical URLs, OpenGraph/Twitter meta tags, and JSON-LD structured data.

## Canonical Base URL (`SITE_URL`)

Set the `SITE_URL` environment variable to your production domain. It defaults to `https://appofasi.gr` if not set.

```
SITE_URL=https://appofasi.gr
```

This value is used in:
- `/robots.txt` – Sitemap reference URL
- `/sitemap.xml` – All canonical URLs in the sitemap
- Page `<link rel="canonical">` tags
- OpenGraph `og:url` and Twitter card meta tags
- JSON-LD structured data

## Sitemap Generation (`/sitemap.xml`)

The sitemap is generated dynamically by the Next.js frontend at runtime. It:
- Includes core static routes: `/`, `/news`, `/articles`, `/polls`
- Fetches all published articles from the Express API and adds their canonical slug URLs
- Revalidates every hour (configurable in `app/sitemap.js`)

To verify the sitemap is working correctly:
```bash
# In development (frontend on port 3001)
curl http://localhost:3001/sitemap.xml

# In production
curl https://appofasi.gr/sitemap.xml
```

## robots.txt (`/robots.txt`)

Served automatically by Next.js from `app/robots.js`. Allows all crawlers and references the sitemap URL.

To verify:
```bash
curl http://localhost:3001/robots.txt
```

## OpenGraph / Twitter Meta Tags

Meta tags are injected server-side for all pages:
- **Home page**: Uses site-level defaults from `app/layout.js`
- **Article/News detail pages**: Uses article-specific title, description, image, and canonical URL

## JSON-LD Structured Data

Article and news detail pages include JSON-LD (`schema.org/Article` and `schema.org/NewsArticle`) with:
- `headline`, `description`, `image`
- `datePublished`, `dateModified`
- `author` (if not anonymous)
- `url`, `mainEntityOfPage`

To verify JSON-LD on an article page:
```bash
# Fetch the HTML and look for the script tag
curl http://localhost:3001/news/1-sample-article | grep -A5 'application/ld+json'
```
