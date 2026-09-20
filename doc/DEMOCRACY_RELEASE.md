# Democracy first release

The homepage leads with proposing, discussing, taking a position and following delivery. News and other resources remain accessible, alongside onboarding, country suggestions and the configured featured poll. The `/progress` page shows paginated public proposal updates.

## Participation and privacy

All existing voting is advisory. Account registration is not proof of a unique eligible citizen; the declared home location is not independently verified residency. Guest vote deduplication is not one-person-one-vote. “Hide my name” hides the identity from other users, not the platform operator. Votes remain account-linked in storage. This release does not implement secret ballots, binding elections, cryptographic verification or a verified electoral register.

Local voting eligibility applies equally to administrators in polls, civic questions, suggestions and solutions. Organization poll voting requires active membership even for platform administrators. Administrative read/manage access remains separate.

## Proposal timeline

`Suggestion.progress` contains the current stage, revision, responsible body, requested response date, estimated cost/currency, linked consultation ID, response/reason, milestones, evidence URL and note. `history` stores full snapshots with server timestamps and publisher role. The author or platform administrator may publish; generic moderators do not acquire this additional authority. Updates are reports, not independently verified institutional commitments.

Stages: discussion → consultation → response → delivery → reported complete; “not proceeding” records rejection. Stages may be corrected through a new reasoned update; prior history is retained. Existing proposal statuses are synchronized. Once a timeline exists, changing status through the legacy edit endpoint is rejected; use the timeline instead.

- Every update needs an explanation and the current revision. Stale writes receive 409. Row locking and a transaction protect concurrent updates.
- Consultation needs a public, non-organization poll for the same location that the publisher manages.
- Response, delivery, completion and rejection need a responsible body and response/reason.
- Delivery needs milestones; completion needs an HTTP(S) evidence link.
- Links and dates are validated. The public progress feed excludes private, local-only and organization proposals.
- History is application-maintained, not an independently verifiable audit ledger; existing proposal deletion policies still apply.

## Deployment

Apply `npm run migrate` before starting the new backend: migration `20260920000000-add-proposal-progress.js` adds a nullable JSON column and leaves existing proposals intact. Build the frontend and restart the services through the normal PR deployment workflow. Do not run the down migration if timeline records must be retained: it drops the progress column.

No production migration or deployment is performed by local verification. Local browser checks use synthetic data in an isolated in-memory database.
