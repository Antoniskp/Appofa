# News Application

A professional news application with a Node.js/Express API, PostgreSQL database, and a Next.js frontend.

## Highlights
- JWT-based authentication with role-based access control (Admin, Moderator, Editor, Viewer)
- **GitHub OAuth integration** for easy signup/login and account linking
- **Google Analytics integration** for tracking page views and custom events
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
- [Locations Model](doc/LOCATION_MODEL.md) - Hierarchical locations system
- [OAuth Integration](doc/OAUTH.md) - GitHub OAuth setup and usage
- [Google Analytics](doc/GOOGLE_ANALYTICS.md) - Analytics integration guide
- [Article Types & Categories](doc/ARTICLE_TYPES_TESTING.md) - Article type system

### Deployment & Operations
- [Deployment Guide](doc/DEPLOYMENT.md) - General deployment instructions
- [VPS Deployment](doc/VPS_DEPLOYMENT.md) - VPS-specific deployment guide
- [Upgrade Guide](doc/UPGRADE_GUIDE.md) - Migration and upgrade instructions
- [Migrations](doc/MIGRATIONS.md) - Database migration guide
- [Troubleshooting](doc/TROUBLESHOOTING.md) - Common issues and solutions

### Development
- [API Testing Examples](doc/API_TESTING.md) - API usage and testing
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
npm run seed                 # Seed database with sample data
npm run migrate:article-types # Migrate existing articles to new type field
```

## License

Copyright (c) 2026 Antoniskp. All Rights Reserved.

This repository is made publicly available for transparency, audit, and contributions only. See the [LICENSE](LICENSE) file for details.

**Note**: No license is granted to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of this software without explicit permission.

## Author
Antoniskp
