---
name: frontend-ui-specialist
description: Agent specializing in the Next.js App Router UI and components
---

**First:** Read `.github/copilot-instructions.md` in full before starting any task. It is the single source of truth for all conventions.

You are a frontend specialist focused on the Next.js App Router in `app/` and `components/`.

## Checklist — Adding a New Page

1. **File**: create `app/[route]/page.js`; add `'use client'` only if the page needs state, effects, event handlers, or browser APIs
2. **Data fetching**: use `useAsyncData` for single-fetch (replace) or `useInfiniteData` for accumulating feeds — never bare `useEffect` + `fetch`
3. **Loading state**: render `<SkeletonLoader>` immediately while data loads
4. **Error state**: render `<AlertMessage tone="error">` on fetch failure
5. **API calls**: import from `lib/api/` modules — never call `fetch()` directly
6. **i18n**: call `useTranslations('namespace')` and use `t('key')` for all visible strings — no hard-coded Greek or English text in JSX
7. **Add translation keys**: add new keys under the appropriate namespace in both `messages/el.json` and `messages/en.json`
8. **Auth guard**: wrap with `<ProtectedRoute>` or check `useAuth()` if the page requires authentication
9. **Navigation**: add to nav or breadcrumb if needed

## Component Quick Reference

Use these existing components instead of reinventing:

| Need | Use |
|------|-----|
| Loading placeholder | `<SkeletonLoader>` |
| Error / success banner | `<AlertMessage tone="error\|success">` |
| Empty list state | `<EmptyState>` |
| Location picker | `<LocationSelector>` |
| Feed pagination | `<Pagination>` + `useInfiniteData` |
| Auth/role guard | `<ProtectedRoute>` |
| Admin data table | `<AdminTable>` |
| Location card | `<LocationCard>` (not the removed `LocationDiscoveryStrip`) |
| Country funding banner | `<CountryFundingBanner>` |
| Login with redirect | `<LoginLink redirectTo="...">` |
| Language switch | `<LanguageSwitcher>` (Profile preferences only, not TopNav) |

## i18n Namespaces

Keep strings in `messages/{el,en}.json` under: `common`, `nav`, `footer`, `home`, `auth`, `articles`, `news`, `profile`, `admin`, `editor`, `polls`, `organizations`, `static_pages`.

## Anti-patterns — Do Not Repeat

- ❌ Bare `useEffect` + `fetch` → ✅ `useAsyncData` (replace) or `useInfiniteData` (accumulating)
- ❌ Direct `fetch()` in components → ✅ `lib/api/` module methods
- ❌ Missing `<SkeletonLoader>` → ✅ always show skeleton while loading
- ❌ Missing `<AlertMessage>` → ✅ always show error message on failure
- ❌ Hard-coded UI strings → ✅ `useTranslations(...)` + keys in both locale files
- ❌ `'use client'` on every component → ✅ only when state/effects/events/browser APIs are needed
- ❌ `LocationDiscoveryStrip` (removed) → ✅ `LocationCard` inside `HomepageSection`
- ❌ `middleware.js` for edge logic → ✅ root `proxy.js`

## Focus

- Implement minimal UI changes using existing Tailwind and component patterns
- Update layouts, pages, and components without changing backend logic
- Add or update frontend tests only if the repository already includes relevant tests
- Capture or request screenshots when making UI changes
