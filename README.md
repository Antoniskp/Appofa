# News Application

A professional news application with a Node.js/Express API, PostgreSQL database, and a Next.js frontend.

## Highlights
- JWT-based authentication with role-based access control (Admin, Moderator, Editor, Viewer)
- Article CRUD with news submission and moderation workflow
- Next.js App Router frontend with Tailwind CSS styling

## Documentation
- [Project Summary](doc/PROJECT_SUMMARY.md)
- [Architecture](doc/ARCHITECTURE.md)
- [Security](doc/SECURITY.md)
- [Deployment](doc/DEPLOYMENT.md)
- [VPS Deployment](doc/VPS_DEPLOYMENT.md)
- [API Testing Examples](doc/API_TESTING.md)
- [Troubleshooting](doc/TROUBLESHOOTING.md)
- [Postman Collection](postman_collection.json)

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

Update `.env` with your database credentials and JWT secret, then start the API:
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
npm run dev            # API server (development)
npm start              # API server (production)
npm run frontend       # Next.js dev server (port 3001)
npm run frontend:build # Next.js production build
npm run frontend:start # Next.js production server
npm test               # Jest tests
```

## License
ISC

## Author
Antoniskp
