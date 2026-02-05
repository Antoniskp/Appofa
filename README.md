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
- [Project Summary](doc/PROJECT_SUMMARY.md)
- [Architecture](doc/ARCHITECTURE.md)
- [Security](doc/SECURITY.md)
- [Deployment](doc/DEPLOYMENT.md)
- [VPS Deployment](doc/VPS_DEPLOYMENT.md)
- [API Testing Examples](doc/API_TESTING.md)
- [Article Types & Categories Testing](doc/ARTICLE_TYPES_TESTING.md)
- [Troubleshooting](doc/TROUBLESHOOTING.md)
- [Postman Collection](postman_collection.json)
- [Copilot Agents](doc/COPILOT_AGENTS.md)

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
ISC

## Author
Antoniskp
