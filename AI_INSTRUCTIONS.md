# AI Project Instructions

## Section 1: Project Overview

### Project Summary
- News application — Node.js/Express backend, Next.js frontend, PostgreSQL via Sequelize ORM
- Authentication: JWT with HttpOnly cookies + bcryptjs
- Node.js v22+ required

### Technology Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 16.x (App Router), React 19.x, Tailwind CSS |
| Backend | Express 5.x, Sequelize ORM |
| Database | PostgreSQL (production), SQLite (tests) |
| Testing | Jest |

### Key Architectural Decisions
- Next.js App Router with `'use client'` / server component separation
- Centralized API client (`lib/api/` directory, barrel-exported via `lib/api/index.js`) with automatic CSRF injection
- Middleware chains: CSRF → Auth → Rate Limiting
- Role-based access control: `admin`, `moderator`, `editor`, `viewer`
- Hierarchical location system with polymorphic relationships

### Key Documentation
- **README.md** — Setup and API overview
- **doc/ARCHITECTURE.md** — System architecture and middleware stack
- **doc/SECURITY.md** — Security guidelines
- **doc/DEPLOYMENT_GUIDE.md** / **doc/VPS_SETUP.md** — Deployment guides
- **doc/LOCATION_MODEL.md** — Location feature details
- **doc/API_TESTING.md** — API testing guide
- **doc/PROJECT_SUMMARY.md** — Holistic overview

### Live Demo
https://appofasi.gr

---

## Section 2: Development Principles

### Reusable Components (`components/`)
- **ArticleCard** — Article display with `grid`/`list` variants
- **AlertMessage** — Error/success messages with tone variants (`error`, `success`)
- **EmptyState** — Empty/error states with optional action button
- **SkeletonLoader** — Loading placeholders matching ArticleCard variants
- **LocationSelector** — Location picker with search and filtering
- **ProtectedRoute** — Auth/role guard wrapper for pages
- **AdminTable** — Reusable admin data table
- **Pagination** — Pagination controls

### Custom Hooks (`hooks/`)
- **useAsyncData** — Async data fetching with loading/error/refetch; prevents memory leaks
- **useFilters** — Filter + pagination state management for list pages
- **useAuth** (via `lib/auth-context.js`) — Auth state and methods

### Shared Utilities
- **lib/api/index.js** — Centralized API client (CSRF, error handling, response transformation; barrel-exports all domain modules)
- **lib/utils/articleTypes.js** — Article type/category helpers
- **lib/auth-context.js** — Auth context provider
- **config/articleCategories.json** — Article type/category configuration

### Client vs Server Components
Use `'use client'` for state, effects, event handlers, browser APIs, or context consumers. Prefer server components for static content and SEO-critical rendering.

---

## Section 3: Coding Standards

### Frontend
- Structure: state → hooks → useEffect → handlers → conditional render (loading/error) → JSX
- Use `useAsyncData` (never bare `useEffect` + `fetch`) for all data fetching
- Use `useAuth` from `lib/auth-context.js`; never duplicate auth logic
- Reference: `app/articles/page.js`, `app/admin/page.js`

### Backend
- Controllers: validate → authorize → business logic → standardised response
- Success: `{ success: true, data: ..., message: "..." }` with 2xx status
- Error: `{ success: false, message: "..." }` — never leak stack traces in production
- Routes: rate limiter → authMiddleware → csrfProtection → controller
- Articles/news: use `Article.type` as source-of-truth (`type === 'news'`); `isNews` is deprecated/removed
- Reference: `src/controllers/articleController.js`, `src/routes/articles.js`

### Naming
- Components: PascalCase | Hooks: `useHookName` | Utilities: camelCase | Constants: UPPER_SNAKE_CASE

---

## Section 4: Component Reusability Guidelines

✅ **Create reusable component when:** pattern appears 2+ times, logic is complex/testable, UI is consistent across pages.
❌ **Don't create one when:** used only once, highly page-specific, would require too many props.

### Anti-patterns to Avoid
- ❌ Duplicate form logic across create/edit pages → ✅ Use `ArticleForm` with a `mode` prop
- ❌ Inline `useEffect` + `fetch` → ✅ Use `useAsyncData`
- ❌ Direct `fetch()` calls → ✅ Use `lib/api/index.js` methods
- ❌ Missing loading/error states → ✅ Always render `<SkeletonLoader>` and `<AlertMessage>`

---

## Section 5: API Integration Patterns

**Always use `lib/api/index.js`** — never call `fetch()` directly in components.

### Available API Modules
| Module | Key Methods |
|---|---|
| `authAPI` | `register`, `login`, `logout`, `getProfile`, `updateProfile`, `updatePassword` |
| `articleAPI` | `getAll(params)`, `getById`, `create`, `update`, `delete`, `approveNews` |
| `locationAPI` | `getAll(params)`, `getById`, `create`, `update`, `delete`, `search` |
| `adminAPI` | `getUsers`, `updateUserRole`, `deleteUser` |
| `bookmarkAPI` | Bookmark management |
| `personAPI` | Person profiles and claims |
| `commentAPI` | Article/news comments |
| `dreamTeamAPI` | Dream team nominations |
| `endorsementAPI` | User endorsements |
| `heroSettingsAPI` | Hero section settings |
| `linkPreviewAPI` | Link metadata preview |
| `messageAPI` | User-to-user messages |
| `personRemovalRequestAPI` | Person removal requests |
| `personAPI` | Public person profiles |
| `pollAPI` | Poll CRUD and voting |
| `reportAPI` | Content reports |
| `statsAPI` | Community statistics |
| `suggestionAPI` | Suggestions and solutions |
| `tagAPI` | Tag management and suggestions |

### Error Handling
Wrap API calls in `try/catch`. On error, set error string in state and show `<AlertMessage tone="error">`. Always use `finally` to clear loading state. See any page in `app/` for reference.

---

## Section 6: Testing Patterns

### Test File Locations
```
__tests__/
├── components/     # ArticleCard, ConfirmDialog, etc.
├── hooks/          # useAsyncData, useFilters
├── api/            # API integration tests
├── security/       # CSRF, OAuth
└── migrations/
```

### Requirements Checklist
**New API endpoints must cover:**
- ✅ Successful requests with valid data
- ✅ Authentication/authorization checks
- ✅ Validation errors with invalid data
- ✅ Edge cases and error handling

**Component tests must verify:**
- ✅ Rendering with different props
- ✅ User interactions and state changes
- ✅ Error states

### Test Commands
```bash
npm test                         # All tests
npm test -- ArticleCard.test.js  # Specific file
npm test -- --coverage           # With coverage
```
Use `supertest` for API tests. See `__tests__/api/api.test.js` for the established pattern.

---

## Section 7: Security Checklist

### Authentication & Authorization
✅ Use `authMiddleware` for protected routes
✅ Use `checkRole(['admin'])` for admin-only routes
✅ Use `optionalAuthMiddleware` for public routes needing auth context
✅ Verify resource ownership before modifications
✅ Never expose passwords or sensitive tokens in responses

### Input Validation
✅ Validate all user input on the backend
✅ Sanitize inputs to prevent injection (Sequelize parameterized queries handle SQL)
✅ Validate file uploads (type, size, content)
✅ Use generic error messages — don't leak system info

### CSRF Protection
✅ Apply `csrfProtection` middleware on all POST/PUT/DELETE endpoints
✅ Frontend API client injects CSRF token automatically
✅ Never disable CSRF without a security review

### Rate Limiting
✅ `authLimiter` (5 req/15 min) — login, registration
✅ `createLimiter` (20 req/15 min) — create operations
✅ `apiLimiter` (100 req/15 min) — general API calls

### Data Protection
✅ Never log passwords, tokens, or personal info
✅ Use HTTPS in production; HttpOnly cookies for JWT
✅ Don't expose stack traces in production responses

**See:** `doc/SECURITY.md` for full details.

---

## Section 8: Performance Best Practices

### Frontend
- ✅ Use `useAsyncData` — handles cleanup, prevents memory leaks
- ✅ Show `<SkeletonLoader>` immediately; prefer skeleton screens over spinners
- ✅ Paginate large lists with `<Pagination>` + `useFilters`
- ✅ Use `React.memo` and `useCallback` to avoid unnecessary re-renders
- ✅ Lazy-load heavy components with Next.js `dynamic()`

### Backend
- ✅ Use Sequelize `include` (eager loading) to avoid N+1 queries
- ✅ Always paginate large result sets (`limit` + `offset`)
- ✅ Rely on Sequelize connection pooling (already configured)
- ✅ Add DB indexes for frequently queried fields (see models for existing indexes)

---

## Section 9: Accessibility Requirements

✅ Use semantic HTML (`<article>`, `<header>`, `<nav>`, `<main>`, `<footer>`) — not generic `<div>`
✅ Add `aria-label` + `title` to icon-only buttons
✅ All interactive elements must be keyboard accessible with visible focus indicators
✅ Maintain logical tab order; support Esc to close modals
✅ Minimum 4.5:1 contrast ratio for text; don't rely solely on colour
✅ Use `role="status"` + `aria-live="polite"` for loading/error announcements
✅ Associate `<label htmlFor>` with every input; use `aria-required`, `aria-invalid`, `role="alert"` on validation errors

---

## Section 10: File Organization

### Backend (`src/`)
```
src/
├── controllers/   # articleController.js, authController.js, locationController.js, adminController.js
├── models/        # Article.js, User.js, Location.js, LocationLink.js, index.js
├── routes/        # articles.js, auth.js, locations.js, admin.js
├── middleware/    # auth.js, csrfProtection.js, checkRole.js, rateLimiter.js, optionalAuth.js
├── migrations/    # YYYYMMDDHHMMSS-name.js
├── config/        # database.js, securityHeaders.js
├── utils/
└── index.js
```

### Frontend
```
app/               # Next.js App Router pages
├── page.js                    # Home (/)
├── articles/                  # list, [id], create, edit/[id]
├── admin/                     # dashboard, users/, locations/
└── auth/                      # login/, register/

components/        # ArticleCard, AlertMessage, EmptyState, SkeletonLoader,
                   # LocationSelector, ProtectedRoute, Pagination, AdminTable, …
lib/               # api/ (modules + index.js), auth-context.js, utils/articleTypes.js
hooks/             # useAsyncData.js, useFilters.js
config/            # articleCategories.json
__tests__/         # components/, hooks/, api/, security/, migrations/
```

---

## Section 11: Common Workflows

### Adding a New Page
1. Create `app/[route]/page.js` with `'use client'` directive
2. Fetch data with `useAsyncData`; show `<SkeletonLoader>` while loading, `<AlertMessage>` on error
3. Add to navigation if needed
4. Test loading, error, and success states

### Adding a New API Endpoint
1. **Route** — `src/routes/`: apply rate limiter → auth → CSRF → controller
2. **Controller** — `src/controllers/`: validate → authorize → logic → `{ success, data }`
3. **API client** — add method to the appropriate `lib/api/` module using the `apiRequest` helper
4. **Tests** — `__tests__/api/`: cover success, auth failure, and validation error
5. **Docs** — update `README.md` or relevant `doc/` file for public-facing endpoints

### Creating a Reusable Component
1. Identify repeated pattern across 2+ pages
2. Extract to `components/ComponentName.js` with a minimal props interface
3. Document props with JSDoc comments
4. Replace inline usages; add test in `__tests__/components/`

### Adding a Custom Hook
1. Create `hooks/useMyHook.js` — follow `hooks/useAsyncData.js` as a model
2. Write tests in `__tests__/hooks/`
3. Add JSDoc usage comment

---

## Section 12: Key Features Architecture

### Locations Feature
- Hierarchy: Country → Prefecture → Municipality
- Polymorphic links to articles and users via `LocationLink`
- Files: `src/models/Location.js`, `LocationLink.js`, `components/ui/LocationSelector.js`, `lib/api/index.js` (`locationAPI`)
- See `doc/LOCATION_MODEL.md`

### Article System
- **Types**: `personal` (creator-only) · `articles` (public educational) · `news` (requires admin approval)
- **Statuses**: `draft` · `published` · `archived`
- Categories defined in `config/articleCategories.json` (bilingual EN/GR)
- Many-to-many location links for geo-specific content
- Files: `src/models/Article.js`, `src/controllers/articleController.js`, `components/articles/ArticleCard.js`, `lib/utils/articleTypes.js`

### Authentication System
- JWT in HttpOnly cookies with refresh token support
- CSRF double-submit cookie pattern (automatic via API client)
- Roles enforced via `checkRole` middleware and `<ProtectedRoute>` component
- Files: `src/middleware/auth.js`, `checkRole.js`, `csrfProtection.js`, `lib/auth-context.js`
- See `doc/SECURITY.md`

---

## Section 13: Environment & Configuration

### Required Environment Variables (copy `.env.example` → `.env`)
| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | PostgreSQL connection |
| `JWT_SECRET` | JWT signing key (min 32 chars) |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Backend port (default 3000) |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL (also used to derive Twitch embed parent domain) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID (optional) |

⚠️ Never commit `.env` · Use strong unique secrets · Different secrets per environment · Rotate periodically

### Configuration Files
- **`config/articleCategories.json`** — Article types with bilingual category lists
- **`lib/utils/articleTypes.js`** — `getArticleTypes()`, `getCategories(type)` helpers
- **`src/config/database.js`** — PostgreSQL/SQLite config + connection pooling
- **`src/config/securityHeaders.js`** — Helmet, CORS, and CSP settings

---

## Common Commands Reference

```bash
npm install                  # Install dependencies

npm run dev                  # Start backend dev server
npm run frontend             # Start frontend dev server

npm start                    # Start backend (production)
npm run frontend:build       # Build frontend
npm run frontend:start       # Start frontend (production)

npm test                     # Run all tests
npm test -- <filename>       # Run specific test

npm run migrate              # Run database migrations
npm run seed                 # Seed initial data
```

---

## AI Workflow Guidance

### Before Making Changes
1. Read relevant docs in `doc/`
2. Check for existing reusable components/hooks
3. Review security implications

### When Making Changes
✅ Follow existing patterns · Use reusable components and hooks · Use `lib/api/` for all API calls · Include loading and error states · Apply auth/CSRF/rate-limiting middleware · Write tests · Update docs

❌ Don't add unnecessary dependencies · Don't duplicate logic · Don't call `fetch()` directly · Don't skip error/loading states · Don't bypass security middleware

### Code Review Checklist
- [ ] Follows existing patterns and conventions
- [ ] Uses reusable components where appropriate
- [ ] Proper error handling and loading states
- [ ] Tests included
- [ ] Auth, CSRF, and rate-limiting middleware in place
- [ ] No hardcoded values or secrets
- [ ] Accessible (ARIA labels, semantic HTML, keyboard nav)
- [ ] Documentation updated if needed

---

## Repository Structure Summary
- **Backend**: `src/` — Express routes, controllers, models, middleware
- **Frontend**: `app/` (pages) + `components/` (reusable UI)
- **Shared**: `lib/` — API client, utilities, auth context
- **Config**: `config/` — article categories, database, security
- **Tests**: `__tests__/` — Jest test suites
- **Docs**: `doc/` — comprehensive documentation

---

## Where to Find It Live
**Production:** https://appofasi.gr
