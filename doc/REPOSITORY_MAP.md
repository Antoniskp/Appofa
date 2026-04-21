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

> **Last updated**: 2026-04-21
>
> This document is a living map of the entire codebase. AI agents read and update it automatically.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Models (40)](#models-40)
- [API Routes (26 files, 157+ endpoints)](#api-routes-26-files-157-endpoints)
- [Controllers (21)](#controllers-21)
- [Services (8)](#services-8)
- [Middleware (8)](#middleware-8)
- [Frontend Pages (100)](#frontend-pages-100)
- [Components (120+)](#components-120)
- [API Client Modules (26)](#api-client-modules-26)
- [Hooks (6)](#hooks-6)
- [Constants](#constants)
- [Migrations (77)](#migrations-77)
- [Tests (49 files)](#tests-49-files)
- [Scripts](#scripts)
- [npm Scripts](#npm-scripts)

---

## Directory Structure

```
Appofa/
├── proxy.js                 # Next.js edge proxy (country redirect)
├── i18n.js                  # next-intl request config (cookie-based locale/messages)
├── messages/                # next-intl locale messages (el.json, en.json; namespaces: common/nav/footer/home/auth/articles/news/profile/admin/editor/polls/static_pages)
├── src/                    # Backend (Express + Sequelize)
│   ├── controllers/        # Request handlers (21 files)
│   ├── services/           # Business logic (8 files)
│   ├── models/             # Sequelize models (40 models)
│   ├── routes/             # Express route definitions (26 files)
│   ├── middleware/         # Auth, CSRF, rate-limit, error handling (7 files)
│   ├── migrations/         # DB migrations (77 files)
│   ├── config/             # database.js, securityHeaders.js
│   ├── constants/          # articleTypes.js, expertiseAreas.js
│   ├── scripts/            # run-migrations.js, seed scripts
│   ├── utils/              # Utility helpers
│   └── index.js            # Express app entry point
│
├── app/                    # Frontend (Next.js App Router, 99 pages)
│   ├── (statics)/          # Static content pages (46 pages)
│   ├── admin/              # Admin dashboard (19 pages)
│   ├── articles/           # Article CRUD pages
│   ├── polls/              # Poll pages
│   ├── suggestions/        # Suggestion pages
│   ├── dream-team/         # Dream team feature
│   ├── persons/            # Person profile pages
│   ├── locations/          # Location pages
│   └── ...                 # Auth, profile, bookmarks, etc.
│
├── components/             # Reusable React components (120+ files)
│   ├── admin/              # Admin UI (5 files)
│   ├── articles/           # Article components (9 files)
│   ├── comments/           # Comment components (2 files)
│   ├── dream-team/         # Dream team components (17 files)
│   ├── follow/             # Follow button (1 file)
│   ├── layout/             # Layout, nav, footer (8 files)
│   ├── locations/          # Location components (4 files)
│   ├── polls/              # Poll components (5 files)
│   ├── profile/            # Profile components (12 files)
│   └── ui/                 # Shared UI primitives (20+ files)
│
├── lib/                    # Shared frontend utilities
│   ├── api/                # API client modules (26 files)
│   ├── constants/          # Frontend constants (3 files)
│   ├── utils/              # Utility helpers
│   └── auth-context.js     # Auth context provider
│
├── hooks/                  # Custom React hooks (6 files)
├── config/                 # articleCategories.json, badges.json
├── __tests__/              # Jest test suites (46 files)
├── doc/                    # Documentation (30+ files)
├── scripts/                # Deployment & setup scripts
├── public/                 # Static assets
└── .github/                # CI workflows, agents, copilot instructions
```

---

## Models (40)

| Model | Table | Key Fields | Key Associations |
|-------|-------|-----------|------------------|
| User | Users | id, username (nullable), email (nullable), password, role, firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, avatar, githubAvatar, googleAvatar, slug (nullable, unique), photo, claimStatus (null=regular user, unclaimed/pending/claimed=person profile), claimedByUserId, createdByUserId, searchable, expertiseArea, displayBadge | hasMany: Article, Poll, PollVote, Message, Bookmark, Comment, Formation, UserBadge; belongsToMany: User (follows); self-referential: claimedBy, claimVerifiedBy, createdByModerator |
| Article | Articles | id, title, content, summary, bannerImageUrl, authorId, status, type, category, publishedAt | belongsTo: User; hasMany: Comment; belongsToMany: Tag (via TaggableItems) |
| Poll | Polls | id, title, description, category, type, visibility, voteRestriction, resultsVisibility | belongsTo: User, Location; hasMany: PollOption, PollVote; belongsToMany: Tag (via TaggableItems) |
| PollOption | PollOptions | id, title, description, mediaUrl, pollId, userId | belongsTo: Poll, User; hasMany: PollVote |
| PollVote | PollVotes | id, pollId, pollOptionId, userId, isAnonymous, userAgent | belongsTo: Poll, PollOption, User |
| Location | Locations | id, name, name_local, type, parent_id, code, slug, lat, lng | hasMany: children, LocationLink, LocationSection, LocationRole, LocationElectionVote; belongsTo: parent |
| LocationLink | LocationLinks | id, locationId, url, type, pollId | belongsTo: Location, Poll |
| LocationSection | LocationSections | id, locationId, sectionType, title, content, createdByUserId | belongsTo: Location, User |
| LocationRole | LocationRoles | id, locationId, roleKey, userId, sortOrder, isActive | belongsTo: Location, User |
| LocationElectionVote | LocationElectionVotes | id, locationId, roleKey, voterId, candidateUserId | belongsTo: Location, User(voter), User(candidate) |
| LocationRequest | LocationRequests | id, countryName, countryNameLocal, note, requestedByUserId, status | belongsTo: User |
| Suggestion | Suggestions | id, title, body, type, locationId, authorId, status, visibility, voteRestriction, category | belongsTo: Location, User; hasMany: Solution, SuggestionVote, Comment; belongsToMany: Tag (via TaggableItems) |
| Solution | Solutions | id, suggestionId, authorId, content, status | belongsTo: Suggestion, User |
| SuggestionVote | SuggestionVotes | id, suggestionId, userId, voteType | belongsTo: Suggestion, User |
| Comment | Comments | id, entityType, entityId, authorId, parentId, body, status | belongsTo: User, Comment (parent); hasMany: Comment (replies) |
| Message | Messages | id, type, userId, email, name, subject, message, locationId, status | belongsTo: User, Location |
| Follow | Follows | id, followerId, followingId | belongsTo: User (×2) |
| Bookmark | Bookmarks | id, userId, entityType, entityId | belongsTo: User |
| Endorsement | Endorsements | id, endorserId, endorsedId, topic | belongsTo: User (×2) |
| Report | Reports | id, contentType, contentId, category, message, reporterEmail, status | — |
| Formation | Formations | id, userId, name, description, slug, totalVotes, isPublished | belongsTo: User; hasMany: FormationPick, FormationLike, DreamTeamVote |
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
| HomepageSettings | HomepageSettings | id, manifestSection(JSON), infoSection(JSON) | — |
| Tag | Tags | id, name (unique lowercase) | hasMany: TaggableItem; belongsToMany: Article, Poll, Suggestion (via TaggableItems) |
| TaggableItem | TaggableItems | id, tagId, entityType (article\|poll\|suggestion), entityId | belongsTo: Tag |
| IpAccessRule | IpAccessRules | id, ip (STRING 45, unique), type (whitelist\|blacklist), reason, createdByUserId | belongsTo: User (createdBy) |
| GeoVisit | GeoVisits | id, countryCode, countryName, isAuthenticated, isDiaspora, sessionHash, ipAddress, path, locale | Standalone analytics table |
| CountryFunding | CountryFundings | id, locationId (unique), goalAmount, currentAmount, donorCount, status, donationUrl, unlockedAt, unlockedByUserId | belongsTo: Location (`location`), User (`unlockedBy`) |

---

## API Routes (26 files, 157+ endpoints)

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /csrf | — | Get CSRF token |
| POST | /register | — | Register |
| POST | /login | — | Login |
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
| GET | /users/public-stats | — | Public user stats |

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
| GET | / | opt | List polls |
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

### Suggestions (`/api/suggestions`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | opt | List suggestions |
| GET | /category-counts | — | Category counts |
| GET | /:id | opt | Get suggestion |
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
| GET | /:locationId/sections | — | Get sections |
| POST | /:locationId/sections | mod | Create section |
| PUT | /:locationId/sections/reorder | mod | Reorder sections |
| PUT | /:locationId/sections/:id | mod | Update section |
| DELETE | /:locationId/sections/:id | mod | Delete section |
| GET | /:locationId/roles | — | Get roles |
| PUT | /:locationId/roles | mod | Upsert roles |
| GET | /:locationId/elections | opt | Get elections/live results with hierarchical `canVote` (includes descendant locations) |
| POST | /:locationId/elections/:roleKey/vote | ✅ | Cast or change vote |
| DELETE | /:locationId/elections/:roleKey/vote | ✅ | Remove vote |

### Dream Team (`/api/dream-team`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /positions | — | List positions |
| POST | /vote | ✅ | Cast vote |
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
| GET | / | opt | List persons (claimStatus IS NOT NULL users) |
| GET | /search | — | Search person profiles by name |
| GET | /unified-search | — | Unified search: person profiles + real users merged |
| GET | /claims | admin | List pending claims |
| POST | /claims/:id/approve | admin | Approve claim |
| POST | /claims/:id/reject | admin | Reject claim |
| POST | / | admin | Create unclaimed person profile (requires `firstNameEn` + `lastNameEn`; slug derived from English name) |
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
| reportRoutes.js | /api/reports | POST /, GET /, GET /content/:type/:id, GET /:id, POST /:id/review |
| personRemovalRequestRoutes.js | /api/removal-requests | POST /, GET /, GET /:id, POST /:id/review |
| manifestRoutes.js | /api/manifests | GET /, POST /, PUT /:slug, DELETE /:slug, PUT /:slug/accept, DELETE /:slug/accept, GET /:slug/supporters |
| badges.js | /api/badges | GET /my, GET /user/:userId, POST /evaluate, PUT /display |
| heroSettingsRoutes.js | /api/hero-settings | GET /, PUT /, GET /slides, POST /slides, PUT /slides/:id, DELETE /slides/:id |
| homepageSettingsRoutes.js | /api/homepage-settings | GET /, PUT / |
| linkPreviewRoutes.js | /api/link-preview | POST / |
| solutionRoutes.js | /api/solutions | POST /:id/vote |
| statsRoutes.js | /api/stats | GET /community, GET /user/home-location |
| tagRoutes.js | /api/tags | GET /suggestions?entityType=article\|poll\|suggestion&q=prefix |
| adminRoutes.js | /api/admin | GET /health, dream-team management endpoints, GET/POST/DELETE /ip-rules, POST /ip-rules/check |
| geoStatsRoutes.js | /api/admin/geo-stats | POST /track, GET /country-funding/:locationId/public, GET /visits, DELETE /visits?olderThanDays=N, GET /countries, GET /country-funding, POST /country-funding, PUT /country-funding/:id, DELETE /country-funding/:id |
| geoDetectRoutes.js | /api/geo | GET /detect |

---

## Controllers (21)

| Controller | Domain |
|-----------|--------|
| articleController.js | Article CRUD & management |
| authController.js | Authentication, OAuth, password |
| bookmarkController.js | Bookmark management |
| commentController.js | Comment CRUD & moderation |
| dreamTeamController.js | Dream team formations, votes |
| endorsementController.js | Endorsements |
| followController.js | Follow/unfollow |
| heroSettingsController.js | Hero section config |
| linkPreviewController.js | Link preview caching |
| locationController.js | Location CRUD, sections, roles |
| locationRoleController.js | Location role management |
| locationSectionController.js | Location section management |
| manifestController.js | Manifest CRUD & acceptance |
| messageController.js | Contact messages |
| personController.js | Person profiles & claims |
| personRemovalRequestController.js | Removal requests |
| pollController.js | Poll CRUD, voting, results |
| reportController.js | Content reporting |
| statsController.js | Statistics |
| suggestionController.js | Suggestions & solutions |
| tagController.js | Unified tag system — returns tags with usage counts from Tags/TaggableItems, supports ?entityType and ?q filters |

---

## Services (9)

| Service | Purpose |
|---------|---------|
| articleService.js | Article business logic |
| authService.js | Authentication & authorization |
| badgeService.js | Badge evaluation & assignment |
| ipAccessService.js | IP whitelist/blacklist with 60s in-memory TTL cache |
| locationService.js | Location data management (hierarchy, entities split into regular users vs unclaimed person profiles) |
| oauthService.js | OAuth integration (GitHub, Google) |
| personService.js | Person profile management, claims, placeholders (unclaimed profile slugs derive from required English names) |
| pollService.js | Poll operations & calculations |
| userService.js | User management & utilities |

---

## Middleware (8)

| Middleware | Purpose |
|-----------|---------|
| proxy.js (root) | Next.js edge proxy for country detection + fire-and-forget `POST /api/geo/track` + first-visit redirect to `/country/[code]` |
| auth.js | JWT authentication (`authMiddleware`) |
| checkRole.js | Role-based access (`checkRole([...])`) |
| csrfProtection.js | CSRF token validation |
| errorHandler.js | Global error handling |
| optionalAuth.js | Optional auth (doesn't fail if unauthenticated) |
| rateLimiter.js | Rate limiting (`authLimiter`, `createLimiter`, `apiLimiter`); `ipBlockMiddleware` blocks blacklisted IPs; whitelisted IPs bypass all limiters |
| geoTrackMiddleware.js | Fire-and-forget geo visit analytics logging (`GeoVisit`) with hashed session identifier and stored visitor IP for admin workflows |

---

## Frontend Pages (100)

> i18n note: core public pages (`/`, `/login`, `/articles`, `/news`, `/profile`, `/admin`, `/editor`, `/polls`, `/instructions`, `/rules`, `/mission`, `/contribute`, `/contact`) and shared nav/footer/article cards now use `useTranslations(...)`.

### Main Pages
| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/login`, `/register` | Authentication |
| `/profile` | User profile |
| `/users`, `/users/[username]` | User list & public profiles |
| `/users/[username]/followers`, `/users/[username]/following` | Social connections |
| `/bookmarks` | Saved items |
| `/my-votes`, `/my-polls`, `/my-news` | User content |

### Content
| Route | Description |
|-------|-------------|
| `/articles`, `/articles/[id]`, `/articles/new`, `/articles/[id]/edit` | Articles |
| `/news`, `/news/[id]` | News |
| `/videos`, `/videos/[id]`, `/videos/new` | Videos |
| `/editor` | Content editor |
| `/polls`, `/polls/[id]`, `/polls/create`, `/polls/[id]/edit` | Polls |
| `/suggestions`, `/suggestions/[id]`, `/suggestions/new`, `/suggestions/[id]/edit` | Suggestions |

### Features
| Route | Description |
|-------|-------------|
| `/locations`, `/locations/[slug]` | Locations |
| `/country/[code]` | Country landing page after first-visit geo redirect |
| `/dream-team`, `/dream-team/f/[slug]` | Dream team & formations |
| `/persons`, `/persons/[slug]`, `/persons/[slug]/claim` | Person profiles |
| `/candidates/*` | Backward-compat alias for persons |
| `/worthy-citizens` | Worthy citizens page |
| `/manifest-supporters` | Manifest supporters |
| `/request-removal` | Profile removal request |

### Admin (19 pages)
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard |
| `/admin/articles` | Article management (stats, filters, pagination, view/delete/approve news) |
| `/admin/users` | User management (search, filter, role change, verify, delete) |
| `/admin/status` | System status |
| `/admin/persons/*` | Person management (list, detail, edit, create) |
| `/admin/candidates/*` | Candidate management (backward-compat) |
| `/admin/dream-team` | Dream team admin |
| `/admin/hero` | Hero settings |
| `/admin/geo` | Geo traffic dashboard (country/top paths/recent visits with IP block + log cleanup) + country funding management |
| `/admin/homepage` | Homepage settings |
| `/admin/ip-rules` | IP whitelist/blacklist management |
| `/admin/locations` | Location admin |
| `/admin/manifests` | Manifest admin |
| `/admin/messages/*` | Message admin |
| `/admin/removal-requests` | Removal request admin |
| `/admin/reports` | Report admin |

### Static Pages (46 pages in `(statics)` layout)
Informational content: about, mission, contact, contribute, instructions, FAQ, terms, privacy, rules, education guides, civic tools, platform info, categories, etc.

---

## Components (120+)

| Directory | Count | Key Components |
|-----------|-------|----------------|
| `admin/` | 5 | AdminHeader, AdminLayout, AdminSidebar, AdminTable, AdminTableActions |
| `articles/` | 9 | ArticleCard, ArticleForm, RichArticleContent, VideoEmbed, VideoPostForm |
| `comments/` | 2 | CommentForm, CommentsThread |
| `dream-team/` | 17 | FormationBuilder, FormationCard, FormationView, Leaderboard, PersonSearch, ShareModal, PositionCard |
| `follow/` | 1 | FollowButton |
| `layout/` | 8 | TopNav, Footer, HomeHero, ToastProvider, StaticPageLayout |
| `locations/` | 7 | CountryFundingBanner, LocationBreadcrumb, LocationCard, LocationEditForm, LocationElectionsTab, LocationHeader, LocationTabs |
| `polls/` | 5 | PollCard, PollForm, PollResults, PollVoting |
| `profile/` | 14 | ProfileAboutSection, ProfileBadgesSection, ProfileBasicInfoForm, ProfileManifestSection, ProfileTwitchSection, TwitchEmbed |
| `ui/` | 21+ | AlertMessage, ConfirmDialog, DropdownMenu, EmptyState, FilterBar, LanguageSwitcher, LoadMoreTrigger, LocationSelector, Pagination, SkeletonLoader, TagInput, Tooltip |
| Root | 20+ | ContactForm, DiasporaModal, EndorsementPanel, PartyBadge, ProtectedRoute, ReportButton, SuggestionCard, UserCard, VerifiedBadge |

### Layout resilience notes (mobile)
- `components/layout/HomeHero.js`: arrow navigation row is always rendered and hidden with `invisible` when not needed, preventing hero height jumps during async slide loading.
- `components/SuggestionCard.js`, `components/InlineSuggestionVote.js`, `app/suggestions/[id]/page.js`: vote rows use `flex-wrap` on the parent footer row so vote controls wrap below metadata on narrow viewports.

---

## API Client Modules (26)

All in `lib/api/`, barrel-exported via `lib/api/index.js`. Each uses `apiRequest` helper with automatic CSRF.

| Module | Domain |
|--------|--------|
| admin.js | Admin endpoints |
| articles.js | Article CRUD |
| auth.js | Authentication |
| badges.js | Badge system |
| bookmarks.js | Bookmarks |
| client.js | HTTP client (axios base config) |
| comments.js | Comments |
| dreamTeamAPI.js | Dream team |
| endorsements.js | Endorsements |
| geo.js | Geo detect + public country funding |
| geoAdmin.js | Admin geo-traffic analytics + country funding CRUD |
| heroSettings.js | Hero settings |
| homepageSettings.js | Homepage settings |
| ipRules.js | IP whitelist/blacklist management |
| linkPreview.js | Link previews |
| locations.js | Locations |
| manifest.js | Manifests |
| messages.js | Messages |
| personRemovalRequests.js | Removal requests |
| persons.js | Person profiles |
| polls.js | Polls |
| reports.js | Reports |
| stats.js | Statistics |
| suggestions.js | Suggestions |
| tags.js | Tags |

---

## Hooks (6)

| Hook | Purpose |
|------|---------|
| useAsyncData.js | Async data fetching with loading/error/refetch |
| useInfiniteData.js | Infinite pagination with accumulated items + reset dependencies |
| useFetchArticle.js | Fetch single article with metadata |
| useFilters.js | Filter + pagination state management |
| useOAuthConfig.js | OAuth configuration & provider detection |
| usePermissions.js | User permissions/role checking |

---

## Constants

### Backend (`src/constants/`)
| File | Contents |
|------|----------|
| articleTypes.js | Article type ENUM: `personal`, `articles`, `news`, `video` |
| expertiseAreas.js | 11 expertise area values (CJS) |

### Frontend (`lib/constants/`)
| File | Contents |
|------|----------|
| expertiseAreas.js | Expertise areas (ESM mirror) |
| i18n.js | Locale constants (`DEFAULT_LOCALE='el'`, `SUPPORTED_LOCALES=['el','en']`) |
| locations.js | Location type definitions + location detail tab constants (`VALID_TABS`, includes `unclaimed`) |
| profile.js | Profile field definitions |

### Config (`config/`)
| File | Contents |
|------|----------|
| articleCategories.json | Article types with bilingual category lists |
| badges.json | 8 badge definitions, 3 tiers each |

---

## Migrations (77)

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

</details>

---

## Tests (49 files)

### Component Tests
AdminHeader, AdminTable, AdminTableActions, ArticleCard, ConfirmDialog, DropdownMenu, FilterBar, FollowButton, LoadMoreTrigger, Pagination, SkeletonLoader, TagInput, Tooltip, ReportButton

### Feature/Integration Tests
api-client, personRemovalRequest, report, app, article-form, comments, community-stats, delete-account, encryption, endorsements, frontend, google-analytics, link-preview, location-elections, location-sections, location-tabs, locations, migrations, oauth, persons, polls, profile-components, proxy-error-handling, public-profile, security, suggestions, user-profiles-verification, user-stats, wikipediaFetcher

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

## npm Scripts

```bash
npm run dev                  # Backend dev server (nodemon)
npm run frontend             # Frontend dev server (port 3001)
npm start                    # Backend production
npm run frontend:build       # Build frontend
npm run frontend:start       # Start frontend production
npm test                     # Jest with coverage
npm run test:watch           # Jest watch mode
npm run lint                 # ESLint (src/)
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
