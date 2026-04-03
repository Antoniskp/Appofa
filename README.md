# News Application

A professional news application with a Node.js/Express API, PostgreSQL database, and a Next.js frontend.

## Highlights
- JWT-based authentication with role-based access control (Admin, Moderator, Editor, Viewer)
- **GitHub OAuth integration** for easy signup/login and account linking
- **Google Analytics integration** for tracking page views and custom events
- **Poll and Statistics System** with flexible answer types, voting, Chart.js visualizations, and auditable JSON export
- **Suggestions & Solutions System** – post ideas/problems for locations, propose solutions, upvote/downvote both
- **Message system** for user-to-user communication
- **Video Embeds** – paste a YouTube or TikTok URL into any Article/News/Personal post to embed it with auto-filled title
- **Fast Video Post** – ultra-fast `/videos/new` page: paste a URL, auto-fill metadata, publish in seconds
- Profile auto-fill from GitHub profile data
- Article CRUD with news submission and moderation workflow
- Article types and categories with dependent dropdowns (Personal, Articles, News, Video)
- **Static Categories page** (`/categories`) with JSON-driven category list and GitHub-based suggestion flow
- Hierarchical location system (International, Country, Prefecture, Municipality)
- Next.js App Router frontend with Tailwind CSS styling

## Documentation

See [doc/INDEX.md](doc/INDEX.md) for the full documentation index.

### Core Documentation
- [Project Summary](doc/PROJECT_SUMMARY.md) - Holistic project overview
- [Architecture](doc/ARCHITECTURE.md) - System architecture and middleware
- [Security](doc/SECURITY.md) - Security best practices and considerations
- [Contributing](doc/CONTRIBUTING.md) - How to contribute to the project

### Features
- [Poll & Statistics System](doc/POLL_FEATURE.md) - Complete poll system with voting, results, and Chart.js visualizations
- [Poll Audit Export](doc/POLL_EXPORT_AUDIT.md) - Privacy-preserving poll data export
- [Suggestions & Solutions](doc/SUGGESTIONS_FEATURE.md) - Idea/problem submission with upvote/downvote voting
- [Video Embeds](doc/VIDEO_EMBEDS.md) - Embed YouTube/TikTok videos in articles via URL paste
- [Fast Video Post](doc/FAST_VIDEO_POST.md) - One-paste video posting at `/videos/new`
- [Locations Model](doc/LOCATION_MODEL.md) - Hierarchical locations system
- [Location Sections](doc/LOCATION_SECTIONS.md) - Location section types, JSON shapes, and moderator management
- [OAuth Integration](doc/OAUTH.md) - GitHub OAuth setup and usage
- [Google Analytics](doc/GOOGLE_ANALYTICS.md) - Analytics integration guide
- [Article Types & Categories](doc/ARTICLE_TYPES_TESTING.md) - Article type system
- [Categories](doc/CATEGORIES.md) - Static categories page, JSON schema, and how to suggest or submit category changes
- [Message System](doc/MESSAGE_SYSTEM_IMPLEMENTATION.md) - User messaging feature
- [SEO](doc/SEO.md) - SEO configuration: sitemap, robots.txt, OpenGraph, and JSON-LD structured data

### Deployment & Operations
- [Deployment](DEPLOYMENT.md) - **Pointer to VPS_SETUP.md** (Nginx config, deployment process, port layout, build artifact notes)
- [VPS Setup Guide](doc/VPS_SETUP.md) - **Complete VPS deployment guide** (Ubuntu/Debian)
- [Deployment Guide](doc/DEPLOYMENT_GUIDE.md) - Local, Docker, and cloud platform deployments
- [Upgrade Guide](doc/UPGRADE_GUIDE.md) - Migration and upgrade instructions
- [Migration Guide](doc/MIGRATION_GUIDE.md) - Google OAuth migration guide
- [Migrations](doc/MIGRATIONS.md) - Database migration reference
- [Node Upgrade Guide](doc/NODE_UPGRADE_VPS.md) - Node.js upgrade instructions for VPS
- [Troubleshooting](doc/TROUBLESHOOTING.md) - Common issues and solutions

### Development & Testing
- [API Testing Examples](doc/API_TESTING.md) - API usage and testing with curl
- [Poll Testing](doc/POLL_TESTING.md) - Poll system testing checklist
- [Message System Testing](doc/MESSAGE_SYSTEM_TESTING.md) - Message system testing guide
- [Article Types Testing](doc/ARTICLE_TYPES_TESTING.md) - Article type system testing
- [Dependency Updates](doc/DEPENDENCY_UPDATES.md) - Dependency management and security audits
- [Copilot Agents](doc/COPILOT_AGENTS.md) - AI agent configuration
- [Postman Collection](doc/postman_collection.json) - API testing collection

## Prerequisites
- Node.js 22+
- PostgreSQL 12+
- npm 10+

## Quick Start
```bash
git clone https://github.com/Antoniskp/Appofa.git
cd Appofa
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

See [doc/SEO.md](doc/SEO.md) for full configuration details including the `SITE_URL` environment variable, sitemap generation, and JSON-LD structured data.

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

## Categories

The `/categories` page lists all platform content categories (Articles, News, Polls), rendered statically from [`config/articleCategories.json`](config/articleCategories.json). The page is accessible from the **Pages hub** (`/pages`).

**Suggest a new category** — open a pre-filled GitHub Issue:
[https://github.com/Antoniskp/Appofa/issues/new?labels=category-suggestion](https://github.com/Antoniskp/Appofa/issues/new?labels=category-suggestion)

**Submit a change directly** — fork the repo, edit `config/articleCategories.json`, and open a Pull Request. See [doc/CATEGORIES.md](doc/CATEGORIES.md) for the full schema description and contribution guide.

## Scripts
```bash
npm run dev                   # API server (development, with auto-reload)
npm start                     # API server (production)
npm run frontend              # Next.js dev server (port 3001)
npm run frontend:build        # Next.js production build
npm run frontend:start        # Next.js production server
npm test                      # Jest tests with coverage
npm run lint                  # ESLint static analysis
npm run seed                  # Seed database with sample data
npm run seed:locations        # Seed database with location hierarchy
npm run migrate               # Run all pending migrations
npm run migrate:up            # Apply next pending migration
npm run migrate:down          # Rollback last migration
npm run migrate:status        # Show migration status
npm run migrate:article-types # Migrate existing articles to the new type field
```

## Dependency Management

See [doc/DEPENDENCY_UPDATES.md](doc/DEPENDENCY_UPDATES.md) for guidance on updating dependencies,
running security audits (`npm audit`), and the history of significant dependency upgrades.

## License

Copyright (c) 2026 Antoniskp. All Rights Reserved.

This repository is made publicly available for transparency, audit, and contributions only. See the [LICENSE](LICENSE) file for details.

**Note**: No license is granted to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of this software without explicit permission.

## Author
Antoniskp
