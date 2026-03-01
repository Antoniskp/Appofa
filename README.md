# News Application

A professional news application with a Node.js/Express API, PostgreSQL database, and a Next.js frontend.

## Highlights
- JWT-based authentication with role-based access control (Admin, Moderator, Editor, Viewer)
- **GitHub OAuth integration** for easy signup/login and account linking
- **Google Analytics integration** for tracking page views and custom events
- **Poll and Statistics System** with flexible answer types, voting, and Chart.js visualizations
- Profile auto-fill from GitHub profile data
- Article CRUD with news submission and moderation workflow
- Article types and categories with dependent dropdowns (Personal, Articles, News)
- Next.js App Router frontend with Tailwind CSS styling

## Documentation

### Core Documentation
- [Project Summary](doc/PROJECT_SUMMARY.md) - Holistic project overview
- [Architecture](doc/ARCHITECTURE.md) - System architecture and middleware
- [Security](doc/SECURITY.md) - Security best practices and considerations

### Features
- [Poll & Statistics System](doc/POLL_FEATURE.md) - Complete poll system with voting, results, and Chart.js visualizations
- [Locations Model](doc/LOCATION_MODEL.md) - Hierarchical locations system
- [OAuth Integration](doc/OAUTH.md) - GitHub OAuth setup and usage
- [Google Analytics](doc/GOOGLE_ANALYTICS.md) - Analytics integration guide
- [Article Types & Categories](doc/ARTICLE_TYPES_TESTING.md) - Article type system

### Deployment & Operations
- [VPS Setup Guide](doc/VPS_SETUP.md) - **Complete VPS deployment guide** (Ubuntu/Debian)
- [Deployment Guide](doc/DEPLOYMENT_GUIDE.md) - Local, Docker, and cloud platform deployments
- [Upgrade Guide](doc/UPGRADE_GUIDE.md) - Migration and upgrade instructions
- [Migrations](doc/MIGRATIONS.md) - Database migration guide
- [Node Upgrade Guide](doc/NODE_UPGRADE_VPS.md) - Node.js upgrade instructions for VPS
- [Troubleshooting](doc/TROUBLESHOOTING.md) - Common issues and solutions

### Development & Testing
- [API Testing Examples](doc/API_TESTING.md) - API usage and testing
- [Poll Testing](doc/POLL_TESTING.md) - Poll system testing checklist
- [Copilot Agents](doc/COPILOT_AGENTS.md) - AI agent configuration
- [Postman Collection](postman_collection.json) - API testing collection

## Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm

## Quick Start
```bash
git clone https://github.com/Antoniskp/appofasiv8.git
cd appofasiv8
npm install
cp .env.example .env
```

Update `.env` with your database credentials and JWT secret.

### Optional: Configure GitHub OAuth
To enable GitHub OAuth for social login:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to `http://localhost:3000/api/auth/github/callback`
4. Add the credentials to your `.env`:
   ```
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
   FRONTEND_URL=http://localhost:3001
   ```

### Optional: Configure Google Analytics
To enable Google Analytics tracking:
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property or use an existing one
3. Get your Measurement ID (format: G-XXXXXXXXXX)
4. Add the measurement ID to your `.env`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

The application will automatically track page views and provides utilities for tracking custom events.

### SEO Configuration

The application includes built-in SEO support: `robots.txt`, dynamic `sitemap.xml`, canonical URLs, OpenGraph/Twitter meta tags, and JSON-LD structured data.

#### Canonical Base URL (`SITE_URL`)

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

#### Sitemap Generation (`/sitemap.xml`)

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

#### robots.txt (`/robots.txt`)

Served automatically by Next.js from `app/robots.js`. Allows all crawlers and references the sitemap URL.

To verify:
```bash
curl http://localhost:3001/robots.txt
```

#### OpenGraph / Twitter Meta Tags

Meta tags are injected server-side for all pages:
- **Home page**: Uses site-level defaults from `app/layout.js`
- **Article/News detail pages**: Uses article-specific title, description, image, and canonical URL

#### JSON-LD Structured Data

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

### Start the Application
Start the API:
```bash
npm run dev
```

Start the frontend in another terminal:
```bash
npm run frontend
```

Optional: seed the database (see [Project Summary](doc/PROJECT_SUMMARY.md) for sample accounts):
```bash
npm run seed
```

## Scripts
```bash
npm run dev                  # API server (development)
npm start                    # API server (production)
npm run frontend             # Next.js dev server (port 3001)
npm run frontend:build       # Next.js production build
npm run frontend:start       # Next.js production server
npm test                     # Jest tests
npm run lint                 # ESLint static analysis
npm run seed                 # Seed database with sample data
npm run migrate:article-types # Migrate existing articles to new type field
```

## Dependency Management

See [docs/dependency-updates.md](docs/dependency-updates.md) for guidance on updating dependencies,
running security audits (`npm audit`), and the history of significant dependency upgrades.

## License

Copyright (c) 2026 Antoniskp. All Rights Reserved.

This repository is made publicly available for transparency, audit, and contributions only. See the [LICENSE](LICENSE) file for details.

**Note**: No license is granted to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of this software without explicit permission.

## Author
Antoniskp
