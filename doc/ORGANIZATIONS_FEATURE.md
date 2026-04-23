# Organizations Feature

## Overview

Organizations are first-class entities on Appofa, parallel to Locations.
They represent non-geographic entities like companies, institutions, universities, schools, parties, and civic organizations.
Phase 4 extends Organizations with official posts (`isOfficialPost`, `officialPostScope`), verification-status endpoints, and a public official-post discovery feed.

## Database Schema

### Organizations

- `id` (PK)
- `name` (required)
- `slug` (required, unique)
- `type` (`company|organization|institution|school|university|party`)
- `description` (optional)
- `logo` (optional URL)
- `website` (optional URL)
- `contactEmail` (optional)
- `locationId` (optional FK → `Locations.id`, `SET NULL`)
- `isPublic` (default `true`)
- `isVerified` (default `false`)
- `createdByUserId` (required FK → `Users.id`, `CASCADE`)
- `createdAt`, `updatedAt`

### OrganizationMembers

- `id` (PK)
- `organizationId` (required FK → `Organizations.id`, `CASCADE`)
- `userId` (required FK → `Users.id`, `CASCADE`)
- `role` (`owner|admin|moderator|member`, default `member`)
- `status` (`active|invited|pending`, default `active`)
- `inviteToken` (optional, for invite tracking)
- `invitedByUserId` (optional FK → `Users.id`, `SET NULL`)
- `createdAt`, `updatedAt`
- Unique constraint: `(organizationId, userId)`

## API Endpoints

Base prefix: `/api/organizations`

- `GET /` — list organizations (filters: `type`, `search`, `page`, `limit`)
- `GET /:slug` — fetch one organization by slug
- `POST /` — create organization (admin/moderator)
- `PUT /:id` — update organization (admin/moderator)
- `DELETE /:id` — delete organization (admin only)
- `GET /:id/members` — list members (private orgs are members-only)
- `POST /:id/join` — request to join (active for public orgs, pending for private orgs)
- `DELETE /:id/leave` — leave own membership (owners cannot leave)
- `POST /:id/members/invite` — invite user by `userId` (org owner/admin or platform admin/moderator)
- `PATCH /:id/members/:userId/approve` — approve pending join request
- `DELETE /:id/members/:userId` — remove member (owner cannot be removed)
- `PATCH /:id/members/:userId/role` — update member role (`admin|moderator|member`)
- `GET /:id/members/pending` — list pending membership requests
- `GET /:id/polls` — list organization polls (public orgs expose only public polls to non-members)
- `POST /:id/polls` — create organization poll (active members only)
- `GET /:id/suggestions` — list organization suggestions (public orgs expose only public suggestions to non-members)
- `POST /:id/suggestions` — create organization suggestion (active members only)
- `GET /:id/official-posts` — list organization official posts
- `POST /:id/official-posts` — create official post (`contentType: poll|suggestion`) for party/institution orgs (org owner/admin or platform admin/moderator)
- `GET /:id/verification` — get organization verification status
- `PATCH /:id/verify` — set verification status (`isVerified` boolean, admin only)

Public discoverability:

- `GET /api/official-posts` — platform-wide public official posts feed (public posts from party/institution orgs)

Response shape:

- Success: `{ success: true, data }`
- Error: `{ success: false, message }`

## Phase Roadmap

### Phase 1

- Core `Organization` model
- `OrganizationMember` placeholder model
- Dialect-aware migration
- Organization CRUD API + members endpoint
- Slug service (`organizationService.generateSlug`)
- Frontend pages:
  - `/organizations`
  - `/organizations/[slug]`
  - `/admin/organizations`

### Phase 2
- Membership workflows (invite/request/join/leave)
- Member management permissions and moderation tools
- Frontend members tab controls for join/leave and admin actions

### Phase 3

- ✅ Organization-scoped polls and suggestions
- ✅ Membership-aware visibility with `members_only` (stored as `private` for org-scoped rows)
- ✅ Organization profile tabs for Polls and Suggestions with create flows for active members

### Phase 4

- ✅ Official organization posts and manifest/program support
- ✅ Verification and trust indicators expansion
- ✅ Public discoverability enhancements (`/official-posts`, `/api/official-posts`)

### Phase 5

- Parent/child organizations (federations, chapters, sub-units)
- Cross-organization governance and federation-level roles
- Advanced analytics for organization growth and participation
