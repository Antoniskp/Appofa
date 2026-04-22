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
- **Node.js**: v24+
- **Live**: https://appofasi.gr

## Key Conventions

### Backend (`src/`)
- **Route chain**: rateLimiter → authMiddleware → csrfProtection → controller
- **Controller pattern**: validate → authorize → business logic → `{ success, data/message }`
- **Service layer**: `src/services/` — complex logic extracted from controllers
- **Errors**: `{ success: false, message }` — never leak stack traces in production
- **Migrations**: timestamp-prefixed `YYYYMMDDHHMMSS-name.js`, dialect-aware (ENUM for postgres, STRING for sqlite)
- **Articles/news**: treat `Article.type` as source-of-truth (`type === 'news'`); do not use a separate `isNews` flag
- **Poll tags**: use unified `Tag`/`TaggableItem` (`entityType: 'poll'`), not a JSON `Polls.tags` column
- **Poll visibility vs voting**: `visibility` controls who sees polls; `voteRestriction` controls who can vote (`anyone`/`authenticated`/`locals_only`). Do not use `allowUnauthenticatedVotes`.
- **Suggestions access fields**: use `Suggestion.visibility` (`public`/`private`/`locals_only`) for read access and `voteRestriction` (`authenticated`/`locals_only`) for voting eligibility
- **Location elections**: use `LocationElectionVote` with unique `(locationId, roleKey, voterId)` for liquid one-vote-per-role behavior, and include descendant locations (`parent_id` hierarchy) for candidate/voter eligibility
- **Unclaimed person creation**: require `firstNameEn` + `lastNameEn`; generate `User.slug` from English names; native names are optional metadata
- **Homepage settings**: use single-row `HomepageSettings` with JSON fields (`manifestSection`, `infoSection`) and defaults via controller/model getters
- **Geo analytics**: use `GeoVisit` as append-only traffic telemetry (country/path/locale/sessionHash/ipAddress/userId) via non-blocking `geoTrackMiddleware` and `POST /api/geo/track` from `proxy.js`; read `x-detected-country` fallback when `cf-ipcountry` is unavailable
- **Scanner probe auto-blocking**: keep `suspiciousPathMiddleware` immediately after `ipBlockMiddleware` to auto-blacklist first-hit probes for `.env`/`wp-config`/`/.git`-style paths with `ipAccessService.addRule(...)`
- **Country access control**: enforce backend country blocks with `countryBlockMiddleware` after `ipBlockMiddleware` + `suspiciousPathMiddleware`; manage blocked countries via `CountryAccessRule` (including optional per-country `redirectPath`) and unknown/no-IP behavior via `GeoAccessSetting` + `countryAccessService` cache
- **Country funding**: use one `CountryFunding` row per country `Location` (`locationId` unique) and manage status through admin `/api/admin/geo-stats/country-funding` endpoints
- **Geo detection API**: use public `GET /api/geo/detect` (CF-IPCountry first, optional geoip-lite fallback) for lightweight country detection
- **Geo access rules public API**: use `GET /api/geo/access-rules` (cached in `proxy.js`) for edge-side blocked-country and unknown/no-IP redirect decisions
- **Country funding public API**: use `GET /api/admin/geo-stats/country-funding/:locationId/public` for unauthenticated location-page funding display
- **Next.js edge entrypoint**: use root `proxy.js` (not `middleware.js`) for country redirect and request proxy logic
- **OAuth avatars**: persist provider photos in `User.githubAvatar` / `User.googleAvatar`; keep `User.avatar` as active source and switch it via `PUT /api/auth/avatar-source`

### Frontend (`app/`, `components/`, `lib/`)
- **Data fetching**: use `useAsyncData` for replace-style fetches and `useInfiniteData` for accumulating feed pagination — never bare `useEffect` + `fetch`
- **API calls**: always through `lib/api/` modules — never direct `fetch()`
- **i18n**: use `next-intl` with root `i18n.js`; locale comes from `NEXT_LOCALE` cookie (default `el`, supported `el`/`en`) and messages live in `/messages`
- **i18n namespaces**: keep page/component strings in `messages/{el,en}.json` under `common`, `nav`, `footer`, `home`, `auth`, `articles`, `news`, `profile`, `admin`, `editor`, `polls`, `static_pages`
- **Loading**: show `<SkeletonLoader>` immediately; `<AlertMessage>` on error
- **Homepage locations highlight**: use `LocationCard` inside `HomepageSection` with `sort=mostUsers`; do NOT use `LocationDiscoveryStrip` (removed)
- **Location detail tabs**: keep `elections` always visible via `ALWAYS_VISIBLE_TABS`
- **Location entity tabs**: keep regular users (`claimStatus = null`) under `users` and person profiles (`claimStatus != null`) under `unclaimed`
- **Mobile flex stability**: for metadata + vote rows, use `flex-wrap` on the parent row so vote controls naturally wrap below metadata on narrow screens
- **Home hero nav stability**: keep the arrow/dots row always rendered and toggle with `invisible` (not conditional mount) to avoid layout jumps when slides load
- **Homepage sections visibility**: gate info/manifest sections by `enabled` + `audience` (`all`/`guest`/`registered`) from `homepageSettingsAPI`
- **Registration diaspora prompt**: `/register` runs `geoAPI.detect()` and shows `DiasporaModal` before submit when a country is detected
- **Country empty-state fundraising**: location pages show `CountryFundingBanner` for `country` locations when no content exists
- **Admin geo dashboard**: use `/admin/geo` for country traffic analytics (including recent visits IP actions + log cleanup) and country funding management (tabs: traffic + country management)
- **Admin geo access management**: keep country block rules and unknown/no-IP actions in the `/admin/geo` "Κανόνες Πρόσβασης" tab using `lib/api/geoAccess.js`
- **Admin geo API module**: use `geoAdminAPI` (`lib/api/geoAdmin.js`) for `/api/admin/geo-stats/*` admin calls instead of direct request code
- **Admin article management**: keep article stats/table actions (view/delete/approve news) on `/admin/articles`; keep `/admin` focused on overview cards, quick actions, and announcements
- **Language switcher**: use `components/ui/LanguageSwitcher.js` in the Profile preferences card (not in TopNav)
- **Translations hook**: frontend pages/components should read UI labels via `useTranslations(...)` instead of hard-coded literals
- **Auth**: use `useAuth` from `lib/auth-context.js`
- **Login redirect links**: use `components/ui/LoginLink` and pass `redirectTo` when post-login return should target a specific action page (e.g. person claim flows)
- **Users page (guest view)**: keep the `/users` unauthenticated section with login/register prompt plus an unclaimed public-profile preview fetched via `personAPI.getAll({ claimStatus: 'unclaimed', limit: 6 })`
- **Nginx 502 fallback page**: keep `public/502.html` fully self-contained (inline CSS/JS only, no external dependencies) so it still works when the app is down
- **Components**: PascalCase · Hooks: `useHookName` · Utils: camelCase · Constants: UPPER_SNAKE_CASE
- **Client components**: `'use client'` only when needed (state, effects, event handlers, browser APIs)

### Security (always applied)
- `authMiddleware` on protected routes · `checkRole([...])` for role-gated routes
- `csrfProtection` on all POST/PUT/DELETE · `optionalAuthMiddleware` for public routes needing user context
- Rate limiters: `authLimiter` (5/15m), `createLimiter` (20/15m), `apiLimiter` (100/15m)

### Testing
- Jest + Supertest · SQLite in-memory for tests · `sequelize.sync({ force: true })` in `beforeAll`
- Use root Jest manual mocks `__mocks__/next-intl.js` and `__mocks__/uuid.js` to avoid ESM parsing issues in tests
- Run: `npm test` (all) · `npm test -- <file>` (specific)

### Anti-patterns to Avoid
- ❌ Direct `fetch()` in components → ✅ Use `lib/api/` methods
- ❌ Bare `useEffect` + fetch → ✅ Use `useAsyncData` / `useInfiniteData`
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
