# Suggestions & Solutions Feature

Users can post ideas, problems, or location suggestions. Others can propose solutions and both suggestions and solutions can be upvoted or downvoted.

---

## Data Models

### Suggestion
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `title` | STRING | 5–200 chars |
| `body` | TEXT | 10–10 000 chars |
| `type` | ENUM | `idea`, `problem`, `location_suggestion` |
| `locationId` | INTEGER FK → Locations | optional |
| `authorId` | INTEGER FK → Users | cascade delete |
| `status` | ENUM | `open`, `under_review`, `implemented`, `rejected` |

### Solution
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `suggestionId` | INTEGER FK → Suggestions | cascade delete |
| `body` | TEXT | 10–5 000 chars |
| `authorId` | INTEGER FK → Users | cascade delete |

### SuggestionVote
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `userId` | INTEGER FK → Users | cascade delete |
| `targetType` | ENUM | `suggestion` or `solution` |
| `targetId` | INTEGER | ID of the target |
| `value` | SMALLINT | `+1` (upvote) or `-1` (downvote) |

**Unique constraint:** `(userId, targetType, targetId)` — one vote per user per target.

---

## API Endpoints

All endpoints are mounted under `/api/suggestions` and `/api/solutions`.

### Suggestions

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/suggestions` | optional | List suggestions (filters + pagination) |
| `GET` | `/api/suggestions/:id` | optional | Get suggestion detail with solutions sorted by score |
| `POST` | `/api/suggestions` | ✅ required | Create a new suggestion |
| `PATCH` | `/api/suggestions/:id` | ✅ owner/admin | Update title, body, or status |
| `GET` | `/api/suggestions/:id/solutions` | optional | List solutions sorted by score desc |
| `POST` | `/api/suggestions/:id/solutions` | ✅ required | Add a solution under a suggestion |
| `POST` | `/api/suggestions/:id/vote` | ✅ required | Vote on a suggestion (+1 / -1) |

### Solutions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/solutions/:id/vote` | ✅ required | Vote on a solution (+1 / -1) |

---

## Query Parameters for `GET /api/suggestions`

| Param | Values | Default | Description |
|---|---|---|---|
| `type` | `idea`, `problem`, `location_suggestion` | all | Filter by type |
| `status` | `open`, `under_review`, `implemented`, `rejected` | all | Filter by status |
| `locationId` | integer | — | Filter by location |
| `sort` | `newest`, `top` | `newest` | Sort order |
| `page` | integer | `1` | Page number |
| `limit` | integer (max 50) | `12` | Results per page |

---

## Vote Behaviour (Upsert/Toggle)

Sending `POST /api/suggestions/:id/vote` with `{ "value": 1 }`:

- **No existing vote** → creates a `+1` vote.
- **Existing vote with different value** → updates the vote (e.g. `+1` → `-1`).
- **Existing vote with same value** → removes the vote (toggle off, score returns to 0).

The response always includes:
```json
{
  "success": true,
  "data": {
    "score": 3,
    "myVote": 1
  }
}
```

`myVote` is `null` when the caller has no active vote.

---

## Score Computation

Score is computed as the **SUM of all vote values** for a target:

```sql
SELECT SUM(value) FROM SuggestionVotes
WHERE targetType = 'suggestion' AND targetId = :id
```

Solutions in the suggestion detail response (`GET /api/suggestions/:id`) are sorted by `score DESC`, then `createdAt ASC`.

---

## Response Example

`GET /api/suggestions/42`:

```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "Add a park on Main St",
    "body": "We need more green space...",
    "type": "idea",
    "status": "open",
    "score": 12,
    "myVote": 1,
    "author": { "id": 7, "username": "alice", "avatar": null },
    "location": { "id": 3, "name": "Central Municipality", "slug": "central" },
    "solutions": [
      {
        "id": 5,
        "body": "Convert the empty lot at No.12 into a pocket park.",
        "score": 8,
        "myVote": null,
        "author": { "id": 9, "username": "bob" }
      }
    ]
  }
}
```

---

## Frontend Pages

| Route | Description |
|---|---|
| `/suggestions` | List page with type/status/sort filters and pagination |
| `/suggestions/new` | Create new suggestion form (auth required) |
| `/suggestions/:id` | Detail page with vote controls, solution list sorted by score, solution submission form |

---

## Running the Migration

```bash
npm run migrate
```

Migration `028-create-suggestions-tables.js` creates `Suggestions`, `Solutions`, and `SuggestionVotes` tables with all required indexes.
