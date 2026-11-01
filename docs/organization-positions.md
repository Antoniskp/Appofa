# Organization positions

This is the persistence foundation for party and organization policy comparison.
It does not expose publishing, voting, scraping, or UI endpoints yet.

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
No external content or party/category seeds are installed by this migration.

## Rules for the future application service

These authorization and workflow rules are not enforced by the schema alone:

1. Only authorized organization representatives may publish official attribution;
   reviewed externally sourced material stays sourced.
2. Publish only after checking sources and recording reviewer/date. Supersede the
   previous published revision and publish its replacement in one transaction.
3. Treat published/superseded revision text and its source evidence as immutable.
   Material edits create a new version. Lock the parent when allocating versions.
4. Accept votes only on the published revision of an active position. Changing a
   vote updates its row; removing a vote deletes it. Never transfer votes between
   revisions. Require authentication and rate limiting.
5. Return aggregates publicly; do not include private voter identities.
6. Rank current published revisions using counts and approval percentage, with
   a participation threshold or confidence adjustment. Label results as Appofa
   voter feedback, not representative electoral polling.

Category and topic links describe the position as a whole. Version-specific
proposal text and evidence live on the revision.

## Migration and verification

Migration: 20261101000000-create-organization-positions.js.
Apply through the existing migration runner during deployment. The migration
creates six tables transactionally and supports rollback (which removes policy
data). It has not been applied to a live database by this change.

Run: npx jest __tests__/organization-position-schema.test.js --runInBand

The tests execute migration up/down against an isolated SQLite database and
verify draft defaults, revision voting, foreign keys, check constraints, unique
indexes, publication uniqueness, and duplicate source/topic protection.
Production PostgreSQL execution still needs deployment-environment verification.
