# Copilot Instructions — Appofa

<!-- AI SELF-UPDATE RULE
After completing ANY task that changes conventions, patterns, file structure,
models, routes, pages, components, or dependencies in this repository,
UPDATE this file and doc/REPOSITORY_MAP.md to reflect the changes.
This instruction is permanent and must never be removed.
-->

## 🕐 What Changed Recently
<!-- Update this section after every task that changes conventions — keep last 8 entries -->

- **2026-05-14** — Added DB-backed worker token management for backend worker auth: new `WorkerToken` model + migration `20260514052000-create-worker-tokens.js` (`id`, `name`, `token_hash`, `created_at`, `last_used_at`, `revoked_at`, `created_by`), new admin endpoints `POST /api/admin/worker-tokens`, `GET /api/admin/worker-tokens`, `POST /api/admin/worker-tokens/:id/revoke`, and new `workerTokenService` + `workerAuth` middleware (format validation, active DB-hash verification with `last_used_at` update, revoked-token rejection, transitional `WORKER_TOKEN` fallback). Added tests in `__tests__/worker-tokens-admin.test.js` and `__tests__/worker-auth-middleware.test.js`, plus README/.env docs migration guidance.

- **2026-05-14** — Fixed PR security-audit blocker by bumping direct `next` dependency from `^16.2.0` (resolved to 16.2.4) to `16.2.6` in `package.json` and regenerating `package-lock.json`, so `npm audit --omit=dev --audit-level=high` no longer reports the high-severity Next.js advisory range (`16.0.0 - 16.2.5`).

- **2026-05-14** — Fixed static-page shell hover jitter: `components/layout/StaticPageLayout.js` no longer uses the generic `card` class on its outer wrapper; replaced with explicit non-hover container classes (`bg-white rounded-lg shadow-sm border border-gray-200 p-8`) so the static-page content box no longer shifts slightly when hovering over and out of the main section.

- **2026-05-13** — Made public `/citizen-help/government-positions` data-driven from backend Dream Team government source-of-truth: added new public endpoint `GET /api/dream-team/current-holders?countryCode=GR` (returns active `GovernmentPositions` with active `GovernmentCurrentHolders` + holder user info, no vote/results payload), added `dreamTeamAPI.getCurrentHolders`, and replaced stale hardcoded holders/ministry list in `app/(statics)/citizen-help/government-positions/page.js` with server-side fetch/render + graceful unavailable/empty states. Added tests in `src/controllers/__tests__/dreamTeamController.test.js` and `__tests__/government-positions-page.test.js`.
- **2026-05-13** — Hardened shared list toolbar/filter responsive layout against collapsed/overlapping controls: `components/ui/ListPageToolbar.js` primary row now switches at `md` with `md:flex-wrap`, search slot keeps a stable minimum width (`md:min-w-[240px]`), and controls keep `flex-shrink-0` with `md:flex-wrap`; `components/ui/FilterBar.js` toggle now has explicit visible sizing (`h-10 min-w-10`, non-shrinking icon), expanded filter container uses `flex-col` on mobile + `sm:flex-wrap` on larger screens, and filter inputs are `w-full` on small screens (`sm:min-w-[150px]`) to avoid horizontal overflow. Added focused regression coverage in `__tests__/list-page-toolbar.test.js`.

- **2026-05-13** — Fixed mobile TopNav reliability/accessibility: in `components/layout/TopNav.js` mobile section/auth links now close the menu immediately on click; menu toggle SR text now switches between `open_menu`/`close_menu` with state; desktop/mobile nav switch breakpoint moved from `sm` to `md` (`hidden md:flex`, `md:hidden`); opening `#mobile-menu` now locks `document.body` scroll and restores it on close/unmount. Added coverage in `__tests__/top-nav-grouped-menu.test.js` (SR label/state, immediate close handlers, breakpoint classes) and `__tests__/top-nav-stable.test.js` (body overflow lock + cleanup).

- **2026-05-13** — Standardized list-page header/filter/action layout and fixed civic-questions filter reflow: new shared `components/ui/ListPageToolbar.js` (search slot `flex-1`, filters+actions slot `flex-shrink-0 items-start`); `FilterBar.js` changed from `flex-wrap` inline to `flex-col` so expanded filter inputs always appear **below** the toggle button — not pushed inline; `app/civic-questions/page.js`, `app/polls/page.js`, and `app/suggestions/page.js` all migrated to `ListPageToolbar`; `ListPageToolbar` exported from `components/ui/index.js`; 18 new tests in `__tests__/list-page-toolbar.test.js` (ListPageToolbar slots, FilterBar expanded-below layout, smoke assertions for page adoption); docs updated.

- **2026-05-12** — Added minimal Appofasistis worker integration MVP: new backend `src/services/workerClientService.js` (env-driven `WORKER_BASE_URL` + `WORKER_TOKEN`) with `checkHealth()` (`GET /health`) and `createSnapshot()` (`POST /internal/snapshots` with `x-worker-token`); new admin API endpoints `GET /api/admin/worker-status/health` and `POST /api/admin/worker-status/test-snapshot`; new admin debug page `/admin/worker-status` with health/snapshot actions and latency/status feedback; updated `lib/api/admin.js`, admin dashboard/sidebar links, `.env.example`, `README.md`, and added tests in `__tests__/worker-status-admin.test.js` + frontend render coverage in `__tests__/frontend.test.js`.

- **2026-05-12** — Removed deprecated `persons` location content tab to avoid overlap with `users`/`unclaimed` and the separate officials box: `lib/constants/locations.js` `VALID_TABS` no longer includes `persons`; `components/locations/LocationTabs.js` no longer renders a Persons trigger/panel; `app/locations/[slug]/page.js` no longer builds/passes persons tab label/count. URLs with `?tab=persons` now follow existing invalid-tab fallback to `DEFAULT_TAB`.

- **2026-05-12** — Navigation/pages cleanup after submenu rollout: removed legacy `Όλες οι Σελίδες` (`/pages`) item from `TopNav` submenu (desktop+mobile), deprecated `app/(statics)/pages/page.js` into a safe server redirect to `/platform` (so old visits do not break and old in-page menu no longer renders), removed `/pages` from `app/sitemap.js`, and updated grouped-menu tests in `__tests__/top-nav-grouped-menu.test.js` to assert `/pages` is absent.

- **2026-05-12** — Extended Location Officials for prefectures with repeatable linked parliamentarians: `config/locationRoles.json` adds repeatable `parliamentarian` role for `prefecture`; `locationRoleController` now supports repeatable assignments via `userIds` while remaining backward-compatible with single `userId` payloads; `LocationRoleManager` and `LocationRoles` now support add/edit/remove/display of multiple linked parliamentarians in the existing linked-entity flow; location elections ignore repeatable roles; added migration `20260512041000-allow-repeatable-location-roles.js` to replace unique index with unique `(locationId, roleKey, userId)` and tests in `__tests__/locations.test.js`.

- **2026-05-11** — Navigation/menu redesign in `components/layout/TopNav.js`: desktop top-level links are now grouped into 3 dropdown sections with stronger hierarchy — **Ενημέρωση** (Άρθρα, Νέα, Βίντεο), **Συμμετοχή** (Ψηφοφορίες, **Civic Polls** route `/civic-questions`, Προτάσεις), **Κοινότητα** (Τοποθεσίες, Χρήστες); `Pages` remains as a utility link. Section triggers and items now expose clearer active states and focus-visible treatment. Auth CTAs now emphasize `Εγγραφή` as primary solid and `Σύνδεση` as secondary outline. Mobile drawer now mirrors grouped sections with icons and `min-h-11` touch targets for better readability/tap comfort. Added test coverage in `__tests__/top-nav-grouped-menu.test.js`.

- **2026-05-11** — UI/UX visual & interaction improvements: (1) **Tactile depth** — `components/ui/Card.js` default variant now uses `shadow-sm border border-gray-200` with hoverable cards gaining `hover:shadow-md hover:-translate-y-0.5 transition-all duration-150`; `.card` CSS utility in `app/globals.css` also updated; (2) **Υπέρ/Κατά tints** — pros section in `CivicQuestionDetailClient` gets `bg-green-50 border-green-200` with ✅ icon; cons gets `bg-red-50 border-red-200` with ❌ icon (color is not the only differentiator); (3) **Vote micro-interactions** — `animate-vote-pop` keyframe added to `tailwind.config.js` + `app/globals.css` (scoped in `@media (prefers-reduced-motion: no-preference)`); `InlineSuggestionVote`, `CivicQuestionVoting`, `PollCard` inline voting, and `BinaryPollOptions` in `PollVoting` all apply a brief 280ms pop animation on the clicked vote button via `justVoted`/`inlineJustVoted` state; 6 new tests in `__tests__/ui-micro-interactions.test.js`

- **2026-05-10** — Newsletter UX follow-up: footer newsletter signup now renders only for guests (`Footer` uses `useAuth` and hides CTA for authenticated users); added authenticated preference endpoints `GET/PUT /api/newsletter/me/preference` to read/update the current user’s newsletter state using existing `NewsletterSubscriber` as source of truth (opt-in creates/re-activates by user email, opt-out unsubscribes); profile `/profile` preferences card now includes newsletter opt-in/out toggle wired through `lib/api/newsletter.js`; added tests in `__tests__/newsletter.test.js` for authenticated preference flows and new `__tests__/footer-newsletter-visibility.test.js`
- **2026-05-10** — Added Newsletter Phase 3 operational polish: admin CSV subscriber export (`GET /api/newsletter/admin/subscribers/export`) and CSV import (`POST /api/newsletter/admin/subscribers/import-csv` with created/updated/skipped/invalid summary); campaign scheduling support with `scheduledAt` + status `scheduled` (migration `20260510153000-add-newsletter-campaign-scheduling.js`), new admin campaign actions `POST /admin/campaigns/:id/schedule` and `POST /admin/campaigns/process-due`, plus background due-campaign scheduler job (`src/jobs/newsletterCampaignScheduler.js`) started from `src/index.js`; stronger audience filters persisted in `audienceFilters` (status, locale, source, multi-tags, created/subscribed date ranges); admin UI upgrades across `/admin/newsletter` and campaign pages for CSV import/export, schedule controls, richer reporting summaries, and reusable template presets (`lib/constants/newsletterTemplates.js`); `lib/api/newsletter.js` extended for new import/export/scheduling endpoints; `__tests__/newsletter.test.js` expanded for CSV import/export, segmentation persistence, and due-scheduled processing
- **2026-05-10** — Added Newsletter Phase 2 campaigns + delivery pipeline: new models `NewsletterCampaign` and `NewsletterSendLog` with migrations `20260510150000-create-newsletter-campaigns.js` and `20260510150100-create-newsletter-send-logs.js`; `/api/newsletter` now includes admin campaign endpoints (`GET/POST /admin/campaigns`, `GET/PUT /admin/campaigns/:id`, `POST /admin/campaigns/:id/test-send`, `POST /admin/campaigns/:id/send`, `GET /admin/campaigns/:id/logs`); newsletter service now supports audience filtering (`status=subscribed` + optional locale/source/tag), SMTP test sends, batched send-now delivery with per-recipient logs/counters, and shared newsletter footer/unsubscribe link rendering; frontend adds admin routes `/admin/newsletter/campaigns`, `/admin/newsletter/campaigns/new`, `/admin/newsletter/campaigns/[id]` and extends `lib/api/newsletter.js`; `__tests__/newsletter.test.js` now covers campaign CRUD/test-send/send-now/log behavior
- **2026-05-10** — Added Newsletter Phase 1 foundation: new `NewsletterSubscriber` model + migration `20260510134600-create-newsletter-subscribers.js` (`email` unique lowercase, `status` `pending|subscribed|unsubscribed`, `source` `website|admin_manual|import`, `locale`, `tags`, `notes`, subscribe/unsubscribe timestamps, hashed `unsubscribeTokenHash`, optional `createdByAdminId`); new backend newsletter service/controller/routes at `/api/newsletter` with public `POST /subscribe`, tokenized `GET/POST /unsubscribe`, and admin management (`GET /admin/subscribers`, `GET /admin/stats`, `POST /admin/subscribers`, `POST /admin/subscribers/bulk`, `PUT /admin/subscribers/:id`); new frontend API module `lib/api/newsletter.js`; new reusable `components/newsletter/NewsletterSignupForm.js` integrated in `Footer`; new admin page `/admin/newsletter` + sidebar link; new public `/newsletter/unsubscribe` page; added `__tests__/newsletter.test.js`
- **2026-05-10** — Hardened IP access enforcement and password reset mail failures: `ipBlockMiddleware` now checks whitelist before blacklist so trusted admin/VPS IPs are never accidentally denied by auto-block rules; `requestPasswordReset` in `authService` now handles SMTP failures at the service level (logs with `console.error`, clears orphaned token, does NOT re-throw), keeping the generic 200 response for enumeration protection; added `__tests__/ip-block-middleware.test.js` (5 tests: whitelist-overrides-blacklist, blacklist-blocks, pass-through, test-env skip, error propagation) and `__tests__/password-reset.test.js` SMTP-failure test
- **2026-05-10** — Hardened `countryBlockMiddleware` for proxy + password recovery reliability: added backend skip-list exemptions for `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` so geo country/no-IP blocking never prevents account recovery; improved client IP detection to trust Express `req.ip` first (then socket IP, then `x-forwarded-for`) to avoid proxy/header edge cases being misclassified as no-IP; added `__tests__/country-block-middleware.test.js` coverage for reset-route bypass and proxied IP fallback behavior
- **2026-05-10** — Fixed dotenv initialization order in `src/index.js`: moved `require('dotenv').config()` to the very first line, before any imports that read `process.env` at module load time (in particular `./config/securityHeaders` which captures `FRONTEND_URL` as a module-level constant). Root cause of production CORS/CSP returning `http://localhost:3001` even with correct `.env`. Added `__tests__/security-headers-env.test.js` (3 tests) to assert env var propagation and import order.
- **2026-05-10** — Fixed forgot-password rate limiting: changed `passwordResetRequestLimiter` window from 15 minutes to 1 hour (keeping `max: 5`) so legitimate users who retry after not receiving the email are not locked out within 15 min; `/forgot-password` frontend page now detects 429 errors and shows a user-friendly i18n message (`forgot_password_rate_limit_error`) instead of a generic one; added the new key to `messages/en.json` + `messages/el.json`; fixed `nodemailer` version in `package.json` from non-existent `^8.1.0` to `^8.0.7` (matching `package-lock.json`) which was breaking `npm install` / CI; removed redundant `overrides.nodemailer` entry (direct deps satisfy themselves per convention)
- **2026-05-10** — Added secure password reset flow: `User` now includes `resetPasswordTokenHash` + `resetPasswordExpires` (migration `20260510000000-add-password-reset-fields-to-users.js`); new public auth endpoints `POST /api/auth/forgot-password` (generic response, hashed token storage, SMTP email) and `POST /api/auth/reset-password` (validates token, expires tokens, clears token fields after success); `authService` now uses Nodemailer SMTP env config and sends reset links to `${FRONTEND_URL}/reset-password?token=...`; new reset rate limiters `passwordResetRequestLimiter` + `passwordResetAttemptLimiter`; frontend adds `/forgot-password` and `/reset-password` pages and login link; i18n keys added in `messages/en.json` + `messages/el.json`; proxy skip-list includes the new auth routes to prevent geo first-visit redirects from breaking email reset links
- **2026-05-08** — Civic Questions Phase 3 detail/form improvements: added `commissionRequirement` (nullable STRING) to `CivicQuestion` model with migration `20260508000000-add-commission-requirement-to-civic-questions.js` and service validation; `CivicQuestionDetailClient` redesigned — `CommentsThread` added (entity type `civic_question`) so comments now show when `commentsEnabled=true` / locked banner when `commentsLocked=true`; merged "Source/Origin" + "Important dates" cards into one compact 2-col metadata card placed above pros/cons and results; `officialIdentifier` promoted to amber badge in header row; edit action changed from loud blue button to small pencil SVG icon visible only to creator/admin; `CivicQuestionForm` adds `commissionRequirement` text input with help text; i18n keys added for `commission_requirement` in both `el.json` and `en.json`
- **2026-05-08** — Civic Questions Phase 2 UX/discovery update: `/api/civic-questions` now supports richer listing filters (`sourceType`, `status`, `locationId`, location name text, partial `category`) and sorting (`newest`, `closing_soon`, `most_voted`); `/civic-questions` adds sort + category/location filters in `FilterBar`; detail route split to server `app/civic-questions/[id]/page.js` + client `CivicQuestionDetailClient.js` to enable metadata (`title`, `description`, canonical, OG/Twitter) and richer official-style section layout; results UI (`CivicQuestionResults`) now emphasizes leading choice and shows location participation % using effective population (`population_override ?? population`); form UX (`CivicQuestionForm`) adds help text + date-order validation; new shared status helpers in `components/civicQuestions/statusUtils.js`
- **2026-05-07** — Reset `components/layout/TopNav.js` to a plain top-of-page header in normal document flow: removed scroll-state (`isScrolled`) and scroll listener/effect, removed fixed positioning classes, and kept a simple static border/shadow style; the nav now scrolls away naturally with content (no fixed/sticky/show-hide behavior). `app/layout.js` removed fixed-nav compensation (`pt-16`) from `<main>`. Existing mobile menu/auth dropdown internal scroll constraints remain (`#mobile-menu` and mobile `DropdownMenu` `menuClassName` max-height + overflow).
- **2026-05-07** — Added first-class Civic Questions Phase 1 feature: new backend models `CivicQuestion` + `CivicQuestionVote` (fixed choices: `agree`/`disagree`/`present`) with migration `20260507210000-create-civic-questions.js` (one vote per user per civic question), new API routes `GET/POST/PUT/DELETE /api/civic-questions`, `POST /api/civic-questions/:id/vote`, `GET /api/civic-questions/:id/results`, new frontend routes `/civic-questions`, `/civic-questions/create`, `/civic-questions/[id]`, `/civic-questions/[id]/edit`, new components under `components/civicQuestions/*`, and new API client module `lib/api/civicQuestions.js` (exported from `lib/api/index.js`); TopNav now links to civic questions
- **2026-05-07** — Simplified `components/layout/TopNav.js` to a stable fixed header: removed scroll-direction hide/show state (`isVisible`) and all `translate-y`/`transition-transform` classes so the top menu no longer disappears/reappears on scroll; kept lightweight `isScrolled` shadow/backdrop styling and retained mobile panel/internal scroll constraints (`#mobile-menu` max-height + overflow and mobile auth dropdown `menuClassName` max-height + overflow); `app/layout.js` `pt-16` offset remains unchanged for fixed-nav spacing
- **2026-05-07** — Security dependency update: bumped direct `axios` dependency from `1.15.0` to `1.16.0` in `package.json` to resolve the remaining high-severity audit advisory, and removed redundant `overrides.axios` pin so overrides no longer force a vulnerable direct-dependency version; regenerated `package-lock.json`
- **2026-05-03** — Added location population override for participation % display: new `population_override` (INTEGER nullable) column on `Locations` (migration `20260503000000-add-population-override-to-locations.js`); `locationService.updateLocation` accepts `population_override` (moderator/admin only via existing role-check); `LocationEditForm` shows "Population Override" number input (displays Wikipedia-derived value as hint); location detail page initializes and passes `population_override` in edit flow; `PollResults` shows `{pct}% του πληθυσμού της τοποθεσίας έχει ψηφίσει` when effective population known; suggestion detail page shows per-direction `{pct}% … ενέκρινε/διαφώνησε` lines; effective population resolves as `population_override ?? population`; poll `getPollById` and suggestion `getSuggestionById` now include `population` + `population_override` in location attributes
- **2026-05-07** — Disabled mobile hide-on-scroll in `components/layout/TopNav.js`: scroll handler now guards hide/show logic with `window.innerWidth >= 640` so the header is always visible on mobile; `#mobile-menu` div gains `max-h-[calc(100dvh-4rem)] overflow-y-auto` for independent scrolling on short viewports; mobile auth `DropdownMenu` gains `menuClassName="w-full max-h-[55vh] overflow-y-auto"` so all user-menu items are reachable by panel-internal scrolling; desktop auto-hide behaviour (translate-y, menu auto-close) is unchanged
- **2026-05-03** — Added auto-hiding sticky header to `components/layout/TopNav.js`: nav is now `fixed top-0 left-0 right-0 z-50`; `isVisible` state (hide on scroll-down past 80px / `SCROLL_DELTA=8px`, show on scroll-up) driven by a `requestAnimationFrame`-throttled scroll listener with `{ passive: true }`; `isScrolled` state adds `shadow-md backdrop-blur-sm` once scrolled > 4px; CSS uses `motion-safe:transition-transform motion-safe:duration-300` so reduced-motion users see instant snap; open menus auto-close when header hides; `app/layout.js` adds `pt-16` to `<main>` to compensate for fixed positioning
- **2026-05-03** — Hardened mobile nav/auth UI in `components/layout/TopNav.js`: `mobileMenuItems` now use `isMobileActive()` (not `isActive()`) for active-state classes so no desktop `border-b-2` bleeds into the dropdown; mobile auth dropdown trigger button gains `min-w-0` + `truncate` on the text span and `flex-shrink-0 ml-2` on the chevron to prevent long usernames from pushing the icon off-screen; unauthenticated mobile auth buttons (login + register) are now both full-width `flex w-full items-center justify-center` blocks for consistent tap targets on narrow viewports
- **2026-05-02** — Finalized `/users` public directory consolidation: removed `/discover-people/page.js` and `/persons/page.js` redirect pages entirely (routes now 404 as expected; no redirects); replaced generic location `<select>` dropdown in `FilterBar` with `LocationFilterBreadcrumb` (`🏠 Φιλτράρισμα για την τοποθεσία μου` button — active only for logged-in users with a home location, breadcrumb drill-down when active, X to clear); removed large "Αναγνωρισμένοι από την Κοινότητα" banner block from `/users`; compact 🏆 `worthy_citizens_cta` button moved into the tab-bar action row next to `+ Δημιουργία Προσώπου`; Dream Team discover link already pointed to `/users`; `filterResetKey` increments on reset to remount `LocationFilterBreadcrumb`; `locationAPI` import removed from `app/users/page.js`; docs updated
- **2026-05-02** — Unified `/users` directory UX: replaced separate `PersonsPanel`/`RegisteredUsersPanel` with a `UnifiedPanel` + shared `FilterBar`; three-tab segmented control (`Όλοι` / `Εγγεγραμμένοι` / `Πρόσωπα`, default `Όλοι`); single filter bar (search + location + domain + expertise) shared across all tabs; *All* mode shows registered users (6/page, auth-required) + persons (infinite scroll) together with section headers; `PersonCard` is now a fully-clickable `<Link>` (removed separate "Προβολή Προφίλ" button); `see_all_registered` i18n key added; `doc/REPOSITORY_MAP.md` + copilot-instructions updated
- **2026-05-02** — Consolidated people directory: `/users` is now the single canonical people-directory page showing both public person profiles and registered users via a tab toggle (`🏛️ Πρόσωπα` / `👤 Εγγεγραμμένοι`); full filter bar (search, location, domain, expertise, claim status) from `/discover-people` merged into `/users`; persons tab uses infinite scroll + `personAPI.getAll()`; registered-users tab uses auth-gated paginated `authAPI.searchUsers()` with taxonomy cascade; `/discover-people` and `/persons` (list pages) now redirect to `/users`; individual person deep-links `/persons/[slug]` and `/persons/[slug]/claim` are preserved; back-links in person detail/claim pages updated to point to `/users`; dream-team discover-people banner link updated to `/users`; `users` i18n namespace added (el + en); `doc/REPOSITORY_MAP.md` updated
- **2026-05-01** — Legacy taxonomy cleanup (Phase 4): removed all backward-compat code for v1 profession/expertise format; removed `normalizeLegacyProfession`, `LEGACY_CATEGORY_TO_DOMAIN`, `LEGACY_PROFESSION_ID_MAP`, `LEGACY_SUBPROF_*`, `LEGACY_EXPERTISE_LABEL_TO_TAG_ID` from both `src/utils/professionTaxonomy.js` and `lib/utils/professionTaxonomy.js`; `normalizeProfessions` now filters canonical entries only (drops non-`domainId` data); `normalizeExpertiseTagId` now validates against `VALID_EXPERTISE_TAG_IDS` only; `userService` and `personService` validate directly without normalization step; legacy-focused tests replaced with canonical-only tests; 73 tests pass
- **2026-05-01** — Redesigned user profession/expertise taxonomy: replaced flat v1 JSON (`professions.json` with 3-level category→profession→subProfession + 11-string expertise labels) with a comprehensive v2 hierarchical taxonomy (14 domains, profession→specialization→subspecialization, 70+ expertise tag IDs); added `src/data/expertiseTags.json`; created shared normalization/validation helpers at `src/utils/professionTaxonomy.js` (CJS) and `lib/utils/professionTaxonomy.js` (ESM); updated `src/constants/expertiseAreas.js` and `lib/constants/expertiseAreas.js` to derive IDs from taxonomy; `User` model getters now transparently normalize legacy v1 data; `userService` and `personService` validate against new taxonomy with legacy normalization at write-time; `ProfileProfessionsSection.js` supports 4-level cascade dropdowns; `ProfileExpertiseSection.js` uses tag IDs; 53 new tests in `__tests__/profession-taxonomy.test.js`
- **2026-05-01** — Dream Team now enforces user-country scoping for voting: added shared country-resolution helpers (`lib/utils/userCountryCode.js`, `src/utils/userCountryCode.js`) that resolve country via `nationality` first and `homeLocation` country ancestor fallback; `/dream-team` now auto-redirects logged-in users to their own active Dream Team country when resolvable; `/dream-team/[countryCode]` keeps other countries viewable but vote UI is read-only with a discreet “other countries / vote in your country” prompt; backend `POST /api/dream-team/vote` now returns 403 when resolved user country differs from position country; Dream Team controller tests updated
- **2026-04-30** — Updated app branding icon for PWA/home-screen/social sharing: added `public/images/branding/appofa-app-icon.png` (512x512 PNG, solid #1e3a5f background with logo centered, `maskable`-ready); `app/manifest.js` now references this new icon (replacing the wide transparent logo); `app/layout.js` now sets `icons.apple` to the new icon, adds `appleWebApp.startupImage`, and uses the new icon as `DEFAULT_OG_IMAGE` for global OG/Twitter share images; `app/favicon.ico` is unchanged
- **2026-04-30** — Implemented location-first moderator assignment management: added `GET/POST/DELETE /api/locations/:locationId/platform-roles` endpoints (admin-only, `locationPlatformRoleController.js`); added `locationPlatformRoleAPI` to `lib/api/locations.js`; created `components/locations/LocationModeratorManager.js` (user search + chip list with remove buttons); integrated into `LocationEditForm.js`; refactored `admin/users/page.js` — removed inline assignment dropdown (replaced with read-only chips linking to location pages), removed role-change dialog, removed `locationAPI` import; assignment validation: moderator location must be ancestor/self of user's `homeLocationId`; auto-elevates global role to `moderator` on first assignment; auto-demotes to `viewer` on last removal; 20 new tests in `__tests__/location-platform-roles.test.js`; docs updated
- **2026-04-30** — Redesigned location-based role assignments with `UserLocationRole` join table: `homeLocationId` is now home-location only; moderator and other location-scoped roles use `UserLocationRole` (userId, locationId, roleKey, timestamps); moderator display on location pages is exact-only (no parent→child leakage); moderator location assignment validated against ancestor chain of user's `homeLocationId`; `locationService`, `articleService`, `userService`, `locationController`, `locationRoleController` all updated; admin UI shows separate "Αναθέσεις Συντονιστή" column with join-table data; new tests in `user-location-roles.test.js` (16 tests); migration `20260430100000-create-user-location-roles.js` includes data migration from legacy `homeLocationId` moderator values
- **2026-04-30** — Improved rate-limit UX for voting/ratings: added `makeRateLimitHandler` factory + `anonVoteLimiter` (10/hr, skips auth) + `authVoteLimiter` (50/hr, skips anon) to `src/middleware/rateLimiter.js`; fixed poll vote route middleware order (`optionalAuthMiddleware` now runs before limiters); applied `authVoteLimiter` to suggestion vote route; `lib/api/client.js` attaches `retryAfter`/`resetTime` from 429 bodies to thrown errors; added `components/ui/RateLimitBanner.js` (countdown timer + guest registration CTA); updated `PollVoting.js` and `InlineSuggestionVote.js` to show banner + disable buttons when rate-limited; added `common.rate_limit.*` i18n keys; 16 new tests (rate-limit-voting.test.js + rate-limit-banner.test.js)

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
| Suggestion | `visibility`, `voteRestriction`, `organizationId` | — |
| Article | `type` (`'news'`, `'articles'`, `'personal'`, `'video'`) | `isNews` |
| User | `avatar`, `githubAvatar`, `googleAvatar`, `slug`, `claimStatus`, `firstNameEn`, `lastNameEn`, `homeLocationId` | `isPlaceholder`, `personId`, `moderatorLocationId` |
| Organization | `slug` (from `organizationService.generateSlug`), `parentId`, `isVerified` | — |
| OrganizationMember | `role` (`owner\|admin\|moderator\|member`), `status` (`active\|invited\|pending`), `inviteToken` | — |
| LocationElectionVote | `locationId`, `roleKey`, `voterId`, `candidateUserId` | — |
| UserLocationRole | `userId`, `locationId`, `roleKey` | `homeLocationId` (do NOT use for mod scope) |
| GeoVisit | `countryCode`, `sessionHash`, `ipAddress`, `userId` | — |

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
- **Profession taxonomy**: profession/expertise data uses canonical v2 format: `{domainId, professionId, specializationId?, subspecializationId?}` objects in `User.professions` (JSON array); `User.expertiseArea` stores kebab-case tag IDs from `src/data/expertiseTags.json`; `src/utils/professionTaxonomy.js` (CJS) and `lib/utils/professionTaxonomy.js` (ESM) provide `validateProfessionalIdentity`, `validateExpertiseTagIds`, `normalizeProfessions` (filters canonical entries only), `normalizeExpertiseTags` (filters valid tag IDs only), `resolveProfessionLabel`, `scoreSpecialistMatch`; `userService` and `personService` validate directly without legacy normalization; `User` model getters use `normalizeProfessions`/`normalizeExpertiseTags` to silently drop any non-canonical data on read
- **Articles/news**: treat `Article.type` as source-of-truth (`type === 'news'`); do not use a separate `isNews` flag
- **Poll tags**: use unified `Tag`/`TaggableItem` (`entityType: 'poll'`), not a JSON `Polls.tags` column
- **Poll visibility vs voting**: `visibility` controls who sees polls; `voteRestriction` controls who can vote (`anyone`/`authenticated`/`locals_only`). Do not use `allowUnauthenticatedVotes`.
- **Suggestions access fields**: use `Suggestion.visibility` (`public`/`private`/`locals_only`) for read access and `voteRestriction` (`authenticated`/`locals_only`) for voting eligibility
- **Location officials (LocationRoles)**: for `prefecture`, keep `parliamentarian` as a repeatable linked role in `config/locationRoles.json`; API `PUT /api/locations/:locationId/roles` accepts `userIds` for repeatable roles (and still accepts single `userId` for backward compatibility); storage remains `LocationRoles` rows (one row per linked parliamentarian).
- **Location-scoped role assignments**: use `UserLocationRole` join table (`userId`, `locationId`, `roleKey`) for platform roles like `moderator`; `User.homeLocationId` is ONLY the user's home location; moderator assignment validates that locationId is an ancestor/self of user's `homeLocationId`; moderator display on location pages uses exact `UserLocationRole` match (no parent→child inheritance); **primary management UI is the location edit page** via `LocationModeratorManager` component (user search → add chip; × button → remove); admin users page shows read-only chips linking to location pages; API: `GET/POST/DELETE /api/locations/:locationId/platform-roles` (admin-only, `locationPlatformRoleController.js`); adding first moderator assignment auto-elevates user's global role to `moderator`; removing last assignment auto-demotes to `viewer`
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
- **List page toolbar**: use `components/ui/ListPageToolbar` for pages with search + filters + action (see `app/civic-questions/page.js`, `app/polls/page.js`, `app/suggestions/page.js`); pass `searchSlot`, `filtersSlot` (FilterBar), `actionsSlot` (create button), and optional `extraSlot` (CategoryPills etc.); primary row switches at `md` with wrap safeguards (`md:flex-wrap`), search keeps stable width (`md:min-w-[240px]`), and FilterBar renders expanded inputs **below** its toggle with mobile-safe full-width inputs to prevent overlap/collapse
- **API calls**: always through `lib/api/` modules — never direct `fetch()`
- **Dream Team country resolution**: use `resolveUserDreamTeamCountryCode` (`lib/utils/userCountryCode.js`) for redirect/read-only logic; resolution priority is `user.nationality` then `user.homeLocation` country ancestor (`type='country'`, `code`)
- **i18n**: use `next-intl` with root `i18n.js`; locale comes from `NEXT_LOCALE` cookie (default `el`, supported `el`/`en`) and messages live in `/messages`
- **i18n namespaces**: keep page/component strings in `messages/{el,en}.json` under `common`, `nav`, `footer`, `home`, `auth`, `articles`, `news`, `profile`, `admin`, `editor`, `polls`, `organiza[...]
- **Loading**: show `<SkeletonLoader>` immediately; `<AlertMessage>` on error
- **Homepage locations highlight**: use `LocationCard` inside `HomepageSection` with `sort=mostUsers`; do NOT use `LocationDiscoveryStrip` (removed)
- **Location detail tabs**: canonical tabs are `polls`, `news`, `articles`, `users`, `unclaimed`, `suggestions`, `elections` (no `persons` tab); keep `elections` always visible via `ALWAYS_VISIBLE_TABS`
- **Location entity tabs**: keep regular users (`claimStatus = null`) under `users` and person profiles (`claimStatus != null`) under `unclaimed`
- **Mobile flex stability**: for metadata + vote rows, use `flex-wrap` on the parent row so vote controls naturally wrap below metadata on narrow screens
- **Vote micro-interactions**: apply `animate-vote-pop` briefly (280ms `setTimeout`) on the clicked vote button via a `justVoted`/`inlineJustVoted` local state in voting components (`InlineSuggestionVote`, `CivicQuestionVoting`, PollCard inline, `BinaryPollOptions`); the keyframe is defined in `app/globals.css` inside `@media (prefers-reduced-motion: no-preference)` so reduced-motion users see no animation
- **Υπέρ/Κατά semantic tints**: pros sections use `bg-green-50 border-green-200`; cons sections use `bg-red-50 border-red-200`; always pair color tints with a non-color cue (icon, label) for accessibility
- **Top navigation behavior**: keep `components/layout/TopNav.js` as a plain header in normal layout flow (`relative`/non-fixed, non-sticky) with no scroll listeners/state and no scroll-direction hide/show behavior; desktop navigation uses grouped dropdown sections (`Ενημέρωση`, `Συμμετοχή`, `Κοινότητα`) with section/item active-state highlighting and keyboard-accessible triggers, switching to desktop layout at `md` (not `sm`); keep `Civic Polls` under Συμμετοχή wired to `/civic-questions`; unauthenticated CTAs use primary solid `Εγγραφή` + secondary outline `Σύνδεση`; mobile drawer mirrors grouped sections with icons, `min-h-11` touch targets, internal scrolling (`max-h` + `overflow-y-auto`), immediate close on mobile link/auth taps, and body-scroll lock while open
- **Home hero nav stability**: keep the arrow/dots row always rendered and toggle with `invisible` (not conditional mount) to avoid layout jumps when slides load
- **Homepage sections visibility**: gate info/manifest sections by `enabled` + `audience` (`all`/`guest`/`registered`) from `homepageSettingsAPI`
- **Registration diaspora prompt**: `/register` runs `geoAPI.detect()` and shows `DiasporaModal` before submit when a country is detected
- **Country empty-state fundraising**: location pages show `CountryFundingBanner` for `country` locations when no content exists
- **Admin geo dashboard**: use `/admin/geo` for country traffic analytics (including recent visits IP actions + log cleanup) and country funding management (tabs: traffic + country management)
- **Admin geo access management**: keep country block rules and unknown/no-IP actions in the `/admin/geo` "Κανόνες Πρόσβασης" tab using `lib/api/geoAccess.js`
- **Admin geo API module**: use `geoAdminAPI` (`lib/api/geoAdmin.js`) for `/api/admin/geo-stats/*` admin calls instead of direct request code
- **Geo visit tracking (frontend)**: mount `components/layout/GeoTracker.js` in `app/layout.js` so pathname changes call `geoAdminAPI.trackVisit(...)` — tracking fires unconditionally (no analytics consent gate) as it is security/anti-tampering telemetry
- **Admin article management**: keep article stats/table actions (view/delete/approve news) on `/admin/articles`; keep `/admin` focused on overview cards, quick actions, and announcements
- **Organizations API module**: use `lib/api/organizations.js` and import `organizationAPI` from `lib/api`
- **Organization member management**: use `/api/organizations/:id/join|leave|members/*` endpoints for join/leave/invite/approve/remove/role updates and pending requests
- **Official posts API modules**: use `organizationAPI.getOfficialPosts/createOfficialPost/getVerificationStatus/setVerified` and `officialPostsAPI.getAll`; avoid direct request code
- **Official posts UI scope**: render organization Official Posts tab only for `party` and `institution` organization types
- **Language switcher**: use `components/ui/LanguageSwitcher.js` in the Profile preferences card (not in TopNav)
- **Translations hook**: frontend pages/components should read UI labels via `useTranslations(...)` instead of hard-coded literals
- **Auth**: use `useAuth` from `lib/auth-context.js`
- **Login redirect links**: use `components/ui/LoginLink` and pass `redirectTo` when post-login return should target a specific action page (e.g. person claim flows)
- **Users page (unified directory)**: `/users` is the single people directory; three-tab segmented control (Όλοι / Εγγεγραμμένοι / Πρόσωπα, default Όλοι); one shared `FilterBar` (search + home-location button + domain + expertise) at page level — location filter uses `LocationFilterBreadcrumb` (`🏠 Φιλτράρισμα για την τοποθεσία μου` button, active for logged-in users with a home location, breadcrumb drill-down when active, X to clear, `key={filterResetKey}` for remount on reset); `UnifiedPanel` component handles all three view modes — *all* shows registered-user cards (6 per page, auth-required, capped with "see all" link) + person-profile cards (infinite scroll) in one grid with section labels; *registered* shows paginated registered users (auth-gated, 20/page); *persons* shows person profiles with infinite scroll; `PersonCard` is a fully-clickable `<Link>` (no separate button); claim-status badges (`Επαληθευμένο` / `Αδιεκδίκητο` / `Σε Αναμονή`) distinguish profiles; compact 🏆 worthy-citizens button in the tab-bar row; `/discover-people` and `/persons` list pages are **retired** (404); person deep-links `/persons/[slug]` and `/persons/[slug]/claim` preserved
- **GitHub files static page**: keep `/github-files` public and discoverable from `/pages` for quick links to frequently edited repository files
- **Nginx 502 fallback page**: keep `public/502.html` fully self-contained (inline CSS/JS only, no external dependencies) so it still works when the app is down
- **Components**: PascalCase · Hooks: `useHookName` · Utils: camelCase · Constants: UPPER_SNAKE_CASE
- **Client components**: `'use client'` only when needed (state, effects, event handlers, browser APIs)

### Security (always applied)
- `authMiddleware` on protected routes · `checkRole([...])` for role-gated routes
- `csrfProtection` on all POST/PUT/DELETE · `optionalAuthMiddleware` for public routes needing user context
- Rate limiters: `authLimiter` (5/15m), `createLimiter` (20/15m), `apiLimiter` (100/15m); `passwordResetRequestLimiter` (5/hr, forgot-password), `passwordResetAttemptLimiter` (10/15m, reset-password); `anonVoteLimiter` (10/hr, skips authenticated), `authVoteLimiter` (50/hr, skips unauthenticated); use `makeRateLimitHandler(msg)` for structured 429s with `retryAfter`+`resetTime`

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
