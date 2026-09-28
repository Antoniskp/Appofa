# Voting intention polls

Deploy the migration `20260929000000-add-voting-intention-polls.js` before starting the updated backend. No existing polls or party records are modified by the migration.

In **Admin → Homepage**, use **Νέα ψηφοφορία πρόθεσης ψήφου**. Review the public party organizations, select the ballot, optionally set a deadline, and create it. Parties present in the existing active party configuration are preselected when their organization slugs match; this is a convenience, not a current parliamentary-party ranking. Edit party records in Admin → Organizations before creating the ballot.

Creation atomically creates an ordinary poll and its options, then selects it as the homepage featured poll. It adds Other, Undecided, Blank/invalid and Abstention. Names are snapshotted so later organization edits cannot silently alter the ballot. The existing poll editor can edit options before the first vote; afterwards start a new round to change options. Creating a new round does not close an older one: use its existing status control when appropriate.

The existing homepage widget supports voting, changing a vote, counts, and a link to the complete results. An optional onboarding invitation appears for an active featured voting-intention poll when the current user has not voted. Hiding the featured poll also hides this invitation. Voting is never an onboarding requirement.

## Identity and privacy

The server requires a linked Google account, including for administrators. It forces `identityVisibility=anonymous`. This means no publicly named political choice, **not** cryptographic ballot secrecy: the database still associates an Appofa user with their vote.

A private SHA-256 key derived from poll ID and Google account ID is stored on each verified vote. Unique indexes enforce one row per local user and one per Google identity per poll. Poll/user row locks serialize ballot edits and verified submissions on PostgreSQL; index violations return conflict responses. Unlinking/relinking cannot give a Google account a second counted vote. A different Appofa account cannot retrieve or alter the earlier account's choice; switching the linked Google identity requires the original identity to change an existing vote. The key is omitted from poll responses and exports.

Existing account-purge behavior removes the user's vote. A later registration can then vote again, but the removed vote is no longer counted. This feature does not add identity retention beyond account deletion.

One Google account is not one verified person. The UI explicitly states this and describes the results as an open participation poll, not a representative survey. Existing CSRF and rate limits apply. Percentages use all responses, including undecided and abstention.

## Later identity verification

ID or another person-level provider should be a separately versioned verification policy and new polling round. Do not relabel Google-account votes as person-verified. Define provider assurance, consent, privacy, retention, and migration rules before collecting identity documents; no ID documents are collected by this implementation.

## Verification

`npx jest __tests__/voting-intention.test.js __tests__/voting-intention-ui.test.js __tests__/polls.test.js --runInBand`

These tests use isolated SQLite databases and exercise creation, privacy, duplicate identity constraints, relinking, vote changes, ballot protection and UI entry points. PostgreSQL locking/concurrent request behavior should also be exercised in staging before claiming a production concurrency audit.
