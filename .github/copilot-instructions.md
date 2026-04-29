# Copilot Instructions — Appofa

<!-- AI SELF-UPDATE RULE
After completing ANY task that changes conventions, patterns, file structure,
models, routes, pages, components, or dependencies in this repository,
UPDATE this file and doc/REPOSITORY_MAP.md to reflect the changes.
This instruction is permanent and must never be removed.
-->

## 🕐 What Changed Recently
<!-- Update this section after every task that changes conventions — keep last 8 entries -->

- **2026-04-29** — Fixed final HEIC/HEIF upload gap for unclaimed person flows: admin create/edit file validation now accepts `.heic/.heif` when browsers send empty/generic MIME (`application/octet-stream`); backend upload MIME filter also allows HEIC/HEIF by filename extension in that generic MIME case; added regression tests for `/api/persons/:id/photo` octet-stream + HEIC/HEIF extension handling
- **2026-04-28** — Enabled image upload for unclaimed person profiles: added `POST /api/persons/:id/photo` endpoint (admin/moderator only; multer + sharp; saves to `/uploads/profiles/{id}.webp`; updates `User.photo`, `User.avatar`, `User.avatarUrl`); added `personAPI.uploadPersonPhoto` frontend method; added file-upload UI to `/admin/persons/create` and `/admin/persons/[id]/edit` (file input with preview + URL fallback); added 6 new tests in `__tests__/persons.test.js`
- **2026-04-28** — Fixed `/uploads/*` 500 regressions: removed `NEXT_PUBLIC_API_URL` fallback from uploads proxy route (prevents infinite proxy loop); switched `imageStorageService` + Express static middleware to `__dirname`-based paths (reliable regardless of working directory); added timeout to uploads proxy route; added `__tests__/uploads-proxy.test.js`
- **2026-04-27** — Added role-gated "Create organization" CTA on `/organizations` linking to `/admin/organizations`; visible only for `admin`/`moderator` roles; added `organizations.create_button` i18n key
- **2026-04-26** — Fixed geo tracking: reject `XX`/`T1` pseudo-codes in `/track` endpoint; `countryCodeToFlag` now shows globe for invalid codes; `getCountryNameLocal` validates before `Intl.DisplayNames`
- **2026-04-24** — Enforced PR-only workflow; added npm/native module rules to recurring mistakes
- **2026-04-24** — Added GDPR cookie consent (`CookieConsentBanner` component, consent-gated `GeoTracker`/GA)
- **2026-04-23** — Added Organizations Phase 5: hierarchy (`parentId`) + analytics (`OrganizationAnalytics` model)

## 🚨 MANDATORY: PR-Only Workflow

**Copilot MUST NEVER commit or push directly to `main` or any branch.**
**ALL changes — no matter how small — must be made via a Pull Request.**

This rule exists because:
- Direct commits bypass CI checks and break the server when dependencies are invalid
- PRs allow CI to catch build/install/test failures before they hit production
- Past direct commits caused broken `npm install` on the live server

| Rule | Detail |
|------|--------|
| ❌ Never | `create_or_update_file`, `push_files` directly to `main` |
| ✅ Always | Create a branch → open a PR → wait for CI to pass |
| No exceptions | Even 1-line changes, typo fixes, or dependency bumps |

## ⚠️ Recurring Mistakes — Read Before Starting

These mistakes appeared in 3–5 fix PRs each. Check this table before writing any code.

| Area | ❌ Wrong | ✅ Correct |
|------|----------|-----------|
| **Workflow** | Commit directly to `main` | **Always open a PR** — CI must pass first |
| **npm overrides** | Add override for a package that is already a direct dependency | Overrides are for transitive deps only; direct deps satisfy themselves |
| **Native modules** | Assume `better-sqlite3` or `sqlite3` are pure JS | Both require `node-gyp` + C compiler (`build-essential`); use a pure-JS SQLite alternative if native build tools are unavailable |
| **Dependency changes** | Change `package.json` without verifying `npm install` passes in CI | All dep changes go through a PR so CI runs `npm install` before merging |
| Geo tracking | Remove `GeoTracker` from `app/layout.js` | Always keep it — it's the only visit tracking source |
| Geo tracking | Track visits in `proxy.js` server-side | Only track client-side via `GeoTracker` component |
| Geo tracking | Forget to skip prefetch requests | Check `purpose: 'prefetch'` header in `GeoTracker` |
| Edge routing | Create or modify `middleware.js` | All edge logic lives in root `proxy.js` only |
| Security deps | Patch transitive dep in one PR, lockfile in another | Both in the **same commit** |
| PollCard | Fix banner, miss guest info panel text | Check both `renderInfoPanel()` AND banner logic |
| PollCard | Use `allowUnauthenticatedVotes` | Use `voteRestriction` field |
| Duplicate work | Open new PR when one already exists | Check open PRs before starting |
| Org visibility | Store `members_only` in DB | Store as `private`; `members_only` is API-layer only |
| Articles | Use `isNews` flag | Use `Article.type === 'news'` |
| Poll tags | Use `Polls.tags` JSON column | Use `Tag`/`TaggableItem` with `entityType: 'poll'` |
| Migrations | Use ENUM for both PostgreSQL and SQLite | Use ENUM for postgres, STRING for sqlite (dialect-aware) |
| Person creation | Omit English name fields | Require `firstNameEn` + `lastNameEn`; slug derived from them |
| Components (removed) | Use `LocationDiscoveryStrip` | Use `LocationCard` inside `HomepageSection` |
| Data fetching | Bare `useEffect` + `fetch` | Use `useAsyncData` (replace) or `useInfiniteData` (feed) |
| Security | Leak stack traces in error responses | `{ success: false, message }` only |
| i18n | Hard-coded UI strings | `useTranslations(...)` with keys in `messages/{el,en}.json` |
| CSRF | Skip middleware on POST/PUT/DELETE | Always apply full route chain |

See `doc/COMMON_ERRORS.md` for full root-cause analysis and related PRs.

## 📋 Model Field Quick Reference

Compact table of every model where wrong field names have caused bugs:

| Model | ✅ Correct Fields | ❌ Never Use |
|-------|------------------|-------------|
| Poll | `visibility`, `voteRestriction`, `organizationId`, `isOfficialPost`, `officialPostScope` | `allowUnauthenticatedVotes`, `tags` (JSON) |
| Suggestion | `visibility`, `voteRestriction`, `organizationId` | — |
| Article | `type` (`'news'`, `'articles'`, `'personal'`, `'video'`) | `isNews` |
| User | `avatar`, `githubAvatar`, `googleAvatar`, `slug`, `claimStatus`, `firstNameEn`, `lastNameEn` | `isPlaceholder`, `personId` |
| Organization | `slug` (from `organizationService.generateSlug`), `parentId`, `isVerified` | — |
| OrganizationMember | `role` (`owner\|admin\|moderator\|member`), `status` (`active\|invited\|pending`), `inviteToken` | — |
| LocationElectionVote | `locationId`, `roleKey`, `voterId`, `candidateUserId` | — |
| GeoVisit | `countryCode`, `sessionHash`, `ipAddress`, `userId` | — |

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
- **Location elections**: use `LocationElectionVote` with unique `(locationId, roleKey, voterId)` for liquid one-vote-per-role behavior, and include descendant locations (`parent_id` hierarchy) fo[...]
- **Unclaimed person creation**: require `firstNameEn` + `lastNameEn`; generate `User.slug` from English names; native names are optional metadata
- **Homepage settings**: use single-row `HomepageSettings` with JSON fields (`manifestSection`, `infoSection`) and defaults via controller/model getters
- **Geo analytics**: use `GeoVisit` as append-only traffic telemetry (country/path/locale/sessionHash/ipAddress/userId) with backend IP fallback from request headers (`x-forwarded-for`/`req.ip`); country codes are normalized to strict ISO-2 only — pseudo-codes `XX` (Cloudflare unknown) and `T1` (Tor/VPN) are stored as `null`; `getCountryNameLocal` validates code before calling `Intl.DisplayNames`; UI `countryCodeToFlag` returns 🌍 globe for null/invalid/non-ISO codes
- **Scanner probe auto-blocking**: keep `suspiciousPathMiddleware` immediately after `ipBlockMiddleware` to auto-blacklist first-hit probes for `.env`/`wp-config`/`/.git`-style paths with `ipAcces[...]
- **Country access control**: enforce backend country blocks with `countryBlockMiddleware` after `ipBlockMiddleware` + `suspiciousPathMiddleware`; manage blocked countries via `CountryAccessRule` [...]
- **Country funding**: use one `CountryFunding` row per country `Location` (`locationId` unique) and manage status through admin `/api/admin/geo-stats/country-funding` endpoints
- **Geo detection API**: use public `GET /api/geo/detect` (CF-IPCountry first, optional geoip-lite fallback) for lightweight country detection
- **Geo access rules public API**: use `GET /api/geo/access-rules` (cached in `proxy.js`) for edge-side blocked-country and unknown/no-IP redirect decisions
- **Country funding public API**: use `GET /api/admin/geo-stats/country-funding/:locationId/public` for unauthenticated location-page funding display
- **Next.js edge entrypoint**: use root `proxy.js` (not `middleware.js`) for country redirect and request proxy logic
- **OAuth avatars**: persist provider photos in `User.githubAvatar` / `User.googleAvatar`; keep `User.avatar` as active source and switch it via `PUT /api/auth/avatar-source`
- **Organization slug**: generate from English `Organization.name` via `organizationService.generateSlug` (unique with `-2`, `-3`, ...)
- **Organization membership**: use `OrganizationMember` with roles `owner|admin|moderator|member`, statuses `active|invited|pending`, and invite metadata (`inviteToken`, `invitedByUserId`)
- **Organization poll/suggestion scope**: use nullable `organizationId` on `Poll`/`Suggestion`; for org-scoped content map API `members_only` visibility to stored `private`
- **Org poll access via poll API**: enforce active `OrganizationMember` checks in `pollService` for org-scoped private poll reads/results and voting (`/api/polls/:id*`) unless user role is `admin`
- **Organization phase-3 enums**: keep shared org content enums in `config/organizationContent.json` for both backend and frontend (`visibilities`, `suggestionTypes`)
- **Organization official posts**: use `Poll`/`Suggestion` fields `isOfficialPost` + `officialPostScope`; platform feed pulls only `isOfficialPost=true` and `visibility='public'`
- **Organization member lifecycle notifications**: use notification types `org_invite_received`, `org_join_approved`, `org_member_removed` with helpers in `notificationService` and fire-and-forge[...]
- **Organization verification**: use admin-only `PATCH /api/organizations/:id/verify` for `isVerified` changes; do not rely on generic update routes for moderation workflows
- **Organization hierarchy**: store parent-child links in `Organization.parentId` (self FK) and prevent cycles when setting parent via `PATCH /api/organizations/:id/parent`

### Frontend (`app/`, `components/`, `lib/`)
- **Data fetching**: use `useAsyncData` for replace-style fetches and `useInfiniteData` for accumulating feed pagination — never bare `useEffect` + `fetch`
- **API calls**: always through `lib/api/` modules — never direct `fetch()`
- **i18n**: use `next-intl` with root `i18n.js`; locale comes from `NEXT_LOCALE` cookie (default `el`, supported `el`/`en`) and messages live in `/messages`
- **i18n namespaces**: keep page/component strings in `messages/{el,en}.json` under `common`, `nav`, `footer`, `home`, `auth`, `articles`, `news`, `profile`, `admin`, `editor`, `polls`, `organiza[...]
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
- **Geo visit tracking (frontend)**: mount `components/layout/GeoTracker.js` in `app/layout.js` so pathname changes call `geoAdminAPI.trackVisit(...)`
- **Admin article management**: keep article stats/table actions (view/delete/approve news) on `/admin/articles`; keep `/admin` focused on overview cards, quick actions, and announcements
- **Organizations API module**: use `lib/api/organizations.js` and import `organizationAPI` from `lib/api`
- **Organization member management**: use `/api/organizations/:id/join|leave|members/*` endpoints for join/leave/invite/approve/remove/role updates and pending requests
- **Official posts API modules**: use `organizationAPI.getOfficialPosts/createOfficialPost/getVerificationStatus/setVerified` and `officialPostsAPI.getAll`; avoid direct request code
- **Official posts UI scope**: render organization Official Posts tab only for `party` and `institution` organization types
- **Language switcher**: use `components/ui/LanguageSwitcher.js` in the Profile preferences card (not in TopNav)
- **Translations hook**: frontend pages/components should read UI labels via `useTranslations(...)` instead of hard-coded literals
- **Auth**: use `useAuth` from `lib/auth-context.js`
- **Login redirect links**: use `components/ui/LoginLink` and pass `redirectTo` when post-login return should target a specific action page (e.g. person claim flows)
- **Users page (guest view)**: keep the `/users` unauthenticated section with login/register prompt plus an unclaimed public-profile preview fetched via `personAPI.getAll({ claimStatus: 'unclaime[...]
- **GitHub files static page**: keep `/github-files` public and discoverable from `/pages` for quick links to frequently edited repository files
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
- ❌ Bare `useEffect` + fetch → ✅ Use `useAsyncData` / `useInfiniteData` (except fire-and-forget telemetry like `GeoTracker`)
- ❌ Missing loading/error states → ✅ Always render `<SkeletonLoader>` + `<AlertMessage>`
- ❌ Skip CSRF/auth middleware → ✅ Full route chain always
- ❌ Leaking stack traces → ✅ Generic error messages in production

## Living Documentation

For the **complete codebase map** (all models, routes, pages, components, migrations):
→ Read **[doc/REPOSITORY_MAP.md](../doc/REPOSITORY_MAP.md)**

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
- [ ] This file (`.github/copilot-instructions.md`) — if conventions or patterns changed (also update `## What Changed Recently`)
- [ ] `doc/REPOSITORY_MAP.md` — if models, routes, pages, components, or migrations changed
- [ ] Feature-specific `doc/*.md` — if a feature was added or modified
