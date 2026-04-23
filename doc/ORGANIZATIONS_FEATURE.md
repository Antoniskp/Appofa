# Organizations Feature

## Overview

Organizations are first-class entities on Appofa, parallel to Locations.
They represent non-geographic entities like companies, institutions, universities, schools, parties, and civic organizations.
Phase 1 introduces the core schema, CRUD APIs, membership baseline, and initial frontend pages.

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

Response shape:

- Success: `{ success: true, data }`
- Error: `{ success: false, message }`

## Phase Roadmap

### Phase 1 (current)

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
- Organization notifications and audit events

### Phase 3

- Organization-scoped polls and suggestions
- Membership-aware visibility and vote restrictions
- Organization feed integrations

### Phase 4

- Official organization posts and manifest/program support
- Verification and trust indicators expansion
- Public discoverability enhancements

### Phase 5

- Parent/child organizations (federations, chapters, sub-units)
- Cross-organization governance and federation-level roles
- Advanced analytics for organization growth and participation
