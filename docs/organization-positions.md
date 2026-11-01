# Organization positions

Party and organization policy comparison now includes the schema, API, editor,
review workflow, revision history, and public voting UI.

## Using the feature

- Open an organization profile and select Positions & proposals.
- Organization owners/admins and platform moderators/admins can add sourced
  positions, edit drafts, request changes, publish reviewed positions, and withdraw
  or reactivate them.
- Only active organization owners/admins can author and publish official positions.
  Platform moderation permission alone does not confer official attribution.
- Add a category, optional topic links, a single proposal, and its source links.
  For Vouliwatch material, use Vouliwatch as the source name and include both its
  page URL and the original party publication when available.
- Save the draft, review the text and sources, check the review confirmation, and
  publish. Published text is immutable; use New version for material changes.
- Visitors can compare positions at /positions or on individual topic pages.
  Signed-in users can support/oppose, change their choice, or click their selected
  choice again to remove it. Prior versions remain available in history.
- Navigation links and all new UI text support Greek, English, and Romanian.
- The public list includes debounced title/body search, category shortcuts, removable
  filter chips, result totals, and collapsible filters. Search applies before pagination.
- Compare mode shows up to three selected organizations within a category or topic.
  Each column has independent pagination. Empty columns mean no published position
  is recorded for that selection, not that the organization has no policy.
- Below ten votes, cards show raw support/opposition counts with a low-participation
  label instead of a percentage bar. Original source years are prominent; dates
  are never inferred from upload dates. Details contain platform publication dates
  and revision history. Source age alone does not establish whether a policy is current.

Sources are entered manually in this release. There is no automated Vouliwatch
scraper or scheduled import, and no third-party position content is preloaded.

## Relationships

- PolicyCategory groups positions into broad areas such as Housing or Education.
- OrganizationPosition belongs to an existing Organization and a category. It may
  reference a Location and the community Suggestion from which it originated.
- PositionTopic links positions to existing curated Topics (many to many).
- PositionRevision stores an individually votable proposal, attribution, and review
  lifecycle. Version numbers are unique within a position; at most one revision
  can have published status. The parent can be active, withdrawn, or archived.
- PositionSource belongs to a revision and records the provider, source URL,
  original publication URL, external ID, original topic, publication date,
  retrieval date, content fingerprint, and verification status.
- PositionVote belongs to a revision and authenticated user, with support (+1) or
  opposition (-1). One vote per user per revision; identity is private by default.

Foreign keys restrict deletion of referenced policy records to preserve history.
Optional author/reviewer references become null when their user is deleted.
Votes currently restrict user deletion too: account deletion must explicitly
remove that user's votes in a transaction before deleting the user.

## Import contract

Map source party identifiers explicitly to Organization IDs; never guess silently.
Use provider = vouliwatch for that provider, and retain its source link alongside
the original party publication link when available.
Split bundled commitments into separate position records during review.
Fingerprint a canonical representation of each source item (SHA-256 recommended).
The same external source can legitimately support several proposals.
The unique source index prevents duplicates within a revision; the future importer
must also look up provider/externalId and compare fingerprints across revisions
to make repeated imports idempotent.
Do not infer a publication date from the retrieval date.

New revisions default to draft and sourced attribution; sources default to pending.
No external content or party seeds are installed. A follow-up migration adds
twelve starter policy categories, preserving any existing matching slugs.

## Application service rules

The position service and routes enforce these rules in addition to schema checks:

1. Only authorized organization representatives may publish official attribution;
   reviewed externally sourced material stays sourced.
2. Publish only after checking sources and recording reviewer/date. Supersede the
   previous published revision and publish its replacement in one transaction.
3. Treat published/superseded revision text and its source evidence as immutable.
   Material edits create a new version. The parent is locked when allocating
   versions, publishing, withdrawing, or voting to serialize conflicting changes.
4. Accept votes only on the published revision of an active position. Changing a
   vote updates its row; removing a vote deletes it. Never transfer votes between
   revisions. Require authentication and rate limiting.
5. Return aggregates publicly; do not include private voter identities.
6. The default ranking uses the Wilson lower confidence bound (95%). Most supported
   sorts by support count; approval and divisiveness put proposals with at least
   ten votes first. Results are labelled Appofa voter feedback, not representative
   electoral polling. Vote counts are computed from records, without stale caches.

Public lists include only active positions with published revisions. Private
organization positions are excluded from global comparison and require active
membership or management permission for direct access. Management listings
require organization management permission. Endpoints use the existing session,
CSRF, and rate-limiting middleware.

## API

All endpoints use /api/positions and return { success, data }.

| Method/path | Use |
| --- | --- |
| GET /metadata?organizationId=ID | Categories, topics, and management permissions |
| GET / | Published positions; categoryId, topicId, organizationId, search (up to 200 characters), sort, page |
| GET /?organizationId=ID&manage=true | Scoped management list, including drafts |
| GET /:positionId/history | Published and superseded versions with vote totals |
| POST /organizations/:organizationId | Create position and first draft |
| POST /:positionId/revisions | Create another draft version |
| PUT /revisions/:revisionId | Edit an unpublished draft |
| POST /revisions/:revisionId/publish | Review and publish; sourcesVerified must be true |
| POST /revisions/:revisionId/reject | Request changes with reviewNote |
| PATCH /:positionId/status | active, withdrawn, or archived |
| PUT /revisions/:revisionId/vote | value: 1, -1, or 0 (remove) |
| POST /categories | Platform moderator/admin creates a category |

Create payload: categoryId, topicIds, title, body, attribution, sources.
Each source accepts provider, sourceUrl, optional originalSourceUrl, externalId,
originalTopic, and sourcePublishedAt. Source URLs must be HTTP(S). Unknown dates
remain null. Retrieval dates and content fingerprints are generated server-side.
Updates and revisions take title, body, attribution, and sources. Classification
remains attached to the parent position.

Category and topic links describe the position as a whole. Version-specific
proposal text and evidence live on the revision.

## Migration and verification

Migrations: 20261101000000-create-organization-positions.js and
20261101010000-seed-policy-categories.js. The user deployed the schema migration;
deploying this UI/API release also requires the category seed migration.
Run npm run migrate:up through the usual deployment process, then restart the API
and rebuild/restart the frontend. The seed is idempotent and its rollback retains
taxonomy records to avoid deleting categories that have since acquired positions.

Run: npx jest __tests__/positions.test.js __tests__/organization-position-schema.test.js --runInBand

Browser workflow: npx playwright test e2e/positions.spec.js

The tests execute migration up/down against an isolated SQLite database and
verify draft defaults, revision voting, foreign keys, check constraints, unique
indexes, publication uniqueness, and duplicate source/topic protection.
Service tests cover publication, access control, CSRF/authentication, revision
history, voting, withdrawal, rankings, and pagination. Browser tests exercise
creation, review, voting, revision history, and topic pages on desktop and mobile
using a disposable local database. Production PostgreSQL execution still needs
deployment-environment verification.
