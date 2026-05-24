# Copilot Instructions — Appofa

<!-- AI SELF-UPDATE RULE
After completing ANY task that changes conventions, patterns, file structure,
models, routes, pages, components, or dependencies in this repository,
UPDATE this file and doc/REPOSITORY_MAP.md to reflect the changes.
This instruction is permanent and must never be removed.
-->

## 🕐 What Changed Recently
<!-- Update this section after every task that changes conventions — keep last 8 entries -->

- **2026-05-24** — Fixed `/api/auth/users/public-stats` to use claim-flow semantics (instead of profile-visibility grouping): `registeredUsers` now means `claimStatus IS NULL` (real registered users), while claim-flow profiles are counted via `claimStatus IS NOT NULL` (`claimFlowProfiles`, with legacy `publicUsers` alias retained). Hidden profiles remain an orthogonal visibility count. `/users` labels were aligned in `messages/{en,el}.json`, and coverage updated in `__tests__/user-stats.test.js` + `__tests__/users-stats-labels-translations.test.js`.
- **2026-05-24** — Updated location child-location terminology to be context-aware in UI: `LocationHeader`, `LocationRelatedLocations`, and legacy `LocationOverviewPanel` now use shared `getChildLocationTerminology(...)` from `lib/constants/locations.js` (`country` → `Νομοί / Περιφέρειες`, `prefecture` → `Δήμοι`, fallback → `Υποπεριοχές`). Also aligned related helper text/aria copy and added focused coverage updates in `__tests__/location-ui-localized-names.test.js` and `__tests__/location-phase3-ui.test.js`.
- **2026-05-24** — Switched cookie/analytics behavior to default-on with persistent opt-out: `components/layout/GoogleAnalytics.js` now initializes when GA is configured unless consent explicitly sets `analytics: false`, and `components/layout/CookieBanner.js` now treats missing/partial consent payloads as analytics-enabled defaults while still honoring explicit saved choices. Improved banner discoverability/copy (default-on explanation + footer reopen hint) via `messages/{en,el}.json` and added focused coverage in `__tests__/google-analytics-component.test.js`, `__tests__/cookie-banner-consent.test.js`, and `__tests__/cookie-banner-component.test.js`.
- **2026-05-23** — Restored GA reliability by updating `components/layout/GoogleAnalytics.js` to load `gtag.js` with `next/script` (`afterInteractive`) while preserving consent-gated `initGA` + route-change `trackPageView` behavior in `app/layout.js` (with `GeoTracker` unchanged). Expanded `/api/geo/detect` response metadata (`detectionSource`, `trustedForCountryRedirect`) in `src/routes/geoDetectRoutes.js`, and upgraded the `/country/[code]` no-content `CountryFundingBanner` to clearly separate detected country, detection source, browser locale, trust level, and applied country mode. Added focused coverage in `__tests__/google-analytics-component.test.js`, `__tests__/geo-detect-routes.test.js`, and `__tests__/country-funding-banner.test.js`.
- **2026-05-23** — `/locations/greece` now reuses the same homepage boundary-map + prefecture-pill experience via `ExploreLocationsMap`, rendered first on the page for Greece. `GreeceBoundaryMap` click behavior was deduped to avoid double info boxes (React info card only; no extra Leaflet popup). Added location map viewport defaults + territory color support with new `Location` fields (`boundary_color`, `map_default_center_lat`, `map_default_center_lng`, `map_default_zoom`), migration `20260523201500-add-location-map-defaults-and-boundary-color.js`, edit/admin form inputs, backend validation, and focused test updates in `__tests__/locations.test.js`, `__tests__/location-map.test.js`, and `__tests__/greece-boundary-map.test.js`.
- **2026-05-23** — `LocationMap` now renders `boundary_geojson` as an interactive polygon layer (with perimeter/outline) when the field is set on the location. Supports FeatureCollection, Feature, bare Polygon, and bare MultiPolygon inputs (bare geometries are auto-wrapped). Falls back to marker-only when absent. The location detail page (`app/locations/[slug]/page.js`) also shows the map section when only `boundary_geojson` is present (no lat/lng required). Homepage (`GreeceBoundaryMap`) already renders the 13 Greek prefecture/region boundary polygons — no change needed. Added coverage in `__tests__/location-map.test.js`.
- **2026-05-22** — Hardened `proxy.js` country auto-redirect policy for fallback geo detection: backend `/api/geo/detect` fallback now only drives first-visit country redirect/cookie persistence when it resolves to `GR`; fallback non-GR values (e.g. `US`/`GB`) are treated as untrusted and no longer redirect users to generic foreign `/country/[code]` pages. Updated focused middleware coverage in `__tests__/country-redirect-middleware.test.js`.
- **2026-05-22** — Added reusable per-location boundary workflow for location create/edit: new `components/locations/LocationBoundaryGeoJsonField.js` provides in-form instructions, Polygon/MultiPolygon starter templates (with location metadata prefill), paste + `.geojson/.json` upload, JSON/GeoJSON validation feedback, and live polygon preview via `BaseMap`. Wired into both `/admin/locations` modal and `LocationEditForm` on location pages. Added backend persistence field `Location.boundary_geojson` via migration `20260522203500-add-boundary-geojson-to-locations.js` with service-level GeoJSON validation (supports only Polygon/MultiPolygon roots/features). Added focused API coverage in `__tests__/locations.test.js`.

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

## 🧠 Root-Cause First Principle

When fixing a bug or implementing a change, always prefer a **root-cause fix** over a local patch when it is logically safe to do so.

### Preferred order of thinking
1. **Identify the actual root cause** — understand *why* the bug happens, not just *where* it surfaces.
2. **Check whether the issue originates in a shared layer** — a utility, middleware, service, model, or common component that multiple flows depend on.
3. **Fix it at the highest sensible shared layer** — if the bug lives in a shared path, solve it once there rather than patching every call-site separately.
4. **If the issue is truly local, keep the fix local** — do not over-generalize; a narrowly scoped fix is correct when only one flow is affected.
5. **Verify downstream callers** — root-level fixes must preserve the existing behaviour of all current callers; add or update tests to confirm this.
6. **Add or update tests** — protect both the specific bug and any shared behaviour affected by the change.

### Quick rules
| Rule | Detail |
|------|--------|
| Fix shared layers first | Shared utility / validation / middleware bugs should be fixed there, not re-patched in every consumer |
| Generalize before specializing | If the same corrective logic would appear in ≥ 2 places, it belongs in one common location |
| No duplicate fixes | Do not apply identical logic across many pages/routes/components when a single shared fix is available |
| Keep scope disciplined | Only generalize when the abstraction is real, safe, and consistent with the existing architecture |
| Preserve behaviour | A broader fix must not change the behaviour of any caller that was working correctly before |

## 📋 Model Field Quick Reference

Compact table of every model where wrong field names have caused bugs:

| Model | ✅ Correct Fields | ❌ Never Use |
|-------|------------------|-------------|
| Poll | `visibility`, `voteRestriction`, `organizationId`, `isOfficialPost`, `officialPostScope` | `allowUnauthenticatedVotes`, `tags` (JSON) |
| Suggestion | `visibility`, `voteRestriction`, `organizationId`, `hideCreator` | — |
| Article | `type` (`'news'`, `'articles'`, `'personal'`, `'video'`) | `isNews` |
| User | `avatar`, `githubAvatar`, `googleAvatar`, `slug`, `claimStatus`, `firstNameEn`, `lastNameEn`, `homeLocationId` | `isPlaceholder`, `personId`, `moderatorLocationId` |
| Organization | `slug` (from `organizationService.generateSlug`), `parentId`, `isVerified` | — |
| OrganizationMember | `role` (`owner\|admin\|moderator\|member`), `status` (`active\|invited\|pending`), `inviteToken` | — |
| LocationElectionVote | `locationId`, `roleKey`, `voterId`, `candidateUserId` | — |
| UserLocationRole | `userId`, `locationId`, `roleKey` | `homeLocationId` (do NOT use for mod scope) |
| Location | `name`, `name_local`, `type`, `parent_id`, `code`, `slug`, `lat`, `lng`, `bounding_box`, `boundary_geojson`, `wikipedia_url`, `population_override` | Do not store boundaries as inline lat/lng arrays; use `boundary_geojson` |
| GeoVisit | `countryCode`, `sessionHash`, `ipAddress`, `userId` | — |
| Formation | `userId`, `name`, `description`, `slug`, `totalVotes`, `isPublished`, `isPrimary` | — |

## Project at a Glance

- **App**: Greek civic-engagement platform — articles, polls, suggestions, dream-team formations, person profiles, manifests
- **Stack**: Express 5 + Sequelize 6 (PostgreSQL) · Next.js 16 (App Router) + React 19 + Tailwind CSS 3
- **Auth**: JWT in HttpOnly cookies · CSRF double-submit · Roles: `admin`, `moderator`, `editor`, `viewer`
- **Node.js**: v24+
- **Live**: https://appofasi.gr

## Key Conventions

### Backend (`src/`)
- **Startup env order**: `require('dotenv').config()` MUST be the very first line in `src/index.js` — before any `require()` that imports a config module reading `process.env` at module load time (e.g. `./config/securityHeaders` captures `FRONTEND_URL` as a top-level constant). Moving dotenv later causes production env vars to be silently ignored.
- **Route chain**: rateLimiter → authMiddleware → csrfProtection → controller
- **Controller pattern**: validate → authorize → business logic → `{ success, data/message }`
- **Dream Team vote authorization**: enforce resolved user country (`nationality` first, then `homeLocation` country ancestor) against `GovernmentPosition.countryCode`; reject cross-country votes with 403 while allowing read-only viewing in frontend
- **Service layer**: `src/services/` — complex logic extracted from controllers
- **Errors**: `{ success: false, message }` — never leak stack traces in production
- **Migrations**: timestamp-prefixed `YYYYMMDDHHMMSS-name.js`, dialect-aware (ENUM for postgres, STRING for sqlite)
- **Profession taxonomy**: profession/expertise data uses canonical v2 format: `{domainId, professionId, specializationId?, subspecializationId?}` objects in `User.professions` (JSON array); `User.expertiseArea` stores kebab-case tag IDs from `src/data/expertiseTags.json` taxonomy; `src/utils/professionTaxonomy.js` (CJS) and `lib/utils/professionTaxonomy.js` (ESM) provide `validateProfessionalIdentity`, `validateExpertiseTagIds`, `normalizeProfessions` (filters canonical entries only), `normalizeExpertiseTags` (filters valid tag IDs only), `resolveProfessionLabel`, `scoreSpecialistMatch`; `userService` and `personService` validate directly without legacy normalization; `User` model getters use `normalizeProfessions`/`normalizeExpertiseTags` to silently drop any non-canonical data on read
- **Articles/news**: treat `Article.type` as source-of-truth (`type === 'news'`); do not use a separate `isNews` flag
- **Poll tags**: use unified `Tag`/`TaggableItem` (`entityType: 'poll'`), not a JSON `Polls.tags` column
- **Poll visibility vs voting**: `visibility` controls who sees polls; `voteRestriction` controls who can vote (`anyone`/`authenticated`/`locals_only`). Do not use `allowUnauthenticatedVotes`.
- **Suggestions access fields**: use `Suggestion.visibility` (`public`/`private`/`locals_only`) for read access and `voteRestriction` (`authenticated`/`locals_only`) for voting eligibility
- **Suggestion creator anonymity**: use `Suggestion.hideCreator` to hide `author` for guests/non-owner/non-admin/non-moderator viewers; keep owner/admin/moderator visibility in API serializers and UI labels
- **Location officials (LocationRoles)**: for `prefecture`, keep `parliamentarian` as a repeatable linked role in `config/locationRoles.json`; API `PUT /api/locations/:locationId/roles` accepts `userIds` for repeatable roles (and still accepts single `userId` for backward compatibility); storage remains `LocationRoles` rows (one row per linked parliamentarian). For `electoral_district`, the `parliamentary_candidate` repeatable role is available for future assignment of independent parliamentary candidates.
- **Location boundary GeoJSON workflow**: store optional per-location polygons in `Location.boundary_geojson` (JSON). Accept GeoJSON roots `FeatureCollection`, `Feature`, or direct geometry objects, but enforce geometry type support to `Polygon`/`MultiPolygon` only. Location create/edit UIs provide instructions, starter templates, paste/upload (`.geojson`/`.json`), validation, and preview. Optional `Location.boundary_color` (`#RRGGBB`) controls polygon fill/outline tint in `LocationMap`/`GreeceBoundaryMap`. Optional map viewport defaults (`map_default_center_lat`, `map_default_center_lng`, `map_default_zoom`) are used when fit-bounds data is missing/insufficient. `LocationMap` renders `boundary_geojson` as an interactive polygon layer with perimeter/outline (via `BaseMap.polygonLayers`) and auto-fits derived polygon bounds first; bare Polygon/MultiPolygon geometries are auto-wrapped in a Feature before being passed to L.geoJSON. `/locations/greece` reuses the same `ExploreLocationsMap` (map + prefecture pills) as homepage.
- **Electoral districts**: `Location.type = 'electoral_district'` is the canonical type for Greek electoral constituencies (εκλογικές περιφέρειες). Electoral districts are NOT part of the administrative hierarchy (country → prefecture → municipality); they are a separate political-geography layer mapped via the `MunicipalityDistrictMap` join table. A municipality may belong to multiple electoral districts (many-to-many). Use `GET /api/locations/:id/electoral-districts` to get districts for a municipality, `GET /api/locations/:id/municipalities` to get municipalities for a district, `POST /api/locations/:id/electoral-districts` (admin/moderator + CSRF) to add a mapping, and `DELETE /api/locations/:id/electoral-districts/:mappingId` (admin/moderator + CSRF) to remove one. Frontend uses `electoralDistrictAPI` from `lib/api/locations.js`.
- **Location-scoped role assignments**: use `UserLocationRole` join table (`userId`, `locationId`, `roleKey`) for platform roles like `moderator`; `User.homeLocationId` is ONLY the user's home location; moderator assignment validates that locationId is an ancestor/self of user's `homeLocationId`; moderator display on location pages uses exact `UserLocationRole` match (no parent→child inheritance); **primary management UI is the location edit page** via `LocationModeratorManager` component (user search → add chip; × button → remove); admin users page shows read-only chips linking to location pages; API: `GET/POST/DELETE /api/locations/:locationId/platform-roles` (admin-only, `locationPlatformRoleController.js`); adding first moderator assignment auto-elevates user's global role to `moderator`; removing last assignment auto-demotes to `viewer`
- **Unclaimed person creation**: require `firstNameEn` + `lastNameEn`; generate `User.slug` from English names; native names are optional metadata
- **Public users stats semantics**: `/api/auth/users/public-stats` must treat `claimStatus IS NULL` as real registered users and `claimStatus IS NOT NULL` as claim-flow profiles (`claimFlowProfiles`; legacy alias `publicUsers` kept for compatibility). Hidden profiles (`hiddenUsers`) are visibility-based (`profileVisibility='hidden'`) and can overlap either bucket.
- **Homepage settings**: use single-row `HomepageSettings` with JSON fields (`manifestSection`, `infoSection`) and defaults via controller/model getters
- **Geo analytics**: use `GeoVisit` as append-only traffic telemetry (country/path/locale/sessionHash/ipAddress/userId) with backend IP fallback from request headers (`x-forwarded-for`/`req.ip`); country codes are normalized to strict ISO-2 only — pseudo-codes `XX` (Cloudflare unknown) and `T1` (Tor/VPN) are stored as `null`; `getCountryNameLocal` validates code before calling `Intl.DisplayNames`; UI `countryCodeToFlag` returns 🌍 globe for null/invalid/non-ISO codes
- **Scanner probe auto-blocking**: keep `suspiciousPathMiddleware` immediately after `ipBlockMiddleware` to auto-blacklist first-hit probes for `.env`/`wp-config`/`/.git`-style paths with `ipAcces[...]
- **Country access control**: enforce backend country blocks with `countryBlockMiddleware` after `ipBlockMiddleware` + `suspiciousPathMiddleware`; manage blocked countries via `CountryAccessRule` [...]
- **Country funding**: use one `CountryFunding` row per country `Location` (`locationId` unique) and manage status through admin `/api/admin/geo-stats/country-funding` endpoints
- **Geo detection API**: use public `GET /api/geo/detect` (CF-IPCountry first, optional geoip-lite fallback) for lightweight country detection. Response includes `detectionSource` and `trustedForCountryRedirect` metadata for UI transparency. In `proxy.js`, fallback geo is conservative for first-visit redirects/cookie persistence — only fallback `GR` is trusted for `/country/[code]` auto-redirect, while fallback non-GR is treated as unknown to avoid misdirecting users to generic foreign pages
- **Geo access rules public API**: use `GET /api/geo/access-rules` (cached in `proxy.js`) for edge-side blocked-country and unknown/no-IP redirect decisions
- **Country funding public API**: use `GET /api/admin/geo-stats/country-funding/:locationId/public` for unauthenticated location-page funding display
- **Next.js edge entrypoint**: use root `proxy.js` (not `middleware.js`) for country redirect and request proxy logic
- **OAuth avatars**: persist provider photos in `User.githubAvatar` / `User.googleAvatar`; keep `User.avatar` as active source and switch it via `PUT /api/auth/avatar-source`
- **Organization slug**: generate from English `Organization.name` via `organizationService.generateSlug` (unique with `-2`, `-3`, ...)
- **Organization membership**: use `OrganizationMember` with roles `owner\|admin\|moderator\|member`, statuses `active\|invited\|pending`, and invite metadata (`inviteToken`, `invitedByUserId`)
- **Organization poll/suggestion scope**: use nullable `organizationId` on `Poll`/`Suggestion`; for org-scoped content map API `members_only` visibility to stored `private`
- **Org poll access via poll API**: enforce active `OrganizationMember` checks in `pollService` for org-scoped private poll reads/results and voting (`/api/polls/:id*`) unless user role is `admin`
- **Organization phase-3 enums**: keep shared org content enums in `config/organizationContent.json` for both backend and frontend (`visibilities`, `suggestionTypes`)
- **Organization official posts**: use `Poll`/`Suggestion` fields `isOfficialPost` + `officialPostScope`; platform feed pulls only `isOfficialPost=true` and `visibility='public'`
- **Organization member lifecycle notifications**: use notification types `org_invite_received`, `org_join_approved`, `org_member_removed` with helpers in `notificationService` and fire-and-forge[...]
- **Organization verification**: use admin-only `PATCH /api/organizations/:id/verify` for `isVerified` changes; do not rely on generic update routes for moderation workflows
- **Organization hierarchy**: store parent-child links in `Organization.parentId` (self FK) and prevent cycles when setting parent via `PATCH /api/organizations/:id/parent`

### Frontend (`app/`, `components/`, `lib/`)
- **Data fetching**: use `useAsyncData` for replace-style fetches and `useInfiniteData` for accumulating feed pagination — never bare `useEffect` + `fetch`
- **List page toolbar**: use `components/ui/ListPageToolbar` for pages with search + filters + action (see `app/civic-questions/page.js`, `app/polls/page.js`, `app/suggestions/page.js`); pass `searchSlot`, `filtersSlot` (FilterBar), `actionsSlot` (create button), and optional `extraSlot` (CategoryPills etc.); primary row switches at `md` with wrap safeguards (`md:flex-wrap`), search keeps stable width (`md:min-w-[240px]`), and FilterBar renders expanded inputs **below** its toggle with mobile-safe full-width inputs to prevent overlap/collapse
- **API calls**: always through `lib/api/` modules — never direct `fetch()`
- **Embeds**: use `/embed/[entityType]/[id]` for public iframe-friendly renders of polls, suggestions, and civic questions; keep embeds read-only, responsive, and chrome-free via `AppShell`, and pass `embedPath` into `components/ui/ShareModal` from detail pages to expose copyable embed URL + iframe code
- **Dream Team country resolution**: use `resolveUserDreamTeamCountryCode` (`lib/utils/userCountryCode.js`) for redirect/read-only logic; resolution priority is `user.nationality` then `user.homeLocation` country ancestor (`type='country'`, `code`)
- **i18n**: use `next-intl` with root `i18n.js`; locale comes from `NEXT_LOCALE` cookie (default `el`, supported `el`/`en`) and messages live in `/messages`
- **i18n namespaces**: keep page/component strings in `messages/{el,en}.json` under `common`, `nav`, `footer`, `home`, `auth`, `articles`, `news`, `profile`, `admin`, `editor`, `polls`, `organiza[...]
- **Loading**: show `<SkeletonLoader>` immediately; `<AlertMessage>` on error
- **Homepage locations highlight**: use `LocationCard` inside `HomepageSection` with `sort=mostUsers`; do NOT use `LocationDiscoveryStrip` (removed)
- **Location detail tabs**: canonical tabs are `polls`, `news`, `articles`, `users`, `unclaimed`, `suggestions`, `elections` (no `persons` tab); keep `elections` always visible via `ALWAYS_VISIBLE_TABS`
- **Location page hierarchy**: keep location pages participation-first — `app/locations/[slug]/page.js` should render tabbed participation content (`#location-content`) directly under the header, keep `polls` and `suggestions` tabs visible even at zero items, hide `Τοπικές πληροφορίες` when empty, and place compact related-location chips lower on the page. `LocationHeader` should keep one primary participation CTA (`Ψήφισε τώρα` when polls exist, otherwise `Κάνε πρόταση`) while edit stays a compact icon action. Keep map functionality completely out of this phase and defer it to Phase 4.
- **Location child labels**: use context-aware child-location terminology in the location experience via `getChildLocationTerminology` (`country` → `Νομοί / Περιφέρειες`, `prefecture` → `Δήμοι`, fallback → `Υποπεριοχές`) for section titles, overflow counters, and related aria/help text.
- **Location page empty states**: when local-info, representatives, or key content tabs have no data, prefer guided empty states with a clear next action or expectation (`LocationRoles` public empty card, `LocationTabs` tab-specific empty states, and page-level local-info empty state) instead of silent omission.
- **Location entity tabs**: keep regular users (`claimStatus = null`) under `users` and person profiles (`claimStatus != null`) under `unclaimed`
- **Mobile flex stability**: for metadata + vote rows, use `flex-wrap` on the parent row so vote controls naturally wrap below metadata on narrow screens
- **Vote micro-interactions**: apply `animate-vote-pop` briefly (280ms `setTimeout`) on the clicked vote button via a `justVoted`/`inlineJustVoted` local state in voting components (`InlineSuggestionVote`, `CivicQuestionVoting`, PollCard inline, `BinaryPollOptions`); the keyframe is defined in `app/globals.css` inside `@media (prefers-reduced-motion: no-preference)` so reduced-motion users see no animation
- **Υπέρ/Κατά semantic tints**: pros sections use `bg-green-50 border-green-200`; cons sections use `bg-red-50 border-red-200`; always pair color tints with a non-color cue (icon, label) for accessibility
- **Top navigation behavior**: keep `components/layout/TopNav.js` as a plain header in normal layout flow (`relative`/non-fixed, non-sticky) with no scroll listeners/state and no scroll-direction hide/show behavior; desktop navigation uses grouped dropdown sections (`Ενημέρωση`, `Συμμετοχή`, `Κοινότητα`) with section/item active-state highlighting and keyboard-accessible triggers, switching to desktop layout at `md` (not `sm`); keep `Civic Polls` under Συμμετοχή wired to `/civic-questions`; unauthenticated CTAs use primary solid `Εγγραφή` + secondary outline `Σύνδεση`; mobile drawer mirrors grouped sections with icons, `min-h-11` touch targets, internal scrolling (`max-h` + `overflow-y-auto`), immediate close on mobile link/auth taps, and body-scroll lock while open
- **Home hero nav stability**: keep the arrow/dots row always rendered and toggle with `invisible` (not conditional mount) to avoid layout jumps when slides load
- `app/layout.js` keeps `<main className="flex-grow">` without nav-height compensation because `TopNav` is in normal flow. It also mounts `GoogleAnalytics` and `GeoTracker`; `GeoTracker` posts pathname-based telemetry to `/api/admin/geo-stats/track` via `geoAdminAPI.trackVisit(...)`. Tracking fires unconditionally on every pathname change — no analytics consent required — because it is security/anti-tampering telemetry. Optional analytics (GoogleAnalytics) loads `gtag.js` via `next/script` by default when configured, and only disables when cookie settings explicitly persist `analytics: false`.

### Security (always applied)
- `authMiddleware` on protected routes · `checkRole([...])` for role-gated routes
- `csrfProtection` on all POST/PUT/DELETE · `optionalAuthMiddleware` for public routes needing user context
- Rate limiters: `authLimiter` (5/15m), `createLimiter` (20/15m), `apiLimiter` (100/15m); `passwordResetRequestLimiter` (5/hr, forgot-password), `passwordResetAttemptLimiter` (10/15m, reset-password); `anonVoteLimiter` (10/hr, skips authenticated), `authVoteLimiter` (50/hr, skips unauthenticated); use `makeRateLimitHandler(msg)` factory for structured 429s with `retryAfter`+`resetTime`

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
- [ ] **Platform docs** (`/platform/roles`, `/platform/security`, `/platform/production-rules`, `/platform/responsibilities`) — if roles, permissions, security controls, deployment rules, or governance structures changed. These pages are the canonical source of truth for both users and AI agents.
