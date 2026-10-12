# Collaborative location pages

Every location links to `/locations/[slug]/improve` from its header and local information area. Missing descriptions and population figures invite a first contribution. Existing descriptions invite corrections and source links.

## Contribution flow

Visitors can draft before signing in. Session storage preserves drafts per location across sign-in in the same tab. If storage is unavailable, the form asks users to copy their text before navigating. Submissions require authentication and CSRF. The form offers addition, correction, or source, and accepts a proposed replacement for description, local name, population override, or Wikipedia URL. Source links require HTTPS and are optional except for source contributions. A source contribution can keep the current text unchanged while adding evidence to the public history.

The shared login page now guards its redirect so the password-login callback and auth-state effect cannot consume the stored return destination twice. Wikipedia-link acceptance clears cached image/population from the previous article; it does not fetch external resources during review. Population comparisons include the currently displayed Wikipedia fallback when no override exists.

After submitting, users see their contributions and reviewer feedback. Pending and declined content is private to the contributor and authorized reviewers. Reviewers may accept, decline with a reason, or request clarification with a reason. Only the original author can revise a clarification request; revision re-snapshots current page information and returns the item to pending. No direct editing of accepted records is exposed.

## Review and history

Administrators may review all locations. Moderators need a `UserLocationRole` moderator assignment on the location or an ancestor; residence does not grant authority. The API supplies `canReview` to the UI and independently verifies every review request. Review tabs show pending and clarification-requested submissions for the current location, with pagination. The author's list includes all their statuses. Public history contains only accepted changes, before/after values, source links, username credit, and publication date; explanations and feedback are omitted.

Acceptance locks both submission and location in a transaction, checks the submission revision, and compares the target field against its original snapshot. A conflict leaves both unchanged. Reviewers can request clarification to let the author update against the new page. Changes in unrelated fields do not block acceptance. Accepted descriptions render as plain text. No source URLs are fetched by the server.

This uses a dedicated `LocationImprovement` model instead of civic `Suggestion`: civic proposals, votes, progress feeds, and organization visibility remain independent from editorial corrections. It intentionally starts with four safe scalar fields; structured sections, general revision rollback, and contributor notifications are future work. Contributors follow status on the page under “My contributions”.

## Deployment and validation

Run `npm run migrate` before restarting the backend with this release. Migration `20261012000000-create-location-improvements.js` adds `Locations.description` and `LocationImprovements`; rollback removes the new table and description content, so retain a database backup before rollback. No production migration is executed by the implementation task.

- `npm run test:ci -- --runTestsByPath __tests__/location-improvements.test.js __tests__/i18n-romanian-support.test.js`
- `npm run test:e2e -- e2e/location-improvements.spec.js` (disposable SQLite database; desktop and mobile)
- `npm run lint`
