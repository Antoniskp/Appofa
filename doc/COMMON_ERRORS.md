# Common Errors — Recurring Mistakes from PR History

This document logs mistakes that appeared in multiple PRs, causing wasted work and fix cycles.
Read this before making any change in the related area.

---

## Table of Contents

1. [Pattern 1 — Geo Visit Tracking (broken/fixed 5 times)](#pattern-1--geo-visit-tracking)
2. [Pattern 2 — proxy.js vs middleware.js (repeated confusion)](#pattern-2--proxyjs-vs-middlewarejs)
3. [Pattern 3 — Security overrides and lockfile (4 PRs)](#pattern-3--security-overrides-and-lockfile)
4. [Pattern 4 — PollCard display (2 fix PRs)](#pattern-4--pollcard-display)
5. [Pattern 5 — Duplicate PRs](#pattern-5--duplicate-prs)
6. [Pattern 6 — Wrong field names on models](#pattern-6--wrong-field-names-on-models)
7. [Pattern 7 — Dialect-unaware migrations](#pattern-7--dialect-unaware-migrations)
8. [Pattern 8 — Bare useEffect + fetch in components](#pattern-8--bare-useeffect--fetch-in-components)

---

## Pattern 1 — Geo Visit Tracking

**Severity:** 🔴 High — broken and re-fixed 5 times  
**Related PRs:** #706, #710, #711, #712, #721

### What went wrong

- Agents removed `GeoTracker` from `app/layout.js` while refactoring the layout
- Tracking logic was moved into `proxy.js` server-side, which caused duplicate visit records (one per page navigation + one per RSC prefetch)
- `purpose: 'prefetch'` header was not checked, so Next.js prefetch requests were counted as real visits

### Why it happened

The `GeoTracker` component looks optional or like a debug tool. Its absence is not caught by tests or linting, so removing it silently broke analytics without an error.

Proxy-side tracking was attempted because `proxy.js` is the natural entry point for every request, but this resulted in double-counting since both the edge proxy and the client component fired.

### Correct pattern

- `GeoTracker` MUST stay mounted in `app/layout.js` — it is the **only** visit tracking source
- It calls `geoAdminAPI.trackVisit(pathname, locale)` on every `pathname` change via `useEffect`
- Skip requests with `purpose: 'prefetch'` header (Next.js RSC prefetches trigger this)
- Do **NOT** also track in `proxy.js` server-side — that causes duplicate visit rows
- The API module is `lib/api/geoAdmin.js`, exported as `geoAdminAPI`
- Location: `components/layout/GeoTracker.js` (or `components/GeoTracker.js`)

```js
// ✅ Correct — client-side only in app/layout.js
import GeoTracker from '@/components/layout/GeoTracker';
// ...
<GeoTracker />
```

---

## Pattern 2 — proxy.js vs middleware.js

**Severity:** 🔴 High  
**Related PRs:** #700 (WIP, not merged), #701

### What went wrong

Agents created or modified a `middleware.js` file at the Next.js app root to handle country detection and redirect logic, instead of using the existing `proxy.js`.

### Why it happened

Next.js has native support for `middleware.js` as an edge entrypoint, which is a natural place to put redirect logic. However, this project uses a custom `proxy.js` at the repository root (not inside `app/`) which handles both country redirect and request proxying together.

### Correct pattern

- **ALL** country detection, redirect logic, and request proxying lives in root `proxy.js`
- There is **NO** `middleware.js` — do not create one
- The cookie name for the detected country is `appofa_detected_country`
- CF-IPCountry header is checked first; `x-detected-country` is used as fallback
- After changes to `proxy.js`, test country redirect end-to-end before merging

```
root/
  proxy.js         ← ✅ ONLY place for edge/redirect logic
  app/
    layout.js      ← NO middleware.js here
```

---

## Pattern 3 — Security Overrides and Lockfile

**Severity:** 🔴 High — 4 PRs for the same issue  
**Related PRs:** #702, #703, #704, #705

### What went wrong

- PR #702 added `overrides` to `package.json` but didn't regenerate `package-lock.json`
- PR #703 regenerated the lockfile but introduced a conflict
- PRs #704/#705 repeated the cycle

Each PR only completed part of the work, and the dependency was not verified as resolved.

### Why it happened

Agents treated the `package.json` override and the lockfile regeneration as separate tasks. The lockfile was considered a build artifact and regenerated in a follow-up commit, causing partial states to be merged.

### Correct pattern

1. Add the pinned version to `overrides` in `package.json`:
   ```json
   "overrides": {
     "vulnerable-package": "1.2.3"
   }
   ```
2. Run `npm install` to regenerate `package-lock.json`
3. Verify the override resolved: `npm ls vulnerable-package`
4. Commit **both** `package.json` and `package-lock.json` in the **same commit**
5. Never split override + lockfile across separate PRs

---

## Pattern 4 — PollCard Display

**Severity:** 🟡 Medium — 2 fix PRs  
**Related PRs:** #722, #723

### What went wrong

- PR #722 fixed the banner image display for polls but missed the guest user info panel
- PR #723 had to fix the text shown in `renderInfoPanel()` for users who can't vote

### Why it happened

`PollCard` has two separate rendering paths: one for the banner/image area and one for the info panel (`renderInfoPanel()`). A change to one does not automatically update the other.

### Correct pattern

- When modifying poll display, check **both** the `grid` and `list` variants of `PollCard`
- Always look for the `renderInfoPanel()` method when changing vote-related UI
- Guest user messaging uses the `voteRestriction` field — **never** `allowUnauthenticatedVotes` (removed)
- Test the card with: authenticated user, unauthenticated guest, user who doesn't meet restriction

---

## Pattern 5 — Duplicate PRs

**Severity:** 🟡 Medium  
**Related PRs:** #704 (duplicate of open work), #700 (closed without merge)

### What went wrong

- A new PR was opened for an issue that already had an in-progress PR
- An agent retried a fix PR without reading the comments from the previously rejected one

### Why it happened

Agents start fresh without automatically checking the existing PR list, so they open a new PR without knowing one already exists. When a PR is closed without merging, the reason is often in the comments — ignoring those leads to repeating the same rejected approach.

### Correct pattern

- **Before starting any fix**, check `gh pr list --state open` for PRs touching the same area
- If a fix PR was closed without merging, read the closing comment for the rejection reason
- Never open a second PR for the same issue if one is already open — push to the existing branch instead

---

## Pattern 6 — Wrong Field Names on Models

**Severity:** 🟡 Medium — recurring across many tasks  
**Related PRs:** multiple

### What went wrong

- Using `allowUnauthenticatedVotes` on `Poll` (field was removed, replaced by `voteRestriction`)
- Using `isNews` flag on `Article` (never existed; use `type === 'news'`)
- Using `Polls.tags` JSON column (removed; use `Tag`/`TaggableItem` with `entityType: 'poll'`)
- Using `personId` or `isPlaceholder` on `User` (removed; use `claimStatus != null`)

### Why it happened

Old documentation and AI context windows retained stale field names. `AI_INSTRUCTIONS.md` was outdated and conflicted with the actual schema.

### Correct pattern

Always check `doc/REPOSITORY_MAP.md` and the model file in `src/models/` before referencing a field. Use the quick reference in `.github/copilot-instructions.md`:

| Model | ✅ Correct Fields | ❌ Never Use |
|-------|------------------|-------------|
| Poll | `visibility`, `voteRestriction`, `organizationId`, `isOfficialPost`, `officialPostScope` | `allowUnauthenticatedVotes`, `tags` (JSON) |
| Suggestion | `visibility`, `voteRestriction`, `organizationId` | — |
| Article | `type` (`'news'`, `'articles'`, `'personal'`, `'video'`) | `isNews` |
| User | `avatar`, `githubAvatar`, `googleAvatar`, `slug`, `claimStatus`, `firstNameEn`, `lastNameEn` | `isPlaceholder`, `personId` |
| Organization | `slug` (from `organizationService.generateSlug`), `parentId`, `isVerified` | — |
| OrganizationMember | `role` (`owner\|admin\|moderator\|member`), `status` (`active\|invited\|pending`), `inviteToken` | — |
| GeoVisit | `countryCode`, `sessionHash`, `ipAddress`, `userId` | — |

---

## Pattern 7 — Dialect-Unaware Migrations

**Severity:** 🟡 Medium  
**Related PRs:** multiple

### What went wrong

Migrations used `DataTypes.ENUM(...)` unconditionally. SQLite (used in tests) does not support ENUM natively, causing test suite failures after migration changes.

### Why it happened

Developers familiar with PostgreSQL write ENUM without checking the dialect. Tests run on SQLite and fail, while production (PostgreSQL) succeeds — masking the issue in production but breaking CI.

### Correct pattern

Always check the dialect before using ENUM in a migration:

```js
const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';

await queryInterface.addColumn('MyTable', 'status', {
  type: isPostgres
    ? DataTypes.ENUM('active', 'invited', 'pending')
    : DataTypes.STRING,
  allowNull: false,
  defaultValue: 'active',
});
```

Also, always provide an idempotent `down()` migration and clean up ENUM types on PostgreSQL:

```js
down: async (queryInterface, DataTypes) => {
  await queryInterface.removeColumn('MyTable', 'status');
  const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';
  if (isPostgres) {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_MyTable_status";');
  }
}
```

---

## Pattern 8 — Bare useEffect + fetch in Components

**Severity:** 🟢 Low-Medium  
**Related PRs:** multiple frontend PRs

### What went wrong

Components used `useEffect(() => { fetch('/api/...') }, [])` directly instead of the project's standard data-fetching hooks.

### Why it happened

`useEffect` + `fetch` is the most common React data-fetching pattern taught in tutorials. The project has abstracted this into `useAsyncData` and `useInfiniteData`, but these are internal conventions not obvious to first-time contributors.

### Correct pattern

```js
// ❌ Wrong
useEffect(() => {
  fetch('/api/polls').then(r => r.json()).then(setPolls);
}, []);

// ✅ Correct — replace-style (single fetch)
const { data, loading, error } = useAsyncData(() => pollAPI.getAll(), []);

// ✅ Correct — accumulating feed (infinite scroll)
const { items, loadMore, hasMore } = useInfiniteData(
  (page) => pollAPI.getAll({ page }),
  []
);
```

- Import API methods from `lib/api/` modules — never call `fetch()` directly in components
- Exception: fire-and-forget telemetry (e.g., `GeoTracker`) may use `useEffect` directly
