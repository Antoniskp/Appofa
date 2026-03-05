# Poll Audit Export

This document describes the auditable poll data export feature, including the privacy-preserving voter reference mechanism.

## Overview

Authorised users (poll creator or admin) can download a structured JSON file containing the final votes for a poll, grouped under each option, without exposing real user identities.

## Endpoint

```
GET /api/polls/:id/export
```

- **Authentication**: required (JWT cookie / bearer token)
- **Authorisation**: poll creator **or** admin role only (same set of users that can edit the poll)
- **Rate-limited** by the standard API limiter

### Response shape

```jsonc
{
  "success": true,
  "data": {
    "exported_at": "2026-03-05T12:00:00.000Z",
    "poll": {
      "id": 42,
      "title": "Best programming language?",
      "description": "...",
      "type": "simple",
      "status": "active",
      "deadline": null,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "summary": {
      "totalVotes": 150,
      "totalOptions": 3
    },
    "options": [
      {
        "id": 1,
        "text": "TypeScript",
        "photoUrl": null,
        "linkUrl": null,
        "displayText": null,
        "answerType": null,
        "order": 0,
        "vote_count": 80,
        "votes": [
          {
            "vote_id": 101,
            "voter_ref": "a3f9c...",   // HMAC-SHA256 hex digest
            "is_authenticated": true,
            "voted_at": "2026-03-04T10:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

The export contains **final votes only** (one per authenticated user, enforced by the unique index in the database).  Anonymous / unauthenticated votes have `voter_ref: null` because there is no stable user ID to hash.

## Environment Variable

| Variable | Description |
|---|---|
| `POLL_EXPORT_HMAC_SECRET` | Long, random secret used as the HMAC key. **Required** at runtime when the export endpoint is called. |

Generate a suitable value:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the result to your `.env` file (and never commit it to source control):

```
POLL_EXPORT_HMAC_SECRET=<generated-value>
```

## voter_ref — How It Is Generated

```js
const crypto = require('crypto');

const voterRef = crypto
  .createHmac('sha256', process.env.POLL_EXPORT_HMAC_SECRET)
  .update(`${pollId}:${userId}`)
  .digest('hex');
```

### Privacy properties

| Property | Explanation |
|---|---|
| **One-way** | HMAC-SHA256 cannot be reversed; the real `userId` cannot be derived from `voter_ref`. |
| **Stable within a poll** | The same `(pollId, userId)` always produces the same `voter_ref`. Auditors can check for duplicate voter refs within a single poll export. |
| **Not correlatable across polls** | `pollId` is part of the HMAC message, so the same user has a *different* `voter_ref` in every poll export. |
| **Keyed** | Without the `POLL_EXPORT_HMAC_SECRET`, the refs cannot be recomputed or verified externally. |

## Verifying a voter_ref (Server-Side)

To confirm that a specific known user cast a specific vote in an audit, an authorised admin can run the following script **server-side** (never expose this mapping in the export itself):

```js
// verify-voter-ref.js
// Usage: node verify-voter-ref.js <pollId> <userId> <voter_ref_to_check>
require('dotenv').config();
const crypto = require('crypto');

const [, , pollId, userId, expectedRef] = process.argv;

const computed = crypto
  .createHmac('sha256', process.env.POLL_EXPORT_HMAC_SECRET)
  .update(`${pollId}:${userId}`)
  .digest('hex');

if (computed === expectedRef) {
  console.log('✓ voter_ref matches the provided userId.');
} else {
  console.log('✗ voter_ref does NOT match the provided userId.');
}
```

### Important notes

- This script **must only be run by authorised admins** on a trusted server.
- Never expose userId ↔ voter_ref mappings in the export file or any public-facing output.
- The HMAC is one-way: you cannot "decode" a `voter_ref` to find the userId. Identity confirmation always requires *recomputing* the HMAC for a candidate `userId`.
- If `POLL_EXPORT_HMAC_SECRET` is rotated, all previously exported `voter_ref` values will no longer match recomputed values. Archive exports before rotating the secret.

## Frontend Export

In the **Poll Results** UI, users with edit rights see an **Εξαγωγή** (Export) dropdown with two actions:

1. **Εξαγωγή ως PNG** — downloads the current chart as a PNG image (existing behaviour).
2. **Εξαγωγή δεδομένων (JSON)** — calls `GET /api/polls/:id/export` and downloads the auditable JSON file as `poll-<id>-audit.json`.

Regular viewers (without edit rights) continue to see only the PNG export button.
