# Appofa Visual App Map

Generated: 2026-06-25
Source tree inspected: `C:\Users\ioanm\Documents\GitHub\Appofa`
Live site: https://appofasi.gr

This is a visual working map of Appofa. Keep it high-level enough to navigate the app, and use `doc/REPOSITORY_MAP.md` for the exhaustive file-by-file index.

## 1. System Map

```mermaid
flowchart TB
  User["Visitor / Citizen / Admin"] --> Browser["Browser / PWA"]
  Browser --> Nginx["Nginx HTTPS reverse proxy"]

  Nginx --> Next["Next.js 16 frontend\napp/ on port 3001"]
  Nginx --> Express["Express 5 API\nsrc/ on port 3000"]
  Nginx --> Uploads["/uploads\nserved by Express"]

  Next --> ApiProxy["Next API proxy\napp/api/[...path]/route.js"]
  Next --> UploadProxy["Upload fallback proxy\napp/uploads/[...path]/route.js"]
  ApiProxy --> Express
  UploadProxy --> Uploads

  Express --> Middleware["Middleware\nAuth, CSRF, roles, rate limits,\ngeo/IP blocks, uploads, errors"]
  Middleware --> Routes["src/routes"]
  Routes --> Controllers["src/controllers"]
  Controllers --> Services["src/services"]
  Services --> Sequelize["Sequelize ORM\nsrc/models"]
  Sequelize --> Postgres["PostgreSQL"]

  Express --> Jobs["Background jobs\nnotifications + newsletters"]
  Express --> WorkerWS["Worker WebSocket\n/ws/workers"]
  Services --> External["External services\nSMTP, OAuth, Web Push,\nYouTube/TikTok oEmbed, Wikipedia"]
```

## 2. Request Flow

```mermaid
sequenceDiagram
  actor User
  participant Next as Next.js frontend
  participant Proxy as app/api proxy
  participant API as Express API
  participant MW as Middleware
  participant Ctrl as Controller
  participant Svc as Service
  participant DB as PostgreSQL

  User->>Next: Open page or perform action
  Next->>Proxy: /api/... request
  Proxy->>API: Forward headers/body/cookies
  API->>MW: CORS, Helmet, auth, CSRF, rate limits
  MW->>Ctrl: Route handler
  Ctrl->>Svc: Business operation
  Svc->>DB: Sequelize query / transaction
  DB-->>Svc: Rows / result
  Svc-->>Ctrl: Domain result
  Ctrl-->>API: JSON response
  API-->>Proxy: Response + cookies/headers
  Proxy-->>Next: Browser response
  Next-->>User: UI update
```

## 3. Frontend Route Map

```mermaid
flowchart LR
  App["app/"] --> Public["Public content"]
  App --> Auth["Auth"]
  App --> UserArea["User area"]
  App --> Admin["Admin"]
  App --> Static["Static guidance pages"]
  App --> Utility["Utility routes"]

  Public --> Home["/"]
  Public --> Articles["/articles\n/articles/[id]\n/news\n/videos"]
  Public --> Polls["/polls\n/polls/[id]"]
  Public --> Suggestions["/suggestions\n/suggestions/[id]"]
  Public --> Civic["/civic-questions\n/civic-questions/[id]"]
  Public --> Locations["/locations\n/locations/[slug]\n/country/[code]"]
  Public --> People["/users\n/users/[username]\n/persons/[slug]\ncandidates"]
  Public --> Org["/organizations\n/organizations/[slug]"]
  Public --> Dream["/dream-team\n/dream-team/[countryCode]\n/dream-team/f/[slug]"]

  Auth --> Login["/login"]
  Auth --> Register["/register"]
  Auth --> Reset["/forgot-password\n/reset-password\n/verify-email"]

  UserArea --> Profile["/profile"]
  UserArea --> Saved["/bookmarks\n/my-votes\n/my-polls\n/my-news"]
  UserArea --> Notify["/notifications"]

  Admin --> AdminHome["/admin"]
  Admin --> AdminContent["articles, hero, homepage,\nmanifests, messages, reports"]
  Admin --> AdminUsers["users, persons, claims,\norganizations, locations"]
  Admin --> AdminOps["geo, ip-rules,\nnewsletter, worker-status"]

  Static --> Platform["/platform/*"]
  Static --> Help["/citizen-help/*"]
  Static --> Info["/about, /contact,\n/privacy, /terms, /faq"]

  Utility --> API["/api/[...path]"]
  Utility --> UploadRoute["/uploads/[...path]"]
  Utility --> Embed["/embed/[entityType]/[id]"]
```

## 4. Backend API Map

```mermaid
flowchart TB
  API["Express API\nsrc/routes/index.js"] --> Auth["/api/auth"]
  API --> Articles["/api/articles"]
  API --> Polls["/api/polls"]
  API --> Suggestions["/api/suggestions\n/api/solutions"]
  API --> Civic["/api/civic-questions"]
  API --> Locations["/api/locations"]
  API --> People["/api/persons\n/api/person-removal-requests"]
  API --> Social["/api/comments\n/api/follow\n/api/endorsements\n/api/bookmarks"]
  API --> Orgs["/api/organizations\n/api/official-posts"]
  API --> Dream["/api/dream-team"]
  API --> Admin["/api/admin\n/api/geo-stats\n/api/geo-access\n/api/ip-rules"]
  API --> Comms["/api/messages\n/api/newsletter\n/api/notifications\n/api/push"]
  API --> Platform["/api/manifest\n/api/tags\n/api/stats\n/api/reports\n/api/link-preview\n/api/badges"]

  Auth --> AuthCtrl["authController + authService"]
  Articles --> ArticleCtrl["articleController + articleService"]
  Polls --> PollCtrl["pollController + pollService"]
  Suggestions --> SuggestionCtrl["suggestionController"]
  Civic --> CivicCtrl["civicQuestionController + civicQuestionService"]
  Locations --> LocationCtrl["locationController + locationService"]
  Orgs --> OrgCtrl["organizationController + organizationService"]
  Comms --> CommSvc["newsletter/notification/push services"]
```

## 5. Feature-To-Code Map

| Feature | Frontend | API routes | Controllers | Services | Main models |
|---|---|---|---|---|---|
| Auth, profile, OAuth | `app/login`, `app/register`, `app/profile`, `components/profile`, `lib/auth-context.js` | `authRoutes.js` | `authController.js` | `authService.js`, `oauthService.js`, `userService.js` | `User`, `UserBadge`, `Follow` |
| Articles/news/videos | `app/articles`, `app/news`, `app/videos`, `components/articles`, `lib/api/articles.js` | `articleRoutes.js` | `articleController.js` | `articleService.js`, `image*Service.js` | `Article`, `Tag`, `TaggableItem`, `Comment` |
| Polls | `app/polls`, `components/polls`, `lib/api/polls.js` | `pollRoutes.js` | `pollController.js` | `pollService.js` | `Poll`, `PollOption`, `PollVote` |
| Suggestions/solutions | `app/suggestions`, `components/SuggestionCard.js`, `lib/api/suggestions.js` | `suggestionRoutes.js`, `solutionRoutes.js` | `suggestionController.js` | partly controller-led | `Suggestion`, `Solution`, `SuggestionVote` |
| Civic questions | `app/civic-questions`, `components/civicQuestions`, `lib/api/civicQuestions.js` | `civicQuestionRoutes.js` | `civicQuestionController.js` | `civicQuestionService.js` | `CivicQuestion`, `CivicQuestionVote` |
| Locations/geography | `app/locations`, `components/locations`, `components/map`, `lib/api/locations.js` | `locationRoutes.js`, `geo*Routes.js` | `location*Controller.js` | `locationService.js`, `countryAccessService.js` | `Location`, `LocationRole`, `LocationSection`, `GeoVisit`, `CountryAccessRule` |
| People/profiles | `app/users`, `app/persons`, `app/candidates`, `components/user` | `personRoutes.js`, `authRoutes.js` public-user routes | `personController.js`, `authController.js` | `personService.js`, `userService.js` | `User`, `PersonRemovalRequest`, `UserLocationRole` |
| Organizations | `app/organizations`, `components/organization`, `lib/api/organizations.js` | `organizationRoutes.js`, `officialPostsRoutes.js` | `organizationController.js` | `organizationService.js` | `Organization`, `OrganizationMember`, `OrganizationRole`, `OrganizationAnalytics` |
| Dream team | `app/dream-team`, `components/dream-team`, `lib/api/dreamTeamAPI.js` | `dreamTeamRoutes.js`, admin routes | `dreamTeamController.js` | controller-led | `Formation`, `FormationPick`, `FormationLike`, `DreamTeamVote`, `GovernmentPosition` |
| Newsletter | `app/admin/newsletter`, `app/newsletter/unsubscribe`, `components/newsletter` | `newsletterRoutes.js` | `newsletterController.js` | `newsletterService.js` | `NewsletterSubscriber`, `NewsletterCampaign`, `NewsletterSendLog` |
| Notifications/push | `app/notifications`, `components/notifications`, `lib/api/notifications.js`, `lib/api/push.js` | `notificationRoutes.js`, `pushRoutes.js` | `notificationController.js`, `pushController.js` | `notificationService.js`, `pushService.js` | `Notification`, `PushSubscription` |
| Admin/ops | `app/admin`, `components/admin`, `lib/api/admin.js` | `adminRoutes.js`, `geoAccessRoutes.js`, `geoStatsRoutes.js` | mixed | `worker*Service.js`, `ipAccessService.js` | `WorkerToken`, `IpAccessRule`, `GeoAccessSetting` |

## 6. Data Model Map

```mermaid
erDiagram
  User ||--o{ Article : authors
  User ||--o{ Poll : creates
  User ||--o{ PollVote : casts
  User ||--o{ Suggestion : authors
  User ||--o{ Comment : writes
  User ||--o{ Formation : creates
  User ||--o{ Notification : receives

  Article ||--o{ Comment : has
  Poll ||--o{ PollOption : has
  Poll ||--o{ PollVote : receives
  PollOption ||--o{ PollVote : chosen

  Location ||--o{ Poll : scopes
  Location ||--o{ Suggestion : scopes
  Location ||--o{ CivicQuestion : scopes
  Location ||--o{ LocationSection : contains
  Location ||--o{ LocationRole : assigns
  Location ||--o{ UserLocationRole : moderates
  Location ||--o{ Location : parent_child

  Suggestion ||--o{ Solution : has
  Suggestion ||--o{ SuggestionVote : receives
  CivicQuestion ||--o{ CivicQuestionVote : receives

  Organization ||--o{ OrganizationMember : has
  Organization ||--o{ OrganizationRole : has
  Organization ||--o{ Poll : publishes
  Organization ||--o{ Suggestion : publishes
  Organization ||--o{ OrganizationAnalytics : tracks

  Formation ||--o{ FormationPick : includes
  Formation ||--o{ FormationLike : receives
  GovernmentPosition ||--o{ FormationPick : slot
  GovernmentPosition ||--o{ DreamTeamVote : receives

  NewsletterCampaign ||--o{ NewsletterSendLog : sends
  NewsletterSubscriber ||--o{ NewsletterSendLog : receives

  Tag ||--o{ TaggableItem : maps
```

## 7. Middleware Map

```mermaid
flowchart LR
  Request["Incoming request"] --> Helmet["Helmet headers\nAPI only"]
  Helmet --> Cors["CORS"]
  Cors --> Body["JSON + urlencoded body"]
  Body --> Static["/uploads static"]
  Static --> IpBlock["IP blacklist/whitelist"]
  IpBlock --> Suspicious["Suspicious path block"]
  Suspicious --> Country["Country access rules"]
  Country --> Route["Route group"]

  Route --> OptionalAuth["optionalAuth"]
  Route --> Auth["auth"]
  Route --> Role["checkRole"]
  Route --> Rate["rateLimiter"]
  Route --> Csrf["csrfProtection"]
  Route --> Upload["upload.js\nMulter memory + Sharp"]
  Route --> Error["errorHandler"]
```

## 8. Frontend Module Map

```mermaid
flowchart TB
  Layout["app/layout.js\nApp shell"] --> Nav["components/layout/TopNav"]
  Layout --> Footer["components/layout/Footer"]
  Layout --> Providers["Auth context\nToast provider\nAnalytics\nGeo tracker"]

  Pages["app/* pages"] --> FeatureComponents["components/*"]
  FeatureComponents --> UI["components/ui\nbuttons, cards, filters,\nmodals, forms, pagination"]
  FeatureComponents --> APIClients["lib/api/*"]
  APIClients --> Client["lib/api/client.js\nCSRF + fetch helper"]
  Client --> NextProxy["app/api/[...path]/route.js"]

  Pages --> Hooks["hooks/*"]
  Pages --> Constants["lib/constants/*\nconfig/*.json"]
  Pages --> Messages["messages/el,en,ro.json\nnext-intl"]
```

## 9. Deployment Map

```mermaid
flowchart TB
  Internet["Internet"] --> TLS["Nginx TLS\nappofasi.gr"]
  TLS --> Frontend["Next.js process\n:3001"]
  TLS --> Backend["Express process\n:3000"]
  Backend --> DB["PostgreSQL\n:5432"]
  Backend --> Files["uploads/"]
  Backend --> SMTP["SMTP provider"]
  Backend --> Push["Web Push service"]
  Backend --> OAuth["GitHub / Google OAuth"]
  Backend --> Worker["Appofasistis worker\noptional"]
```

## 10. Where To Change Things

| Goal | Start here |
|---|---|
| Add a new public page | `app/<route>/page.js`, then add components under `components/` if reusable |
| Add an admin page | `app/admin/<area>/page.js`, `components/admin`, `lib/api/admin.js` or feature API client |
| Add a backend endpoint | `src/routes/<feature>Routes.js`, controller, service, tests |
| Add a database table | new `src/models/*.js`, update `src/models/index.js`, add `src/migrations/*.js` |
| Add a frontend API call | `lib/api/<feature>.js`, exported from `lib/api/index.js` |
| Add localized text | `messages/el.json`, `messages/en.json`, `messages/ro.json` |
| Add auth-only behavior | `src/middleware/auth.js`, `csrfProtection.js`, route ordering, `lib/api/client.js` |
| Add image upload | `src/middleware/upload.js`, `imageProcessingService.js`, `imageStorageService.js`, route controller |
| Add security headers/deployment behavior | `nginx/appofa.conf`, `config/nginx/appofasi.gr.conf`, `next.config.js`, `src/config/securityHeaders.js` |

## 11. Recommended Permanent Docs

Create or update these inside the repo:

| File | Purpose |
|---|---|
| `doc/VISUAL_APP_MAP.md` | This high-level visual map |
| `doc/ROUTE_MAP.md` | Generated-ish list of frontend routes and backend API route groups |
| `doc/DATA_MODEL_MAP.md` | Model relationship diagrams and table ownership |
| `doc/ARCHITECTURE.md` | Current system/deployment architecture, replacing older stale sections |
| `doc/REPOSITORY_MAP.md` | Exhaustive living index, updated after code changes |

## 12. Current Public Surface Summary

Major frontend route groups:

- `/`
- `/articles`, `/news`, `/videos`
- `/polls`
- `/suggestions`
- `/civic-questions`
- `/locations`, `/country/[code]`
- `/users`, `/persons`, `/candidates`
- `/organizations`
- `/dream-team`
- `/profile`, `/bookmarks`, `/notifications`, `/my-*`
- `/admin/*`
- static knowledge pages under `(statics)`

Major API route groups:

- `auth`, `articles`, `polls`, `suggestions`, `solutions`
- `locations`, `geo-detect`, `geo-stats`, `geo-access`
- `persons`, `organizations`, `official-posts`
- `comments`, `follow`, `endorsements`, `bookmarks`
- `civic-questions`, `dream-team`, `manifest`
- `newsletter`, `notifications`, `push`, `messages`
- `admin`, `reports`, `stats`, `tags`, `badges`, `link-preview`
