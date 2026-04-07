# Copilot Instructions — Appofa

<!-- AI SELF-UPDATE RULE
After completing ANY task that changes conventions, patterns, file structure,
models, routes, pages, components, or dependencies in this repository,
UPDATE this file and doc/REPOSITORY_MAP.md to reflect the changes.
This instruction is permanent and must never be removed.
-->

## Project at a Glance

- **App**: Greek civic-engagement platform — articles, polls, suggestions, dream-team formations, person profiles, manifests
- **Stack**: Express 5 + Sequelize 6 (PostgreSQL) · Next.js 16 (App Router) + React 19 + Tailwind CSS 3
- **Auth**: JWT in HttpOnly cookies · CSRF double-submit · Roles: `admin`, `moderator`, `editor`, `viewer`
- **Node.js**: v22+
- **Live**: https://appofasi.gr

## Key Conventions

### Backend (`src/`)
- **Route chain**: rateLimiter → authMiddleware → csrfProtection → controller
- **Controller pattern**: validate → authorize → business logic → `{ success, data/message }`
- **Service layer**: `src/services/` — complex logic extracted from controllers
- **Errors**: `{ success: false, message }` — never leak stack traces in production
- **Migrations**: timestamp-prefixed `YYYYMMDDHHMMSS-name.js`, dialect-aware (ENUM for postgres, STRING for sqlite)

### Frontend (`app/`, `components/`, `lib/`)
- **Data fetching**: always use `useAsyncData` hook — never bare `useEffect` + `fetch`
- **API calls**: always through `lib/api/` modules — never direct `fetch()`
- **Loading**: show `<SkeletonLoader>` immediately; `<AlertMessage>` on error
- **Auth**: use `useAuth` from `lib/auth-context.js`
- **Components**: PascalCase · Hooks: `useHookName` · Utils: camelCase · Constants: UPPER_SNAKE_CASE
- **Client components**: `'use client'` only when needed (state, effects, event handlers, browser APIs)

### Security (always applied)
- `authMiddleware` on protected routes · `checkRole([...])` for role-gated routes
- `csrfProtection` on all POST/PUT/DELETE · `optionalAuthMiddleware` for public routes needing user context
- Rate limiters: `authLimiter` (5/15m), `createLimiter` (20/15m), `apiLimiter` (100/15m)

### Testing
- Jest + Supertest · SQLite in-memory for tests · `sequelize.sync({ force: true })` in `beforeAll`
- Run: `npm test` (all) · `npm test -- <file>` (specific)

### Anti-patterns to Avoid
- ❌ Direct `fetch()` in components → ✅ Use `lib/api/` methods
- ❌ Bare `useEffect` + fetch → ✅ Use `useAsyncData`
- ❌ Missing loading/error states → ✅ Always render `<SkeletonLoader>` + `<AlertMessage>`
- ❌ Skip CSRF/auth middleware → ✅ Full route chain always
- ❌ Leaking stack traces → ✅ Generic error messages in production

## Living Documentation

For the **complete codebase map** (all models, routes, pages, components, migrations):
→ Read **[doc/REPOSITORY_MAP.md](../doc/REPOSITORY_MAP.md)**

For the **full AI instructions** (coding standards, workflows, checklists):
→ Read **[AI_INSTRUCTIONS.md](../AI_INSTRUCTIONS.md)**

For **feature-specific docs**:
→ See **[doc/INDEX.md](../doc/INDEX.md)**

## Commands

```bash
npm install               # Install deps
npm run dev               # Backend dev server
npm run frontend          # Frontend dev server (port 3001)
npm test                  # Run all tests
npm run lint              # ESLint (src/)
npm run frontend:build    # Build frontend
npm run migrate           # Run DB migrations
npm run seed              # Seed initial data
```

## Post-Task Checklist

After completing any task, review and update if needed:
- [ ] This file (`.github/copilot-instructions.md`) — if conventions or patterns changed
- [ ] `doc/REPOSITORY_MAP.md` — if models, routes, pages, components, or migrations changed
- [ ] `AI_INSTRUCTIONS.md` — if coding standards, API modules, or workflows changed
- [ ] Feature-specific `doc/*.md` — if a feature was added or modified
