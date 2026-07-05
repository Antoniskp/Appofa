# Repository Map — Appofa

<!-- AI UPDATE RULES
This file is the living source of truth for the codebase structure.
After completing ANY task that:
- Adds, removes, or renames a file, model, route, page, or component
- Adds or changes a migration
- Changes architectural patterns or conventions
- Adds or removes a dependency

You MUST update the relevant section below before finalizing your PR.
This instruction is permanent and must never be removed.
-->

> **Last updated**: 2026-07-01
>
> This document is a living map of the entire codebase. AI agents read and update it automatically.
>
> Dependency update notes: direct `axios` is pinned to `1.16.0` (no `overrides.axios`) and direct `nodemailer` is now at `^9.0.1` (upgraded from `^8.0.7`; resolves GHSA-p6gq-j5cr-w38f high-severity arbitrary file read + SSRF). `multer`, `qs`, and `ws` were patched via `npm audit fix` (non-breaking). Production audit is clean (`npm audit --omit=dev` → 0 vulnerabilities). Remaining 17 moderate advisories are `js-yaml` in the dev/test chain only (`@istanbuljs/load-nyc-config` → `babel-plugin-istanbul` → jest); absent from production tree. Direct `next` is now pinned to `16.2.6` to resolve high-severity advisories affecting `16.0.0 - 16.2.5` in CI security-audit workflow. `next-intl` bumped to `^4.11.1` (fixes GHSA-4c35-wcg5-mm9h prototype pollution). `overrides.ip-address: ">=10.1.1"` added to patch XSS in transitive `ip-address` used by `express-rate-limit` and `geoip-lite` (GHSA-v2v4-37r5-5v8g). `overrides.brace-expansion: ">=2.1.0 <3.0.0 || >=5.0.6"` added to resolve DoS vulnerability (GHSA-4gwj-5jf2). `overrides.nodemailer` removed — direct deps satisfy themselves and must not be in overrides. Direct `ws` dependency is now included for backend worker WebSocket support at `/ws/workers`.
>
> Country-entry UX note: `/` is the universal entry point (no automatic IP-based redirect). `proxy.js` now keeps country detection as metadata/cookies only, while guest non-GR hints are handled client-side by `components/geo/CountryEntryPopup.js` on `app/page.js` with persisted decisions in `localStorage` (`appofa_country_entry_decision_v1`). `app/country/[code]/page.js` persists explicit country selection and renders the main homepage structure.
>
> Backend startup convention: `require('dotenv').config()` is the very first statement in `src/index.js` so that all subsequent module-level `process.env` reads (e.g. `FRONTEND_URL` in `src/config/securityHeaders.js`) get the correct production values.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Models (50)](#models-50)
- [API Routes (29 files, 180+ endpoints)](#api-routes-29-files-180-endpoints)
- [Controllers (24)](#controllers-24)
- [Services (15)](#services-15)
- [Backend Utilities (selected)](#backend-utilities-selected)
- [Middleware (9)](#middleware-9)
- [Frontend Pages (142)](#frontend-pages-142)
- [Components (154)](#components-154)
- [API Client Modules (30)](#api-client-modules-30)
- [Hooks (7)](#hooks-7)
- [Constants](#constants)
- [Migrations (93)](#migrations-93)
- [Tests (104 files)](#tests-104-files)
- [Scripts](#scripts)
- [npm Scripts](#npm-scripts)

---

## Directory Structure

```
Appofa/
├── proxy.js                 # Next.js edge proxy (country metadata/cookies, blocked-country rules, no home auto-redirect)
├── i18n.js                  # next-intl request config (cookie-based locale/messages)
├── config/map-data/         # Political mapping datasets (region/district metadata + GeoJSON geometry)
├── messages/                # next-intl locale messages (el.json, en.json, ro.json; namespaces: common/nav/footer/home/auth/articles/news/profile/admin/editor/polls/organizations/static_pages)
├── src/                    # Backend (Express + Sequelize)
│   ├── controllers/        # Request handlers (23 files)
│   ├── services/           # Business logic (15 files)
│   ├── models/             # Sequelize models (48 models)
│   ├── routes/             # Express route definitions (29 files)
│   ├── middleware/         # Auth, CSRF, rate-limit, geo access, error handling (8 files)
│   ├── migrations/         # DB migrations (88 files)
│   ├── config/             # database.js, securityHeaders.js
│   ├── constants/          # articleTypes.js, expertiseAreas.js
│   ├── scripts/            # run-migrations.js, seed scripts
│   ├── websocket/          # Worker WebSocket server modules (`/ws/workers`)
│   ├── utils/              # Utility helpers
│   └── index.js            # Express app entry point
│
├── app/                    # Frontend (Next.js App Router, 105+ pages)
│   ├── (statics)/          # Static content pages (47 pages)
│   ├── admin/              # Admin dashboard (24 pages)
│   ├── articles/           # Article CRUD pages
│   ├── polls/              # Poll pages
│   ├── suggestions/        # Suggestion pages
│   ├── embed/              # Public embeddable poll/suggestion/civic-question pages
│   ├── dream-team/         # Dream team feature
│   ├── persons/            # Person profile pages
│   ├── locations/          # Location pages
│   └── ...                 # Auth, profile, bookmarks, etc.
│
├── components/             # Reusable React components (123+ files)
│   ├── admin/              # Admin UI (5 files)
│   ├── articles/           # Article components (9 files)
│   ├── comments/           # Comment components (2 files)
│   ├── dream-team/         # Dream team components (17 files)
│   ├── follow/             # Follow button (1 file)
│   ├── layout/             # Layout, nav, footer, chrome shell
│   ├── embed/              # Embeddable content cards
│   ├── newsletter/         # Newsletter UI components (1 file)
│   ├── locations/          # Location components (4 files)
│   ├── political/          # Analytical political mapping UI (1 file)
│   ├── polls/              # Poll components (5 files)
│   ├── profile/            # Profile components (12 files)
│   └── ui/                 # Shared UI primitives (20+ files)
│
├── lib/                    # Shared frontend utilities
│   ├── api/                # API client modules (29 files)
│   ├── geo/                # Shared geo helpers (proxy country fallback)
│   ├── constants/          # Frontend constants (3 files)
│   ├── utils/              # Utility helpers
│   └── auth-context.js     # Auth context provider
│
├── hooks/                  # Custom React hooks (6 files)
├── config/                 # articleCategories.json, badges.json
├── __mocks__/              # Jest manual mocks for node_modules (e.g. next-intl, uuid)
├── __tests__/              # Jest test suites (60 files)
├── jest-jsdom-env.js       # Custom jsdom environment polyfill (clearMocksOnScope for jest-mock 30.3/jest-runtime 30.4 compatibility)
├── doc/                    # Documentation (30+ files)
├── scripts/                # Deployment & setup scripts
├── public/                 # Static assets
│   ├── images/branding/    # Branding images: `appofa-app-icon.png` (512x512, PWA/home-screen/OG share icon — canonical branding icon), `appofasi-high-resolution-logo-transparent.png` (wide transparent logo, legacy/marketing use only)
│   └── 502.html            # Self-contained Nginx 502 fallback page (inline CSS/JS + editable countdown target)
└── .github/                # CI workflows (quality, security audit, deploy), agents, copilot instructions
```

---

## Models (50)

| Model | Table | Key Fields | Key Associations |
|-------|-------|-----------|------------------|
| User | Users | id, username (nullable), email (nullable), password, resetPasswordTokenHash, resetPasswordExpires, role, firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, avatar, githubAvatar, googleAvatar, slug (nullable, unique), photo, claimStatus (null=regular user, unclaimed/pending/claimed=person profile), claimedByUserId, createdByUserId, profileVisibility (`hidden\|registered\|public`), expertiseArea, displayBadge | hasMany: Article, Poll, PollVote, Message, Bookmark, Comment, Formation, UserBadge; belongsToMany: User (follows); self-referential: claimedBy, claimVerifiedBy, createdByModerator |
| Article | Articles | id, title, content, summary, bannerImageUrl, authorId, status, type, category, publishedAt | belongsTo: User; hasMany: Comment; belongsToMany: Tag (via TaggableItems) |
| Poll | Polls | id, title, description, category, type, visibility, voteRestriction, resultsVisibility, organizationId | belongsTo: User, Location, Organization; hasMany: PollOption, PollVote; belongsToMany: Tag (via TaggableItems) |
| PollOption | PollOptions | id, title, description, mediaUrl, pollId, userId | belongsTo: Poll, User; hasMany: PollVote |
| PollVote | PollVotes | id, pollId, pollOptionId, userId, isAnonymous, userAgent | belongsTo: Poll, PollOption, User |
| Location | Locations | id, name, name_local, type (`international`\|`country`\|`prefecture`\|`electoral_district`\|`municipality`), parent_id, code, slug, lat, lng, bounding_box (JSON), boundary_geojson (JSON Polygon/MultiPolygon), boundary_color (hex), map_default_center_lat, map_default_center_lng, map_default_zoom, population (from Wikipedia), population_override (moderator-set; takes precedence over population for participation % calculations) | hasMany: children, LocationLink, LocationSection, LocationRole, LocationElectionVote, UserLocationRole, MunicipalityDistrictMap (`districtMappings`), MunicipalityDistrictMap (`municipalityMappings`); belongsTo: parent; belongsToMany: Location (as `electoralDistricts`), Location (as `districtMunicipalities`) via MunicipalityDistrictMap |
| LocationLink | LocationLinks | id, locationId, url, type, pollId | belongsTo: Location, Poll |
| LocationSection | LocationSections | id, locationId, sectionType, title, content, createdByUserId | belongsTo: Location, User |
| LocationRole | LocationRoles | id, locationId, roleKey, userId, sortOrder, isActive | belongsTo: Location, User. Supports repeatable linked officials (e.g. prefecture `parliamentarian`) as multiple rows with same `(locationId, roleKey)` and different `userId`; unique index is `(locationId, roleKey, userId)` |
| UserLocationRole | UserLocationRoles | id, userId, locationId, roleKey, createdAt, updatedAt | Unique (userId, locationId, roleKey); belongsTo: User, Location. Platform role assignments (e.g. 'moderator'). Validated at service layer: moderator location must be ancestor/self of user's homeLocationId. |
| LocationElectionVote | LocationElectionVotes | id, locationId, roleKey, voterId, candidateUserId | belongsTo: Location, User(voter), User(candidate) |
| LocationRequest | LocationRequests | id, countryName, countryNameLocal, note, requestedByUserId, status | belongsTo: User |
| Suggestion | Suggestions | id, title, body, type, locationId, organizationId, authorId, status, hideCreator, visibility, voteRestriction, category | belongsTo: Location, Organization, User; hasMany: Solution, SuggestionVote, Comment; belongsToMany: Tag (via TaggableItems) |
| Solution | Solutions | id, suggestionId, authorId, content, status | belongsTo: Suggestion, User |
| SuggestionVote | SuggestionVotes | id, suggestionId, userId, voteType | belongsTo: Suggestion, User |
| Comment | Comments | id, entityType (`article`\|`poll`\|`user_profile`\|`civic_question`), entityId, authorId, parentId, body, status | belongsTo: User, Comment (parent); hasMany: Comment (replies) |
| Message | Messages | id, type, userId, email, name, subject, message, locationId, status | belongsTo: User, Location |
| NewsletterSubscriber | NewsletterSubscribers | id, email (unique lowercase), name, status (`pending\|subscribed\|unsubscribed`), source (`website\|admin_manual\|import`), locale, tags, notes, subscribedAt, unsubscribedAt, unsubscribeTokenHash, createdByAdminId | belongsTo: User (`createdByAdmin`) |
| NewsletterCampaign | NewsletterCampaigns | id, subject, previewText, htmlContent, textContent, status (`draft\|scheduled\|sending\|sent\|failed`), audienceFilters (JSON incl. status/locale/source/tags/date ranges), createdByAdminId, sentAt, scheduledAt, totalRecipients, successCount, failureCount | belongsTo: User (`createdByAdmin`); hasMany: NewsletterSendLog |
| NewsletterSendLog | NewsletterSendLogs | id, campaignId, subscriberId (nullable), email, status (`queued\|sent\|failed`), providerMessageId, errorMessage, sentAt | belongsTo: NewsletterCampaign (`campaign`), NewsletterSubscriber (`subscriber`) |
| WorkerToken | WorkerTokens | id, name, token_hash (bcrypt hash), created_at, last_used_at, revoked_at, created_by | belongsTo: User (`createdByAdmin`) |
| MunicipalityDistrictMap | MunicipalityDistrictMaps | id, municipalityId, electoralDistrictId | Join table for many-to-many between any Location and electoral_district Locations; unique (municipalityId, electoralDistrictId); belongsTo: Location (`municipality`), Location (`electoralDistrict`) |
| Follow | Follows | id, followerId, followingId | belongsTo: User (×2) |
| Bookmark | Bookmarks | id, userId, entityType, entityId | belongsTo: User |
| Endorsement | Endorsements | id, endorserId, endorsedId, topic | belongsTo: User (×2) |
| Report | Reports | id, contentType, contentId, category, message, reporterEmail, status | — |
| Formation | Formations | id, userId, name, description, slug, totalVotes, isPublished, isPrimary | belongsTo: User; hasMany: FormationPick, FormationLike, DreamTeamVote |
| FormationPick | FormationPicks | id, formationId, positionId, candidateId, pickOrder | belongsTo: Formation, GovernmentPosition |
| FormationLike | FormationLikes | id, formationId, userId | belongsTo: Formation, User |
| DreamTeamVote | DreamTeamVotes | id, candidateUserId, positionId, voteCount | belongsTo: GovernmentPosition |
| GovernmentPosition | GovernmentPositions | id, name, description, isActive | hasMany: GovernmentCurrentHolder, GovernmentPositionSuggestion, DreamTeamVote, FormationPick |
| GovernmentCurrentHolder | GovernmentCurrentHolders | id, positionId, personId, firstName, lastName, isActive | belongsTo: GovernmentPosition |
| GovernmentPositionSuggestion | GovernmentPositionSuggestions | id, positionId, suggestedFirstName, suggestedLastName, reason | belongsTo: GovernmentPosition |
| PersonRemovalRequest | PersonRemovalRequests | id, userId (FK→Users, unclaimed profile), requesterName, requesterEmail, message, status, adminNotes, reviewedBy | belongsTo: User (person), User (reviewer) |
| LinkPreviewCache | LinkPreviewCaches | id, url, title, description, imageUrl, favicon, domain, expiresAt | — |
| Manifest | Manifests | id, slug, title, description, content, createdBy, status | belongsTo: User; hasMany: ManifestAcceptance |
| ManifestAcceptance | ManifestAcceptances | id, manifestId, userId, acceptedAt | belongsTo: Manifest, User |
| UserBadge | UserBadges | id, userId, badgeName, earnedAt | belongsTo: User |
| HeroSettings | HeroSettings | id, isActive, slide data fields | — |
| HomepageSettings | HomepageSettings | id, manifestSection(JSON) | — |
| Tag | Tags | id, name (unique lowercase) | hasMany: TaggableItem; belongsToMany: Article, Poll, Suggestion (via TaggableItems) |
| TaggableItem | TaggableItems | id, tagId, entityType (article\|poll\|suggestion), entityId | belongsTo: Tag |
| IpAccessRule | IpAccessRules | id, ip (STRING 45, unique), type (whitelist\|blacklist), reason, createdByUserId | belongsTo: User (createdBy) |
| GeoVisit | GeoVisits | id, countryCode, countryName, isAuthenticated, userId, isDiaspora, sessionHash, ipAddress, path, locale | belongsTo: User (`user`, nullable) |
| CountryFunding | CountryFundings | id, locationId (unique), goalAmount, currentAmount, donorCount, status, donationUrl, unlockedAt, unlockedByUserId | belongsTo: Location (`location`), User (`unlockedBy`) |
| CountryAccessRule | CountryAccessRules | id, countryCode (STRING 2, unique), reason, redirectPath (nullable), createdByUserId | belongsTo: User (`createdBy`) |
| GeoAccessSetting | GeoAccessSettings | id, key (STRING 100, unique), value, updatedAt | Key-value geo access behavior settings |
| Organization | Organizations | id, name, slug, type, description, logo, website, contactEmail, locationId, parentId, isPublic, isVerified, createdByUserId | belongsTo: User (`createdBy`), Location (`location`), Organization (`parent`); hasMany: Organization (`children`), OrganizationMember (`members`), OrganizationRole (`orgRoles`), OrganizationAnalytics (`analytics`) |
| OrganizationMember | OrganizationMembers | id, organizationId, userId, role, status, inviteToken, invitedByUserId | belongsTo: Organization, User (`user`), User (`invitedBy`) |
| OrganizationRole | OrganizationRoles | id, organizationId, title (STRING 255), category (STRING 100, nullable), description (TEXT, nullable), userId (nullable FK→Users), personId (nullable FK→Users), sortOrder, isCurrent | belongsTo: Organization, User (`user` — claimed), User (`personProfile` — unclaimed profile). One row per role slot; repeatable roles use multiple rows. userId and personId are mutually exclusive. |
| OrganizationAnalytics | OrganizationAnalytics | id, organizationId, date, memberCount, activeMemberCount, pollCount, suggestionCount, officialPostCount | belongsTo: Organization (`organization`) |
| CivicQuestion | CivicQuestions | id, title, originalLink, sourceType, sourceName, simplified, pros, cons, dateAsked, deadline, status, locationId, creatorId, visibility, voteRestriction, resultsVisibility, category, officialIdentifier, commissionRequirement, commentsEnabled, commentsLocked | belongsTo: User (`creator`), Location (`location`); hasMany: CivicQuestionVote |
| CivicQuestionVote | CivicQuestionVotes | id, civicQuestionId, userId, choice (`agree|disagree|present`) | belongsTo: CivicQuestion, User; unique (civicQuestionId, userId) |

---

## API Routes (29 files, 180+ endpoints)

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /csrf | — | Get CSRF token |
| POST | /register | — | Register (supports optional `nationality`, `homeLocationId`, diaspora payload fields, and `profileVisibility`=`hidden\|registered\|public`; frontend `/register` uses a 3-step wizard with inline step-1 password validation, in-step non-GR diaspora handling in step 2, and explicit profile-visibility selection in step 3) |
| POST | /login | — | Login |
| POST | /forgot-password | — | Request password reset email (generic response, token hashed in DB) |
| POST | /reset-password | — | Reset password with token |
| GET | /verify-email | — | Verify email with token (`EMAIL_VERIF_TOKEN_INVALID` / `EMAIL_VERIF_TOKEN_EXPIRED`) |
| POST | /resend-verification | ✅ | Resend account verification email (authenticated user) |
| GET | /profile | ✅ | Get profile |
| PUT | /profile | ✅ | Update profile |
| PUT | /avatar-source | ✅ | Switch active avatar source (GitHub/Google) |
| PUT | /password | ✅ | Change password |
| POST | /logout | ✅ | Logout |
| DELETE | /profile | ✅ | Delete account |
| GET | /github | — | GitHub OAuth |
| GET | /github/callback | — | GitHub callback |
| GET | /google | — | Google OAuth |
| GET | /google/callback | — | Google callback |
| DELETE | /github/unlink | ✅ | Unlink GitHub |
| DELETE | /google/unlink | ✅ | Unlink Google |
| GET | /users | admin | List all users (legacy) |
| GET | /users/admin | admin | List users with server-side pagination/filtering |
| GET | /users/stats | admin | User stats |
| PUT | /users/:id/role | admin | Update user role |
| PUT | /users/:id/verify | admin | Verify/unverify user |
| DELETE | /users/:id | admin | Delete user |
| GET | /users/search | ✅ | Search users (public) |
| GET | /users/:id/public | ✅ | Public user profile |
| GET | /users/public-stats | — | Public users-strip stats: `totalUsers`, `registeredUsers` (`claimStatus IS NULL`), `claimFlowProfiles` (`claimStatus IS NOT NULL`, legacy alias `publicUsers`), `hiddenUsers`/`nonSearchableUsers` (`profileVisibility='hidden'`) |

### Newsletter (`/api/newsletter`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /subscribe | — | Public newsletter subscribe (duplicate-safe generic response) |
| GET | /unsubscribe | — | Public unsubscribe via secure tokenized link (`?token=`) |
| POST | /unsubscribe | — | Public unsubscribe via token payload |
| GET | /me/preference | ✅ | Get logged-in user newsletter preference derived from subscriber status |
| PUT | /me/preference | ✅ | Set logged-in user newsletter opt-in/out (creates or updates subscriber by user email) |
| GET | /admin/subscribers | admin/mod | List subscribers (pagination/filter/search) |
| GET | /admin/stats | admin/mod | Subscriber totals by status |
| GET | /admin/subscribers/export | admin | Export subscribers CSV (supports admin filters) |
| POST | /admin/subscribers | admin | Add/update subscriber manually |
| POST | /admin/subscribers/bulk | admin | Bulk add subscribers from pasted/listed emails |
| POST | /admin/subscribers/import-csv | admin | Import subscribers from CSV text/file content with summary (created/updated/skipped/invalid) |
| PUT | /admin/subscribers/:id | admin | Update subscriber fields/status |
| GET | /admin/campaigns | admin | List newsletter campaigns (pagination/status filter) |
| POST | /admin/campaigns | admin | Create campaign draft |
| GET | /admin/campaigns/:id | admin | Get campaign details + estimated recipient count |
| PUT | /admin/campaigns/:id | admin | Update draft campaign |
| POST | /admin/campaigns/:id/test-send | admin | Send test email (no send-log rows) |
| POST | /admin/campaigns/:id/send | admin | Send campaign now with batched delivery + per-recipient logs |
| POST | /admin/campaigns/:id/schedule | admin | Schedule campaign for later delivery (`scheduledAt`, status=`scheduled`) |
| POST | /admin/campaigns/process-due | admin | Process due scheduled campaigns immediately |
| GET | /admin/campaigns/:id/logs | admin | List campaign send logs + campaign delivery summary |

### Articles (`/api/articles`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | opt | List articles |
| GET | /category-counts | — | Category counts |
| GET | /:id | opt | Get article |
| POST | / | ✅ | Create article |
| PUT | /:id | ✅ | Update article |
| DELETE | /:id | ✅ | Delete article |
| POST | /:id/approve-news | admin | Approve news |
| PATCH | /:id/comment-settings | ✅ | Toggle comments |

### Polls (`/api/polls`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | opt | List polls (includes `organization` relation: id/name/slug/type/logo/isVerified when poll has `organizationId`) |
| GET | /category-counts | — | Category counts |
| GET | /my-voted | ✅ | My voted polls |
| GET | /:id | opt | Get poll |
| GET | /:id/results | opt | Poll results |
| GET | /:id/export | ✅ | Export audit data |
| POST | / | ✅ | Create poll |
| PUT | /:id | ✅ | Update poll |
| DELETE | /:id | ✅ | Delete poll |
| POST | /:id/vote | opt | Vote |
| POST | /:id/options | ✅ | Add options |
| PATCH | /:id/comment-settings | ✅ | Toggle comments |

### Civic Questions (`/api/civic-questions`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | opt | List civic questions (filters: `status`, `sourceType`, `locationId`, location-name `location`, partial `category`; sort: `newest`, `closing_soon`, `most_voted`) |
| GET | /:id | opt | Get civic question |
| GET | /:id/results | opt | Civic question results (subject to results visibility rules) |
| POST | / | ✅ | Create civic question |
| PUT | /:id | ✅ | Update civic question |
| DELETE | /:id | ✅ | Delete civic question |
| POST | /:id/vote | ✅ | Cast/update vote with fixed choice (`agree|disagree|present`) |

### Suggestions (`/api/suggestions`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | opt | List suggestions (author omitted when `hideCreator=true` for guests/non-owner/non-admin/non-moderator viewers; includes `organization` relation: id/name/slug/type/logo/isVerified when suggestion has `organizationId`) |
| GET | /category-counts | — | Category counts |
| GET | /:id | opt | Get suggestion (author omitted when `hideCreator=true` for guests/non-owner/non-admin/non-moderator viewers) |
| GET | /:id/solutions | — | Get solutions |
| POST | / | ✅ | Create suggestion |
| PATCH | /:id | ✅ | Update suggestion |
| DELETE | /:id | ✅ | Delete suggestion |
| POST | /:id/solutions | ✅ | Add solution |
| POST | /:id/vote | ✅ | Vote |

### Locations (`/api/locations`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | — | Location hierarchy |
| GET | /:id | — | Get location |
| GET | /:id/entities | opt | Location entities |
| POST | /requests | ✅ | Request new location |
| GET | /requests | admin | List requests |
| PUT | /requests/:id | admin | Review request |
| POST | /link | ✅ | Link entity to location |
| POST | /unlink | ✅ | Unlink entity |
| GET | /cameras | — | Flattened public cameras feed from published location webcam sections; `mapLocation` uses exact `content.webcams[].lat/lng` when present, otherwise source location |
| GET | /:locationId/sections | — | Get sections (webcams may include optional exact `lat` / `lng` per-camera pin) |
| POST | /:locationId/sections | mod | Create section (webcams support optional exact `lat` / `lng` pin per camera) |
| PUT | /:locationId/sections/reorder | mod | Reorder sections |
| PUT | /:locationId/sections/:id | mod | Update section (webcam exact `lat` / `lng` validated/normalized) |
| DELETE | /:locationId/sections/:id | mod | Delete section |
| GET | /:locationId/roles | — | Get roles |
| PUT | /:locationId/roles | mod | Upsert roles (single-slot roles via `userId`; repeatable roles via `userIds[]`, backward-compatible with single `userId`) |
| GET | /:locationId/platform-roles | admin | List platform-level role assignments (UserLocationRole) for a location |
| POST | /:locationId/platform-roles | admin | Add a platform role assignment (userId + roleKey; validates ancestor-chain for moderator; auto-elevates global role) |
| DELETE | /:locationId/platform-roles/:id | admin | Remove a platform role assignment (auto-demotes to viewer if last moderator assignment) |
| GET | /:locationId/elections | opt | Get elections/live results with hierarchical `canVote` (includes descendant locations) |
| POST | /:locationId/elections/:roleKey/vote | ✅ | Cast or change vote |
| DELETE | /:locationId/elections/:roleKey/vote | ✅ | Remove vote |

### Organizations (`/api/organizations`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | opt | List organizations (`type`, `search`, `page`, `limit`) |
| GET | /:slug | opt | Get organization by slug |
| POST | / | mod | Create organization (admin/moderator) |
| PUT | /:id | mod | Update organization |
| DELETE | /:id | admin | Delete organization |
| GET | /:id/members | opt | List organization members (private orgs are members-only) |
| POST | /:id/join | ✅ | Join organization (active if public, pending if private) |
| DELETE | /:id/leave | ✅ | Leave own organization membership (owners blocked) |
| POST | /:id/members/invite | ✅ | Invite user by `userId` (org owner/admin or platform admin/moderator) |
| PATCH | /:id/members/:userId/approve | ✅ | Approve pending membership |
| DELETE | /:id/members/:userId | ✅ | Remove member (owner protected) |
| PATCH | /:id/members/:userId/role | ✅ | Update member role (`admin|moderator|member`) |
| GET | /:id/members/pending | ✅ | List pending membership requests |
| GET | /:id/polls | opt | List organization polls (public orgs expose only `visibility=public` to non-members) |
| POST | /:id/polls | ✅ | Create organization poll (active members only) |
| GET | /:id/suggestions | opt | List organization suggestions (public orgs expose only `visibility=public` to non-members); response includes `organization` (id/name/slug/type/logo/isVerified), `location` (id/name/slug), and `category` per suggestion |
| POST | /:id/suggestions | ✅ | Create organization suggestion (active members only); accepts optional `category` (string) and `locationId` |
| GET | /:id/official-posts | opt | List organization official posts |
| POST | /:id/official-posts | ✅ | Create official organization post (`poll` or `suggestion`) for party/institution orgs |
| GET | /:id/verification | opt | Get organization verification status |
| PATCH | /:id/verify | ✅ | Set organization verification (`admin` only) |
| GET | /:id/children | opt | List direct child organizations for hierarchy UI |
| PATCH | /:id/parent | mod | Set/clear parent organization (`admin`/`moderator`, cycle-safe) |
| GET | /:id/analytics | ✅ | Last 30 days of organization analytics (org owner/admin or platform admin/moderator) |

### Official Posts (`/api/official-posts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | opt | Platform-wide public official posts feed (party/institution organizations) |

### Dream Team (`/api/dream-team`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /current-holders | — | Official current holders by country (`GovernmentPositions` + active `GovernmentCurrentHolders`, no Dream Team vote/results payload) |
| GET | /positions | — | List positions |
| POST | /vote | ✅ | Cast vote (country-scoped: user can vote only in resolved own country; mismatch returns 403) |
| DELETE | /vote/:positionId | ✅ | Remove vote |
| GET | /results | — | Results |
| GET | /my-votes | ✅ | My votes |
| GET | /formations/public | — | Public formations |
| GET | /formations/popular-picks | — | Popular picks |
| GET | /formations/formation-of-the-week | — | Weekly featured |
| GET | /formations/leaderboard | — | Leaderboard |
| GET | /formations/my-stats | ✅ | My stats |
| GET | /formations/activity | — | Activity feed |
| GET | /formations/share/:slug | — | Shared formation |
| GET | /formations | ✅ | My formations |
| POST | /formations | ✅ | Create formation |
| GET | /formations/:id | ✅ | Get formation |

### Persons (`/api/persons`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | opt | List persons (claimStatus IS NOT NULL users; filters include `independentOnly`, `officialOnly`, `roleKey`, `manifestSlug`, `hasManifestAcceptance` for the independent-officials/direct-democracy hub) |
| GET | /search | — | Search person profiles by name |
| GET | /unified-search | — | Unified search: person profiles + real users merged |
| GET | /claims | admin | List pending claims |
| POST | /claims/:id/approve | admin | Approve claim |
| POST | /claims/:id/reject | admin | Reject claim |
| POST | / | admin | Create unclaimed person profile (requires `firstNameEn` + `lastNameEn`; slug derived from English name) |
| POST | /:id/photo | admin | Upload/replace profile photo for an unclaimed person (multipart `photo` field; max 10 MB; client-side normalizes HEIC/HEIF to JPEG and resizes to ≤ 768 px via `lib/utils/normalizeUploadImage.js`; backend saves to `/uploads/profiles/{id}.webp`; updates `User.photo`, `User.avatar`, `User.avatarUrl`) |
| DELETE | /:id | admin | Delete person |
| POST | /:id/claim | ✅ | Submit a claim for a person profile |
| PUT | /:id | ✅ | Update person profile |
| GET | /profile/:id | admin | Get by numeric ID |
| GET | /:slug | opt | Get by slug |

### Other Route Files
| File | Base Path | Key Endpoints |
|------|-----------|---------------|
| commentRoutes.js | /api/comments | GET /, POST /, PATCH /:id/hide, PATCH /:id/unhide, DELETE /:id |
| bookmarkRoutes.js | /api/bookmarks | GET /, GET /count, GET /status, POST /toggle |
| followRoutes.js | /api/users | POST /:id/follow, DELETE /:id/follow, GET /:id/follow/status, GET /:id/followers, GET /:id/following |
| endorsementRoutes.js | /api/endorsements | GET /topics, GET /leaderboard, GET /status, POST /, DELETE / |
| messageRoutes.js | /api/messages | POST /, GET /, GET /:id, PUT /:id/status, PUT /:id/respond, DELETE /:id |
| newsletterRoutes.js | /api/newsletter | POST /subscribe, GET/POST /unsubscribe, GET/PUT /me/preference, GET /admin/subscribers, GET /admin/stats, GET /admin/subscribers/export, POST /admin/subscribers, POST /admin/subscribers/bulk, POST /admin/subscribers/import-csv, PUT /admin/subscribers/:id, GET/POST /admin/campaigns, GET/PUT /admin/campaigns/:id, POST /admin/campaigns/:id/test-send, POST /admin/campaigns/:id/send, POST /admin/campaigns/:id/schedule, POST /admin/campaigns/process-due, GET /admin/campaigns/:id/logs |
| reportRoutes.js | /api/reports | POST /, GET /, GET /content/:type/:id, GET /:id, POST /:id/review |
| personRemovalRequestRoutes.js | /api/removal-requests | POST /, GET /, GET /:id, POST /:id/review |
| organizationRoutes.js | /api/organizations | GET /, GET /:slug, POST /, PUT /:id, DELETE /:id, GET /:id/members, POST /:id/join, DELETE /:id/leave, POST /:id/members/invite, PATCH /:id/members/:userId/approve, DELETE /:id/members/:userId, PATCH /:id/members/:userId/role, GET /:id/members/pending, GET /:id/polls, POST /:id/polls, GET /:id/suggestions, POST /:id/suggestions, GET /:id/official-posts, POST /:id/official-posts, GET /:id/verification, PATCH /:id/verify, GET /:id/children, PATCH /:id/parent, GET /:id/analytics, **GET /:id/roles**, **POST /:id/roles**, **PUT /:id/roles/:roleId**, **DELETE /:id/roles/:roleId** |
| officialPostsRoutes.js | /api/official-posts | GET / |
| manifestRoutes.js | /api/manifests | GET /, POST /, PUT /:slug, DELETE /:slug, PUT /:slug/accept, DELETE /:slug/accept, GET /:slug/supporters |
| badges.js | /api/badges | GET /my, GET /user/:userId, POST /evaluate, PUT /display |
| heroSettingsRoutes.js | /api/hero-settings | GET /, PUT /, GET /slides, POST /slides, PUT /slides/:id, DELETE /slides/:id |
| homepageSettingsRoutes.js | /api/homepage-settings | GET /, PUT / |
| linkPreviewRoutes.js | /api/link-preview | POST / |
| solutionRoutes.js | /api/solutions | POST /:id/vote |
| statsRoutes.js | /api/stats | GET /community, GET /user/home-location |
| tagRoutes.js | /api/tags | GET /suggestions?entityType=article\|poll\|suggestion&q=prefix |
| adminRoutes.js | /api/admin | GET /health, GET /worker-status/health (dispatches `health_request` over worker WS; 503 when no worker connected), POST /worker-status/test-snapshot (dispatches `snapshot_request` over worker WS; 503 when no worker connected), POST /worker-tokens, GET /worker-tokens, POST /worker-tokens/:id/revoke, dream-team management endpoints, GET/POST/DELETE /ip-rules, POST /ip-rules/check |
| geoStatsRoutes.js | /api/admin/geo-stats | POST /track (normalizes countryCode to ISO-2; rejects `XX`/`T1`), GET /country-funding/:locationId/public, GET /visits (includes `userId`/`username` when available), DELETE /visits?olderThanDays=N, GET /countries, GET /country-funding, POST /country-funding, PUT /country-funding/:id, DELETE /country-funding/:id |
| geoDetectRoutes.js | /api/geo | GET /detect (returns `countryCode`, `countryName`, plus detection transparency metadata: `detectionSource`, `trustedForCountryRedirect`) |
| geoAccessRoutes.js | /api/geo + /api/admin/geo-access | Public: GET /access-rules (blocked countries with optional redirectPath). Admin: GET/POST/DELETE /rules (POST accepts optional redirectPath), GET/PUT /settings |

---

## Controllers (24)

| Controller | Domain |
|-----------|--------|
| articleController.js | Article CRUD & management |
| authController.js | Authentication, OAuth, password |
| bookmarkController.js | Bookmark management |
| commentController.js | Comment CRUD & moderation |
| dreamTeamController.js | Dream team formations, votes |
| electoralDistrictController.js | Electoral district mapping CRUD: GET districts for a municipality, GET municipalities for a district, POST add mapping, DELETE remove mapping (admin/moderator) |
| endorsementController.js | Endorsements |
| followController.js | Follow/unfollow |
| heroSettingsController.js | Hero section config |
| linkPreviewController.js | Link preview caching |
| locationController.js | Location CRUD, sections, roles |
| locationPlatformRoleController.js | Platform-level location role assignment management (UserLocationRole): list/add/remove; admin-only; auto-elevates/demotes global role; ancestor-chain validation |
| locationRoleController.js | Location role management (single-slot + repeatable linked officials in `LocationRoles`) |
| locationSectionController.js | Location section management + flattened public cameras feed (`GET /api/locations/cameras`) |
| manifestController.js | Manifest CRUD & acceptance |
| messageController.js | Contact messages |
| newsletterController.js | Newsletter subscription + authenticated self preference read/update + admin subscriber management (CSV import/export) + campaign CRUD/schedule/test-send/send/logs |
| personController.js | Person profiles & claims |
| personRemovalRequestController.js | Removal requests |
| pollController.js | Poll CRUD, voting, results |
| civicQuestionController.js | Civic question CRUD, voting, results |
| organizationController.js | Organization CRUD + member workflow + org-scoped polls/suggestions + official posts + verification status + hierarchy + analytics |
| reportController.js | Content reporting |
| statsController.js | Statistics |
| suggestionController.js | Suggestions & solutions |
| tagController.js | Unified tag system — returns tags with usage counts from Tags/TaggableItems, supports ?entityType and ?q filters |

---

## Services (16)

| Service | Purpose |
|---------|---------|
| articleService.js | Article business logic |
| authService.js | Authentication & authorization |
| badgeService.js | Badge evaluation & assignment |
| countryAccessService.js | Country block rules + geo access settings with 60s in-memory TTL cache |
| imageProcessingService.js | Resizes and converts uploaded images to WebP (sharp); accepts JPEG, PNG, WebP, and HEIC/HEIF input |
| imageStorageService.js | Saves processed image buffers to `uploads/profiles/` and `uploads/locations/` using `__dirname`-relative paths |
| ipAccessService.js | IP whitelist/blacklist with 60s in-memory TTL cache |
| locationService.js | Location data management (hierarchy, entities split into regular users vs unclaimed person profiles) |
| newsletterService.js | Newsletter subscriber lifecycle + authenticated user preference upsert by user email + CSV import/export + campaign drafting/templates-ready payloads, stronger audience filtering (status/locale/source/tags/date ranges), scheduling + due processing, test sends, batched delivery, and per-recipient send logging |
| oauthService.js | OAuth integration (GitHub, Google) |
| personService.js | Person profile management, claims, placeholders (unclaimed profile slugs derive from required English names), plus independent-official discovery filters using `politicalAffiliationStatus`, `LocationRoles`, and `ManifestAcceptances` |
| pollService.js | Poll operations & calculations (including org-membership access enforcement for org-scoped private polls/results/voting) |
| civicQuestionService.js | Civic question business logic: visibility/location-scoped access, fixed-choice voting (`agree|disagree|present`), results visibility rules |
| organizationService.js | Organization slug generation + organization search helpers |
| userService.js | User management & utilities, including public `/users` stats buckets based on claim-flow semantics (`claimStatus`) with hidden-visibility overlay counts |
| workerClientService.js | Appofasistis worker integration client (`GET /health`, `POST /internal/snapshots` with `x-worker-token`) using `WORKER_BASE_URL` + `WORKER_TOKEN` |
| workerTokenService.js | Worker token management: secure token generation, bcrypt hash storage, metadata listing/revoke, DB token validation with `last_used_at` update |

---

## Backend Utilities (selected)

| Utility | Purpose |
|---------|---------|
| proxyCountryDetection.js | Proxy-only helper that calls backend `/api/geo/detect` with client IP headers, applies a short timeout, and normalizes fallback country codes for non-Cloudflare deployments (proxy only trusts fallback `GR` for first-visit country redirects/cookie persistence) |
| organizationUtils.js | Shared membership checks for organizations (`isActiveMember`, `isOrgAdmin`) |
| userCountryCode.js | Dream Team country resolution helper (`nationality` first, then `homeLocation` country ancestor via `Location.type='country'` + `code`) used by vote authorization |
| professionTaxonomy.js | **Profession taxonomy helpers** — `normalizeProfessions` (filter canonical entries only), `normalizeExpertiseTags` (filter valid tag IDs only), `normalizeExpertiseTagId`, `validateProfessionalIdentity`, `validateExpertiseTagIds`, `resolveProfessionLabel`, `scoreSpecialistMatch`, `VALID_EXPERTISE_TAG_IDS`; loaded by User model getters + userService + personService |
| websocket/workerWsServer.js | Worker WebSocket server factory for `/ws/workers` with worker-token auth (`validateWorkerToken` + format check), in-memory connected-worker registry storing active `ws` handles, `register`/`heartbeat`/`taskResult` handling, pending request/response map keyed by `requestId`, request helpers (`sendRequest`, `getFirstConnectedWorkerId`), and diagnostics getter (`getConnectedWorkers`) |

---

## Middleware (10)

| Middleware | Purpose |
|-----------|---------|
| proxy.js (root) | Next.js edge proxy for country detection + cached country access-rules checks (including per-country redirect paths) + first-visit redirect to `/country/[code]`; keeps `CF-IPCountry` first, uses cookie fallback, and treats backend `/api/geo/detect` results conservatively by trusting fallback only when it resolves to `GR` (fallback non-GR does not auto-redirect to foreign country pages) |
| auth.js | JWT authentication (`authMiddleware`) |
| checkRole.js | Role-based access (`checkRole([...])`) |
| csrfProtection.js | CSRF token validation |
| errorHandler.js | Global error handling |
| optionalAuth.js | Optional auth (doesn't fail if unauthenticated) |
| rateLimiter.js | Rate limiting: `apiLimiter`, `authLimiter`, `passwordResetRequestLimiter` (5/hr per IP, forgot-password), `passwordResetAttemptLimiter` (10/15m, reset-password), `createLimiter`, `uploadLimiter`; `anonVoteLimiter` (10/hr, skips authenticated), `authVoteLimiter` (50/hr, skips unauthenticated); `makeRateLimitHandler(msg)` factory for structured 429 responses with `retryAfter`+`resetTime`; `ipBlockMiddleware` — whitelist takes precedence over blacklist (whitelisted IPs always allowed), then blacklisted IPs denied with 403; all rate limiters also skip whitelisted IPs |
| suspiciousPathMiddleware.js | Blocks scanner probes on first suspicious path hit and auto-blacklists source IP via `ipAccessService.addRule(...)` |
| countryBlockMiddleware.js | Backend country-level access block (`cf-ipcountry`/`x-detected-country`) + optional per-country redirect path + unknown/no-IP blocking behavior; skips auth recovery endpoints (`/api/auth/forgot-password`, `/api/auth/reset-password`) and resolves client IP in proxy-safe order (`req.ip` → socket remoteAddress → `x-forwarded-for`) |
| workerAuth.js | Worker token auth middleware: validates `x-worker-token` format, checks active DB token hashes (updates `last_used_at`), supports transitional `WORKER_TOKEN` fallback, rejects revoked/invalid tokens |

---

## Frontend Pages (142)

> i18n note: core public pages (`/`, `/login`, `/articles`, `/news`, `/profile`, `/admin`, `/editor`, `/polls`, `/instructions`, `/rules`, `/mission`, `/contribute`, `/contact`) and shared nav/footer/article cards now use `useTranslations(...)`.

### Main Pages
| Route | Description |
|-------|-------------|
| `/` | Home page (hero with tagline + simplified CTA pair + 3 value cards; sections ordered as Government Snapshot → optional Info → CTA banner → polls/suggestions/locations → merged `Νέα & Άρθρα` → videos → manifest supporters) |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | Authentication (includes password reset request + token reset flow; `/register` is a 3-step wizard with account basics (inline password validation before advancing) → optional nationality/location with inline non-GR diaspora toggle/residence handling → GDPR/summary, plus GR quick-select onboarding and moderator-interest opt-in; `/verify-email` handles token confirm + expired-token resend flow) |
| `/newsletter/unsubscribe` | Public tokenized newsletter unsubscribe confirmation page |
| `/profile` | User profile with sticky 4-tab layout (`Profile`, `Location & Politics`, `Skills & Interests`, `Settings`); tab content is split into `app/profile/tabs/*` while form state/effects/handlers are centralized in `hooks/useProfileForm.js`; includes profile-completeness card, newsletter preference toggle, and `?verified=1` success toast handling |
| `/users`, `/users/[username]` | Unified people directory with visibility enforcement (`profileVisibility`): guests see only `public` profiles, authenticated users see `registered+public`, and `hidden` profiles are excluded from discovery. Profile page access is now optional-auth and enforces the same model (owner/admin/moderator can still access hidden directly). Shared filter bar (search, home-location button via `LocationFilterBreadcrumb`, domain, expertise) remains across tabs; person cards are fully clickable; `/discover-people` and `/persons` list pages are retired (404). |
| `/independents` | Independent public-officials hub: lists unaffiliated person profiles assigned to `LocationRoles`, filters by location/office/search, and can narrow to officials who accepted a selected direct-democracy manifest via `ManifestAcceptances`. |
| `/users/[username]/followers`, `/users/[username]/following` | Social connections |
| `/bookmarks` | Saved items |
| `/my-votes`, `/my-polls`, `/my-news` | User content |

### Content
| Route | Description |
|-------|-------------|
| `/articles`, `/articles/[id]`, `/articles/new`, `/articles/[id]/edit` | Articles (detail taxonomy pills link to canonical list filters; list reads initial `tag`, `category`, and `type` query params) |
| `/news`, `/news/[id]` | News (detail taxonomy pills link to canonical list filters; list reads initial `tag` and `category` query params) |
| `/videos`, `/videos/[id]`, `/videos/new` | Videos |
| `/editor` | Content editor |
| `/polls`, `/polls/[id]`, `/polls/create`, `/polls/[id]/edit` | Polls (detail category/tag pills link to filtered `/polls`; list reads initial `tag` and `category` query params) |
| `/civic-questions`, `/civic-questions/[id]`, `/civic-questions/create`, `/civic-questions/[id]/edit` | Civic Questions (Phase 2: list filters/sorting, official-style detail sections, enhanced results UI; detail page now includes metadata via server wrapper + client detail component split) |
| `/suggestions`, `/suggestions/[id]`, `/suggestions/new`, `/suggestions/[id]/edit` | Suggestions |
| `/embed/[entityType]/[id]` | Public iframe-friendly embed route for `polls`, `suggestions`, and `civic-questions`; renders responsive read-only cards with a strong CTA back to the full Appofasi page, hides global chrome via `AppShell`, and returns safe unavailable states for non-public / missing content |

### Features
| Route | Description |
|-------|-------------|
| `/locations`, `/locations/[slug]` | Locations |
| `/cameras` | Community cameras directory with map-first layout powered by `GET /api/locations/cameras` |
| `/organizations`, `/organizations/[slug]` | Organizations list (includes role-gated CTA to `/admin/organizations` for admin/moderator) + profile page with: invite member search using `PersonSearch` (replaces raw user-ID input; real users + claimed persons invitable), polls tab using universal `PollCard` + `SearchInput` filter, suggestions tab using universal `SuggestionCard` + `SearchInput` filter (both tabs keep org-scoped create forms and permission gating) |
| `/official-posts` | Public discovery feed for platform-wide official organization posts |
| `/country/[code]` | Country landing page after first-visit geo redirect; when no local content is available it shows a richer `CountryFundingBanner` empty state with explicit Geo-IP transparency (detected country, detection source, browser locale, trust level, applied country mode), plus support CTA (`/contribute`), optional donation CTA, and diaspora shortcut to `/country/GR` |
| `/dream-team`, `/dream-team/f/[slug]` | Dream team & formations (`/dream-team` auto-redirects logged-in users to their resolved own country when available; `/dream-team/[countryCode]` keeps other countries browseable in read-only mode for voting) |
| `/persons/[slug]`, `/persons/[slug]/claim` | Person profiles (individual deep-links preserved) |
| `/candidates/*` | Backward-compat alias for persons |
| `/worthy-citizens` | Worthy citizens page |
| `/manifest-supporters` | Manifest supporters |
| `/request-removal` | Profile removal request |
| `/blocked`, `/unknown-country` | Public geo access status pages for blocked/unknown-country traffic |

### Admin (22 pages)
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard |
| `/admin/articles` | Article management (stats, filters, pagination, view/delete/approve news) |
| `/admin/users` | User management (search, filter, role change, verify, delete) |
| `/admin/status` | System status |
| `/admin/worker-status` | Worker integration admin page (check worker health, send test snapshot, and manage worker tokens with create/list/revoke UI) |
| `/admin/persons/*` | Person management (list, detail, edit, create) |
| `/admin/candidates/*` | Candidate management (backward-compat) |
| `/admin/dream-team` | Dream team admin |
| `/admin/hero` | Hero settings |
| `/admin/geo` | Geo traffic dashboard + country funding management + access rules tab (blocked countries + unknown/no-IP actions) |
| `/admin/homepage` | Homepage settings |
| `/admin/ip-rules` | IP whitelist/blacklist management |
| `/admin/newsletter` | Newsletter admin (stats, advanced filters, manual add, bulk paste import, CSV import/export, quick status updates; includes campaign management entrypoint for admins) |
| `/admin/newsletter/campaigns` | Newsletter campaign list (status filter incl. scheduled, delivery counters, scheduled-at visibility, quick send-now and process-due actions) |
| `/admin/newsletter/campaigns/new` | Create newsletter campaign draft/scheduled item (template presets, subject/preview/content, stronger audience filters, optional schedule time) |
| `/admin/newsletter/campaigns/[id]` | Campaign detail/edit page with template apply, scheduling controls, richer audience/reporting summary, test-send, send-now, and recent send logs |
| `/admin/locations` | Location admin |
| `/admin/organizations` | Organization admin — table with search/filter, parent-org dropdown, location/parent columns, highlighted editing row, direct public-profile links |
| `/admin/manifests` | Manifest admin |
| `/admin/messages/*` | Message admin |
| `/admin/removal-requests` | Removal request admin |
| `/admin/reports` | Report admin |

### Static Pages (51 pages in `(statics)` layout)
Informational content: about, mission, contact, contribute, instructions, FAQ, terms, privacy, rules, education guides, civic tools, platform info, categories, github-files, etc.

- `/citizen-help/regions-electoral-map` now renders reusable **Αναλυτική Χαρτογράφηση** UI: map + selected-region detail panel with district seats, fed by external JSON/GeoJSON datasets in `config/map-data/` (`regions.metadata.json`, `electoral-districts.metadata.json`, `regions.geojson`, `electoral-districts.geojson`) joined by stable IDs (`id`, `regionId`); region/district labels link into Appofa locations via search/type query links when metadata includes location hints.
- `/citizen-help/government-positions` now renders server-fetched live GR official holder data from `GET /api/dream-team/current-holders?countryCode=GR` (source of truth: `GovernmentPositions` + `GovernmentCurrentHolders`) and shows graceful unavailable/empty states instead of hardcoded office-holder lists.

#### Platform Documentation (`/platform/*`) — canonical source of truth for users and AI agents
| Route | Description |
|-------|-------------|
| `/platform` | Landing page with categorized links to all platform pages |
| `/platform/flows` | Application flows (registration, article creation, news approval, polls) |
| `/platform/roles` | **Canonical** role & permissions reference — Viewer, Editor, Moderator, Admin with full permissions table (updated 2026-04-30: added Moderator role) |
| `/platform/objects` | Data objects: articles, users, polls, locations |
| `/platform/features` | Platform features overview |
| `/platform/modules` | Application modules and pages |
| `/platform/cost` | Estimated development and maintenance cost |
| `/platform/technology` | Dedicated technology stack showcase page with grouped logo-style cards and outbound links |
| `/platform/badges` | Badge system and acquisition |
| `/platform/security` | **Canonical** public security overview — auth, CSRF, rate limiting, geo controls, incident response |
| `/platform/production-rules` | **Canonical** production/deployment rules — PR-only workflow, CI checks, testing standards, AI agent rules |
| `/platform/responsibilities` | **Canonical** governance matrix — who owns what across Viewer/Editor/Moderator/Admin |

> **Maintenance convention**: Pages marked **Canonical** must be kept in sync with implementation. When roles, security controls, deployment rules, or governance structures change, the relevant `/platform/*` page must be updated in the same PR/commit. This applies to both human developers and AI coding agents.

---

## Components (154)

| Directory | Count | Key Components |
|-----------|-------|----------------|
| `admin/` | 5 | AdminHeader, AdminLayout, AdminSidebar, AdminTable, AdminTableActions |
| `articles/` | 10 | ArticleCard, **ArticleTaxonomyPills** (shared clickable taxonomy pills for article/news/video detail headers), ArticleForm, RichArticleContent, VideoEmbed, VideoPostForm |
| `comments/` | 2 | CommentForm, CommentsThread |
| `dream-team/` | 17 | FormationBuilder, FormationCard, FormationView, Leaderboard, PersonSearch, ShareModal, PositionCard |
| `follow/` | 1 | FollowButton |
| `layout/` | 10 | AppShell (hides TopNav/Footer/CookieBanner on `/embed/*` while keeping normal chrome elsewhere), TopNav, Footer, HomeHero, ToastProvider, StaticPageLayout, GeoTracker, GoogleAnalytics (loads GA script via `next/script` and tracks route-change pageviews by default unless cookie settings explicitly opt out) |
| `cameras/` | 1 | CamerasPageClient (user-facing `/cameras` directory with map-first layout, BaseMap markers, and cards linking to camera streams + associated/source locations) |
| `embed/` | 1 | EntityEmbedView (shared embed card renderer for polls, suggestions, and civic questions) |
| `newsletter/` | 1 | NewsletterSignupForm (public footer subscription form with locale capture + generic success/error messaging; rendered only for guests) |
| `locations/` | 13 | CountryFundingBanner (country no-content card with Geo-IP transparency panel: detected country, source, browser locale, trust level, and applied mode; plus support CTA, optional donation CTA, diaspora shortcut to Greece), ExploreLocationsMap (homepage + `/locations/greece` prefecture discovery explorer with pills and the same bidirectional polygon/marker↔pill hover linkage pattern as location detail explorers), LocationBoundaryGeoJsonField (reusable location boundary editor with instructions, template buttons, paste/upload validation, and BaseMap polygon preview), LocationBreadcrumb, LocationCard, **LocationChildrenExplorer** (shared child-location explorer for location detail pages; desktop split layout with square map left + pills panel right, mobile stacked; **hover fully bidirectional**: polygon/marker hover highlights pill via `onFeatureHover`/`onMarkerHover`; pill hover highlights polygon/marker via `onLayerInit`/`onMarkersReady` controls; markers now render whenever coordinates exist even when polygons are present; tooltips show name + user count + first moderator; children fetched with `sort=mostUsers`), LocationEditForm (includes LocationModeratorManager section, `MapViewportPickerMap` for visual `map_default_center_lat`/`map_default_center_lng`/`map_default_zoom` picker, updated larger map sizing classes `h-[300px] sm:h-[340px]`, and boundary-color inputs), LocationElectionsTab, LocationHeader (balanced desktop top box with participation-first CTA hierarchy, denser `7/5` desktop split and compact spacing to reduce empty space; child-location labels are context-aware via `getChildLocationTerminology`: `country` → `Νομοί / Περιφέρειες`, `prefecture` → `Δήμοι`, fallback `Υποπεριοχές`), LocationMap (**updated**: renders `boundary_geojson` as interactive polygon layer with perimeter/outline when present; bare Polygon/MultiPolygon auto-wrapped; auto-fits derived polygon bounds; supports `boundary_color`; falls back to marker/default center/zoom), LocationModeratorManager (admin: add/remove moderator assignments for a location), LocationOverviewPanel (legacy summary cards component, no longer rendered in default location detail flow), LocationRelatedLocations (compact related/nearby chip layout replacing large hierarchy blocks; child section text/counters follow the same context-aware terminology helper), LocationTabs (polls/suggestions-first tab UX with compact poll-card grid and explicit `+ Ξεκίνησε ...` empty-state actions) |
| `map/` | 4 | **BaseMap** (shared Leaflet map with marker + overlay + polygonLayers support; `styleFeature` per-feature coloring hook; `onLayerInit(controls)` callback for imperative polygon highlight from outside the map after layer is built; `onMarkerHover`/`onMarkersReady` for marker-mode hover linking; variant-based DivIcon circles `explorer`/`hovered`/`selected` for marker mode; `mouseout` fires `onFeatureHover(null)` before `resetStyle` so `styleFeature` sees cleared hover state; compliant attribution), GreeceBoundaryMap (prefecture/region boundary polygon map fed by location `boundary_geojson` first with static fallback; now exports shared feature-lookup helpers used by both homepage + location explorers, supports linked-hover hooks (`onLocationHover`/`onLocationSelect`/`onLayerInit`), and can render markers alongside polygons; feature properties include `userCount`+`moderatorPreview` from location objects; supports per-prefecture `boundary_color`), LocationPickerMap (interactive click/drag coordinate picker reused by location create/edit flows), **MapViewportPickerMap** (interactive pan/zoom viewport picker: user navigates the map to the desired default view; `moveend`/`zoomend` fire `onChange({lat,lng,zoom})`; centred crosshair SVG overlay; used in `LocationEditForm` and admin `/admin/locations` form for `map_default_center_lat`/`map_default_center_lng`/`map_default_zoom` fields — numeric precision inputs remain below the map as manual-override fields) |
| `political/` | 1 | AnalyticalMappingExplorer (reusable political map + detail panel powered by external metadata/GeoJSON in `config/map-data/*`, with region/district joins via stable IDs and location-search links) |
| `civicQuestions/` | 5 | CivicQuestionCard, CivicQuestionForm (includes `commissionRequirement` field), CivicQuestionVoting, CivicQuestionResults, statusUtils |
| `polls/` | 5 | PollCard, PollForm, PollResults, PollVoting |
| `organization/` | 1 | OrgAvatar (shared organization logo/fallback avatar used by SuggestionCard and PollCard identity rows) |
| `profile/` | 18 | ProfileBadgesSection, ProfileBasicInfoForm, ProfileBioSection, ProfileCompleteness, ProfileDangerZone, ProfileExpertiseSection (searchable tag picker, max 5, hides input at max), ProfileHomeLocationSection, ProfileInterestsSection, ProfileLocationSection, ProfileManifestSection, ProfilePoliticsSection, ProfileProfessionsSection (4-level cascade: domain→profession→specialization→subspecialization, i18n labels, max 5), ProfilePrivacySection, ProfileSecuritySection, ProfileSocialLinksSection, ProfileTwitchSection, TwitchEmbed |
| `ui/` | 23+ | AlertMessage, ConfirmDialog, DropdownMenu, EmptyState, FilterBar (toggle has explicit visible sizing `h-10 min-w-10`; expanded inputs render below toggle and switch to `w-full` on mobile to avoid overflow), **ListPageToolbar** (shared search+filter+action row for list pages: `searchSlot`/`filtersSlot`/`actionsSlot`/`extraSlot`; primary row switches at `md` with wrap safeguards and search `md:min-w-[240px]` to prevent collapse/overlap), LanguageSwitcher (profile settings locale switch; supports `EL`/`EN`/`RO` and writes `NEXT_LOCALE` cookie), LoadMoreTrigger, LocationFilterBreadcrumb (`🏠 home-location filter button` — shows breadcrumb drill-down when active, X to clear; used in `/users` FilterBar), LocationSelector, LoginLink (`redirectTo` supported), Pagination, RateLimitBanner (countdown timer + auth-aware 429 UX), ShareModal (supports regular share link + optional embed URL + iframe code copy flow), SkeletonLoader, TagInput, Tooltip |
| Root | 20+ | ContactForm, DiasporaModal, EndorsementPanel, PartyBadge, ProtectedRoute, ReportButton, SuggestionCard, UserCard, VerifiedBadge |

### Layout resilience notes (mobile)
- `components/layout/TopNav.js`: **plain in-flow header (no fixed/sticky or scroll behavior)** with grouped IA redesign — desktop top-level nav now uses 3 `DropdownMenu` sections: **Ενημέρωση** (`/articles`, `/news`, `/videos`), **Συμμετοχή** (`/polls`, `/civic-questions` labeled `Civic Polls`, `/suggestions`), **Κοινότητα** (`/locations`, `/cameras`, `/users`), and **Σελίδες** (`/platform`, `/elections`, `/citizen-help`, `/education`) without the legacy `/pages` item or `/education/ai`. Desktop/nav-auth switch now happens at `md` (`hidden md:flex`) while hamburger + mobile panel stay active below `md` (`md:hidden`). Section triggers and dropdown items highlight active routes, default `DropdownMenu` triggers provide keyboard/ARIA behavior, and the mobile toggle SR label now flips correctly between open/close states. Unauthenticated CTAs are hierarchical (`/register` primary solid, `/login` secondary outline). Mobile menu (`#mobile-menu`) remains independently scrollable (`max-h-[calc(100dvh-4rem)] overflow-y-auto`), mirrors grouped sections with icons + `min-h-11` touch targets/focus-visible styles, closes immediately on mobile section/auth link taps, and locks body scroll while open (restored on close/unmount). Mobile auth dropdown still uses `menuClassName="w-full max-h-[55vh] overflow-y-auto"` for internal scrolling. **`CountrySwitcher` is not rendered anywhere in `TopNav`**; country selection is available via country pages and the geo entry flow (`CountryEntryPopup` on `/`).
- `components/layout/Footer.js`: footer newsletter signup card is now guest-only (`useAuth` + `!loading && !user`) and hidden for authenticated users; logged-in newsletter preference is managed from `/profile`.
- `components/layout/AppShell.js`: `/embed/*` routes intentionally hide `TopNav`, `Footer`, and `CookieBanner` so iframe embeds render as standalone cards without site chrome, while all non-embed routes preserve the standard shell.
- `components/layout/HomeHero.js`: arrow navigation row is always rendered and hidden with `invisible` when not needed, preventing hero height jumps during async slide loading. A fixed uppercase tagline (`Η πλατφόρμα πολιτικής συμμετοχής για κάθε πολίτη`) now appears above slide titles. CTA logic is simplified: guests get two primary actions (`Εγγραφή`, `Βρες την Περιοχή σου`), logged-in users get location + polls, and only `admin`/`moderator` roles see the admin link. `NAV_CARDS` now has three value-proposition cards linking to `/polls`, `/suggestions`, and `/locations`.
- `app/locations/[slug]/page.js`, `components/locations/LocationHeader.js`, `components/locations/LocationChildrenExplorer.js`, `components/locations/LocationRelatedLocations.js`, `components/locations/LocationTabs.js`: location detail participation-first refinement — `#location-content` now appears immediately below the hero/header, `polls` + `suggestions` tabs stay visible even when empty, and `Τοπικές πληροφορίες` is omitted when no real section data exists. Header quick actions enforce one primary participation CTA (`Ψήφισε τώρα` or `Κάνε πρόταση`) with edit demoted to a compact icon near the title, and header spacing is tightened via a denser desktop `7/5` split. `LocationChildrenExplorer` provides the unified child-location map+pills section and now uses a desktop split explorer (square map left, pills panel right) while keeping mobile stacked. Child-location wording stays context-aware (`country` → `Νομοί / Περιφέρειες`, `prefecture` → `Δήμοι`, fallback `Υποπεριοχές`) in section headings/counters/aria text. Poll cards inside location tabs now render in a denser responsive grid (`md:grid-cols-2`) with explicit add-action empty-state copy.
- `components/LocationSections.js`: announcements now render lighter severity cards with explicit labels (`Ενημέρωση`, `Προειδοποίηση`, `Επείγον`) mapped from priority, reducing visual heaviness while preserving prominence.
- `components/LocationRoles.js`: representatives list now uses clearer hierarchy/actionability (assignment count, role badges, emphasized names, and direct “Προβολή προφίλ” CTA per card) and can render a public actionable empty state when no assignments exist.
- `components/LocationRoleManager.js`: assignee picker now normalizes usernames via `getDisplayUsername(...)` and suppresses placeholder/fallback values (trimmed, case-insensitive `unknown`) from `@username` chips while keeping valid username-only display-name fallback behavior; regression coverage in `__tests__/location-role-manager.test.js`.
- `components/SuggestionCard.js`, `components/InlineSuggestionVote.js`, `app/suggestions/[id]/page.js`: vote rows use `flex-wrap` on the parent footer row so vote controls wrap below metadata on narrow viewports. `SuggestionCard` now also renders a `category` badge (purple) when present, a location pill for suggestions with a location but no `locals_only` vote restriction, and—for `isOfficialPost` suggestions that carry an `organization` relation—swaps the author row for the organization logo + name instead of the creator avatar.
- `components/polls/PollCard.js`: footer identity row now mirrors `SuggestionCard` behavior for official organization content — when `poll.isOfficialPost && poll.organization`, it renders organization logo (or fallback icon) + organization name via shared `components/organization/OrgAvatar.js`; regular user/anonymous creator behavior remains unchanged.
- **Tactile depth**: `components/ui/Card.js` default variant uses `shadow-sm border border-gray-200`; elevated variant uses `shadow-md border border-gray-200`; hoverable cards add `hover:shadow-md hover:-translate-y-0.5 transition-all duration-150` for a subtle lift effect. The `.card` CSS utility class (in `app/globals.css`) also gains hover lift + `shadow-sm` border treatment.
- **Static-page shell stability**: `components/layout/StaticPageLayout.js` outer wrapper now uses explicit non-hover container classes (`bg-white rounded-lg shadow-sm border border-gray-200 p-8`) instead of the generic `card` class. This ensures the static-page content box never shifts on hover in/out (the `.card` CSS utility includes hover lift/transform transitions that are intentional for interactive cards but incorrect for a static-page shell).
- **Υπέρ/Κατά tints**: `app/civic-questions/[id]/CivicQuestionDetailClient.js` renders the pros section with `bg-green-50 border-green-200` and the cons section with `bg-red-50 border-red-200`; each heading includes a semantic icon (✅/❌) so the distinction is not color-only.
- **Vote micro-interactions**: `components/InlineSuggestionVote.js`, `components/civicQuestions/CivicQuestionVoting.js`, `components/polls/PollCard.js` (inline voting), and `components/polls/PollVoting.js` (`BinaryPollOptions`) all apply `animate-vote-pop` briefly to the clicked button via a 280ms `setTimeout` state clear. The animation keyframe is defined in `app/globals.css` inside `@media (prefers-reduced-motion: no-preference)` so reduced-motion users see no animation.
- `app/layout.js` keeps `<main className="flex-grow">` without nav-height compensation because `TopNav` is in normal flow. It also mounts `GoogleAnalytics` and `GeoTracker`; `GeoTracker` posts pathname-based telemetry to `/api/admin/geo-stats/track` via `geoAdminAPI.trackVisit(...)`. Tracking fires unconditionally on every pathname change — no analytics consent required — because it is security/anti-tampering telemetry. Optional analytics (GoogleAnalytics) now defaults to enabled when configured and only turns off when cookie settings persist an explicit `analytics: false` choice.

---

## API Client Modules (30)

All in `lib/api/`, barrel-exported via `lib/api/index.js`. Each uses `apiRequest` helper with automatic CSRF.

| Module | Domain |
|--------|--------|
| admin.js | Admin endpoints (system health, worker-status health/test-snapshot, and worker-token list/create/revoke helpers) |
| articles.js | Article CRUD |
| auth.js | Authentication |
| badges.js | Badge system |
| bookmarks.js | Bookmarks |
| client.js | HTTP client (axios base config) |
| comments.js | Comments |
| civicQuestions.js | Civic questions CRUD, voting, results |
| dreamTeamAPI.js | Dream team |
| endorsements.js | Endorsements |
| geo.js | Geo detect + public country funding |
| geoAdmin.js | Admin geo-traffic analytics + country funding CRUD |
| geoAccess.js | Admin geo access rules/settings CRUD |
| heroSettings.js | Hero settings |
| homepageSettings.js | Homepage settings |
| ipRules.js | IP whitelist/blacklist management |
| linkPreview.js | Link previews |
| locations.js | Locations; exports: `locationAPI`, `locationRequestAPI`, `locationSectionAPI` (`getSections`, `createSection`, `updateSection`, `deleteSection`, `reorderSections`, `getAllCameras`), `locationRoleAPI`, `locationElectionAPI`, `locationPlatformRoleAPI` (admin: list/add/remove UserLocationRole assignments), `electoralDistrictAPI` (municipality↔district mapping: getMunicipalityDistricts, getDistrictMunicipalities, addMapping, removeMapping) |
| manifest.js | Manifests |
| messages.js | Messages |
| newsletter.js | Newsletter public subscribe/unsubscribe + authenticated `/me/preference` read/update + admin subscriber management (CSV import/export) + campaign CRUD/schedule/due-processing/test-send/send/log endpoints |
| organizations.js | Organizations CRUD + members |
| personRemovalRequests.js | Removal requests |
| persons.js | Person profiles |
| polls.js | Polls |
| reports.js | Reports |
| stats.js | Statistics |
| suggestions.js | Suggestions |
| tags.js | Tags |

---

## Hooks (7)

| Hook | Purpose |
|------|---------|
| useAsyncData.js | Async data fetching with loading/error/refetch |
| useInfiniteData.js | Infinite pagination with accumulated items + reset dependencies |
| useFetchArticle.js | Fetch single article with metadata |
| useFilters.js | Filter + pagination state management |
| useOAuthConfig.js | OAuth configuration & provider detection |
| useProfileForm.js | Profile page form state/effects/handlers (profile load, dirty tracking, OAuth callback parsing, badges/manifests/follow-count loading, and all profile/settings actions) |
| usePermissions.js | User permissions/role checking |

---

## Constants

### Backend (`src/constants/`)
| File | Contents |
|------|----------|
| articleTypes.js | Article type ENUM: `personal`, `articles`, `news`, `video` |
| expertiseAreas.js | Expertise tag IDs — re-exports from `src/data/expertiseTags.json` taxonomy (CJS) |

### Frontend (`lib/constants/`)
| File | Contents |
|------|----------|
| expertiseAreas.js | Expertise tag IDs — re-exports from `src/data/expertiseTags.json` taxonomy (ESM mirror) |
| i18n.js | Locale constants (`DEFAULT_LOCALE='el'`, `SUPPORTED_LOCALES=['el','en','ro']`) |
| locations.js | Location type definitions + location detail tab constants (`VALID_TABS`: `polls/news/articles/users/unclaimed/suggestions/elections`) |
| profile.js | Profile field definitions |

### Config (`config/`)
| File | Contents |
|------|----------|
| articleCategories.json | Article types with bilingual category lists |
| badges.json | 8 badge definitions, 3 tiers each |
| organizationContent.json | Shared organization phase-3 content enums (`visibilities`, `suggestionTypes`) for backend/frontend |
| organizationTypes.json | Shared Organization type list (`company`, `organization`, `institution`, `school`, `university`, `party`) |

### Data (`src/data/`)
| File | Contents |
|------|----------|
| professions.json | **v2 hierarchical profession taxonomy** — 14 domains, each with professions → specializations → subspecializations. Canonical ID format: kebab-case. Replaces old 3-level category/profession/subProfession structure. |
| expertiseTags.json | **v1 expertise tag definitions** — ~70 tags with `id`, `label`, and `domainIds[]`. Tag IDs are the canonical stored format in `User.expertiseArea`. |
| interests.json | User interest categories (category/interest/subInterest) |

---

## Migrations (94)

Listed chronologically. Core schema → feature additions → dated refactors.

<details>
<summary>Click to expand full migration list</summary>

| # | File | Description |
|---|------|-------------|
| 000 | 000-create-base-tables.js | Users, Articles base tables |
| 001 | 001-create-locations-table.js | Locations table |
| 002 | 002-create-location-links-table.js | LocationLinks table |
| 003 | 003-add-user-columns.js | Additional user columns |
| 004 | 004-add-user-searchable.js | User searchable flag |
| 20260517211000 | 20260517211000-add-profile-visibility-to-users.js | Adds `Users.profileVisibility` (`hidden/registered/public`), backfills from legacy `searchable` (`false->hidden`, `true->registered`), then removes runtime `searchable` column |
| 20260518162000 | 20260518162000-add-hide-creator-to-suggestions.js | Adds `Suggestions.hideCreator` boolean (default `false`) for suggestion-level creator anonymity |
| 005 | 005-add-location-wikipedia-url.js | Location Wikipedia URL |
| 006 | 006-create-poll-tables.js | Polls, PollOptions, PollVotes |
| 007 | 007-add-poll-to-location-links.js | Poll-location links |
| 008 | 008-update-poll-option-urls.js | Poll option URLs |
| 009 | 009-add-poll-category.js | Poll categories |
| 010 | 010-add-wikipedia-cache-fields.js | Wikipedia cache |
| 011 | 011-add-google-oauth-fields.js | Google OAuth |
| 012 | 012-fix-google-access-token-length.js | Token length fix |
| 013 | 013-add-user-agent-to-poll-votes.js | Vote user agent |
| 014 | 014-increase-varchar-fields-to-text.js | VARCHAR → TEXT |
| 015 | 015-add-creator-visibility-fields.js | Creator visibility |
| 016 | 016-create-bookmarks-table.js | Bookmarks |
| 017 | 017-add-international-location.js | International locations |
| 018 | 018-create-messages-table.js | Messages |
| 019 | 019-fix-location-uniqueness.js | Location dedup |
| 020 | 020-add-tags-to-polls.js | Poll tags |
| 021 | 021-create-follows-table.js | Follows |
| 022 | 022-create-comments-table.js | Comments |
| 023 | 023-add-comment-settings.js | Comment settings |
| 024 | 024-add-user-profile-fields.js | Profile fields |
| 025 | 025-create-location-requests-table.js | Location requests |
| 026 | 026-create-location-sections-table.js | Location sections |
| 027 | 027-create-endorsements-table.js | Endorsements |
| 028 | 028-create-suggestions-tables.js | Suggestions, Solutions, SuggestionVotes |
| 029a | 029-add-article-embed-fields.js | Article embeds |
| 029b | 029-add-problem-request-type.js | Problem request type |
| 030 | 030-create-link-preview-cache-table.js | Link preview cache |
| 031 | 031-add-video-article-type.js | Video article type |
| 032a | 032-remove-isnews-from-articles.js | Backfill `type='news'` from legacy `isNews`, then drop `Articles.isNews` |
| 032b | 032-alter-link-preview-cache-title-to-text.js | Cache title → TEXT |
| 033a | 033-migrate-poll-tags-to-taggable-items.js | Migrate legacy `Polls.tags` JSON into `TaggableItems`, then drop column |
| 033b | 033-add-candidate-role-to-users.js | Candidate role |
| 034 | 034-create-candidate-tables.js | PublicPersonProfiles, CandidateApplications |
| 035 | 035-add-position-to-candidates.js | Candidate position |
| 036 | 036-add-appointment-fields.js | Appointment fields |
| 037 | 037-add-candidate-profile-id.js | Candidate profile ID |
| 038 | 038-ensure-public-person-profiles.js | Idempotent PPP fix |
| 039 | 039-add-binary-poll-type.js | Binary poll type |
| 040 | 040-add-poll-custom-colours.js | Poll colours |
| 041 | 041-add-news-sources-section-type.js | News sources section |
| 042 | 042-add-poll-vote-restriction.js | Poll voteRestriction enum + remove allowUnauthenticatedVotes |
| 043 | 043-add-suggestion-visibility-vote-restriction.js | Suggestion visibility/voteRestriction enums |
| — | 20260330120000-create-person-removal-requests.js | Removal requests |
| — | 20260330130000-create-reports.js | Reports |
| — | 20260331000000-create-dream-team-tables.js | Dream team core |
| — | 20260331100000-seed-government-positions.js | Seed positions |
| — | 20260331200000-seed-government-current-holders.js | Seed holders |
| — | 20260331300000-create-government-position-suggestions.js | Position suggestions |
| — | 20260331400000-seed-government-position-suggestions.js | Seed suggestions |
| — | 20260401000000-refactor-dream-team-schema.js | Dream team refactor |
| — | 20260401500000-add-dob-professions-interests.js | User DOB, professions |
| — | 20260402000000-add-candidate-user-to-dream-team-votes.js | DT vote candidate ref |
| — | 20260402000000-ensure-parliament-speaker-position.js | Parliament speaker |
| — | 20260402100000-add-user-id-to-dream-team.js | DT user ID |
| — | 20260402200000-add-suggestion-category.js | Suggestion category |
| — | 20260403000000-create-formations.js | Formations |
| — | 20260403100000-add-expertise-area.js | Expertise area |
| — | 20260403200000-create-user-badges.js | User badges |
| — | 20260403300000-add-display-badge-to-users.js | Display badge |
| — | 20260403400000-add-party-id.js | Party ID |
| — | 20260403500000-remove-candidate-tables.js | Remove old candidate tables |
| — | 20260404000000-create-location-roles.js | Location roles |
| — | 20260405000000-remove-people-section-type.js | Remove people section |
| — | 20260405100000-cleanup-inactive-holders.js | Cleanup holders |
| — | 20260406000000-create-hero-settings.js | Hero settings |
| — | 20260406100000-rename-name-fields.js | Rename name fields |
| — | 20260406200000-create-manifests.js | Manifests |
| — | 20260407100000-add-placeholder-fields.js | Placeholder user fields (superseded) |
| — | 20260407200000-remove-person-id-columns.js | Remove person ID cols |
| — | 20260407300000-add-nationality-languages-to-users.js | User nationality/languages |
| — | 20260408000000-create-unified-tags.js | Tags/TaggableItems tables; removes tags JSON from Articles and Polls |
| — | 20260408000001-add-nationality-fields.js | Add nationality to Users and (if present) PublicPersonProfiles |
| — | 20260410000000-create-ip-access-rules.js | IpAccessRules table (whitelist/blacklist) |
| — | 20260410100000-add-twitch-channel-to-users.js | Add twitchChannel to Users |
| — | 20260413100001-add-claim-fields-to-users.js | Add claim fields + person profile fields to Users; make email/username nullable; add slug |
| — | 20260413100002-migrate-public-person-profiles-to-users.js | Data migration: copy PublicPersonProfiles rows to Users; update FK references |
| — | 20260413100003-drop-public-person-profiles-table.js | Drop PublicPersonProfiles; remove personId from LocationRoles; finalize PersonRemovalRequests |
| — | 20260413100004-drop-placeholder-user-id-and-is-placeholder.js | Drop isPlaceholder from Users |
| — | 20260416000000-create-location-election-votes.js | Create LocationElectionVotes for per-role location elections |
| — | 20260419000000-create-homepage-settings.js | Create HomepageSettings single-row JSON config table |
| — | 20260419000001-ensure-nationality-in-users.js | Safely ensure Users.nationality exists |
| — | 20260420000000-create-geo-visits.js | Create GeoVisits analytics table + countryCode/createdAt indexes |
| — | 20260420000001-create-country-fundings.js | Create CountryFundings table with location unique index + status lifecycle fields |
| — | 20260420000002-add-diaspora-fields-to-users.js | Add Users.isDiaspora and Users.residenceCountryCode |
| — | 20260421000000-add-ip-to-geo-visits.js | Add nullable GeoVisits.ipAddress (STRING 45) for admin IP visibility/blocking |
| — | 20260422000000-create-country-access-rules.js | Create CountryAccessRules table for blocked country codes |
| — | 20260422000001-create-geo-access-settings.js | Create GeoAccessSettings table and upsert default unknown/no-IP access behavior |
| — | 20260422000002-add-redirect-path-to-country-access-rules.js | Add nullable CountryAccessRules.redirectPath (STRING 255) for per-country custom block redirect |
| — | 20260422000003-add-user-id-to-geo-visits.js | Add nullable GeoVisits.userId FK → Users.id (ON DELETE SET NULL) |
| — | 20260423000000-create-organizations.js | Create Organizations and OrganizationMembers tables (dialect-aware enum handling) |
| — | 20260423000001-add-organization-member-fields.js | Add OrganizationMembers.inviteToken and invitedByUserId (idempotent) |
| — | 20260423000002-add-organization-id-to-polls.js | Add nullable Polls.organizationId FK → Organizations.id + index (idempotent) |
| — | 20260423000003-add-organization-id-to-suggestions.js | Add nullable Suggestions.organizationId FK → Organizations.id + index (idempotent) |
| — | 20260423000004-add-official-post-fields.js | Add `isOfficialPost` + `officialPostScope` columns to Polls/Suggestions (idempotent) |
| — | 20260423000005-add-organization-hierarchy.js | Add nullable Organizations.parentId self-FK + index (idempotent) |
| — | 20260423000006-create-organization-analytics.js | Create OrganizationAnalytics table + unique (organizationId, date) index (idempotent) |
| — | 20260423000010-add-org-notification-types.js | Add Notification enum values `org_invite_received`, `org_join_approved`, `org_member_removed` on postgres |
| — | 20260503000000-add-population-override-to-locations.js | Add nullable `Locations.population_override` INTEGER for moderator-set population override |
| — | 20260507210000-create-civic-questions.js | Create CivicQuestions + CivicQuestionVotes tables with fixed vote choices (`agree|disagree|present`) and unique one-vote-per-user-per-question constraint |
| — | 20260508000000-add-commission-requirement-to-civic-questions.js | Add nullable `CivicQuestions.commissionRequirement` STRING for EU/Commission requirement description |
| — | 20260510000000-add-password-reset-fields-to-users.js | Add nullable `Users.resetPasswordTokenHash` + `Users.resetPasswordExpires` for secure password reset tokens |
| — | 20260510134600-create-newsletter-subscribers.js | Create `NewsletterSubscribers` table (email unique, status/source enums, locale/tags/notes, subscribe lifecycle timestamps, hashed unsubscribe token, optional createdByAdminId) |
| — | 20260510150000-create-newsletter-campaigns.js | Create `NewsletterCampaigns` table (`subject`, `previewText`, `htmlContent`, `textContent`, status enum, audienceFilters JSON, counters, sentAt, createdByAdminId) |
| — | 20260510150100-create-newsletter-send-logs.js | Create `NewsletterSendLogs` table for per-recipient campaign delivery status (`queued|sent|failed`), providerMessageId/errorMessage, sentAt, and campaign/subscriber FKs |
| — | 20260510153000-add-newsletter-campaign-scheduling.js | Add `NewsletterCampaigns.scheduledAt` (+ index) and extend campaign status enum with `scheduled` (postgres-safe enum migration) |
| — | 20260512041000-allow-repeatable-location-roles.js | Replace unique index on `LocationRoles` from `(locationId, roleKey)` to `(locationId, roleKey, userId)` for repeatable linked officials (prefecture parliamentarians) |
| — | 20260515000000-add-email-verification-fields.js | Add `Users.emailVerified` (default false), `Users.emailVerifToken` (SHA-256 hash), and `Users.emailVerifExpires` |
| — | 20260516000000-add-electoral-district-location-type.js | Add `electoral_district` to the `Locations.type` enum (PostgreSQL `ALTER TYPE … ADD VALUE`; no-op on SQLite) |
| — | 20260516000001-create-municipality-district-maps.js | Create `MunicipalityDistrictMaps` join table for many-to-many municipality↔electoral district mappings; unique index on (municipalityId, electoralDistrictId) |
| — | 20260520000000-add-is-primary-to-formations.js | Add `Formations.isPrimary` BOOLEAN and index on (userId, isPrimary) for efficient identification of serious government compositions |
| — | 20260523201500-add-location-map-defaults-and-boundary-color.js | Add `Locations.boundary_color`, `Locations.map_default_center_lat`, `Locations.map_default_center_lng`, `Locations.map_default_zoom` for territory styling and viewport fallback configuration |
| — | 20260612000000-create-organization-roles.js | Create `OrganizationRoles` table with FK to Organizations, nullable userId/personId FKs to Users, title/category/description/sortOrder/isCurrent; indexes on organizationId, userId, personId, (organizationId, isCurrent) |

</details>

---

## Tests (147 suites)

### Component Tests
AdminHeader, AdminTable, AdminTableActions, ArticleCard, AppShell embed routing, Cameras page, ConfirmDialog, DropdownMenu, EntityEmbedView, FilterBar, FollowButton, Footer newsletter visibility, ListPageToolbar, LoadMoreTrigger, Pagination, RateLimitBanner, ShareModal embed flow, SkeletonLoader, TagInput, Tooltip, ReportButton

### Feature/Integration Tests
api-client, civicQuestions, electoral-districts, embed-utils, newsletter, personRemovalRequest, report, app, article-form, comments, community-stats, delete-account, encryption, endorsements, frontend, google-analytics, imageUpload, link-preview, location-elections, location-phase2-ui, location-phase3-ui, location-sections, location-tabs, locations, migrations, oauth, password-reset, persons, polls, profile-components, proxy-error-handling, public-profile, rate-limit-banner, rate-limit-voting, security, specialist-matching, suggestions, top-nav grouped menu, uploads-proxy, user-profiles-verification, user-stats, wikipediaFetcher, worker-status-admin, worker-status-page, worker-ws-server

### Hook Tests
useAsyncData, useInfiniteData, useFetchArticle, useFilters, useOAuthConfig, usePermissions

---

## Scripts

| File | Purpose |
|------|---------|
| scripts/deploy.sh | Deployment automation |
| scripts/setup-db.sh | Database setup |
| scripts/start-frontend.js | Next.js frontend startup |
| scripts/test-api.sh | API testing |

---

## CI Workflows

| File | Purpose |
|------|---------|
| .github/workflows/quality.yml | Pull request and main-branch quality gate: install, lint, Jest CI test run, and Next.js production build |
| .github/workflows/security-audit.yml | Production dependency audit gate plus report-only full audit |
| .github/workflows/deploy.yml | Main-branch VPS deployment over SSH |

---

## npm Scripts

```bash
npm run dev                  # Backend dev server (nodemon)
npm run frontend             # Frontend dev server (port 3001)
npm start                    # Backend production
npm run frontend:build       # Build frontend
npm run frontend:start       # Start frontend production
npm test                     # Jest with coverage
npm run test:ci              # Jest CI run without coverage, serialized for stability
npm run test:watch           # Jest watch mode
npm run lint                 # ESLint (src, app, components, hooks, lib)
npm run migrate              # Run migrations
npm run migrate:up           # Run migrations up
npm run migrate:down         # Roll back last migration
npm run migrate:status       # Migration status
npm run migrate:article-types # Deprecated no-op helper (legacy isNews backfill script)
npm run seed                 # Seed database
npm run seed:locations       # Seed locations
npm run seed:government-positions        # Seed positions
npm run seed:government-current-holders  # Seed holders
```
