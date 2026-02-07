# Poll System API Documentation

## Base URL
All poll endpoints are available at `/api/polls`

## Authentication
- Public endpoints: GET /api/polls, GET /api/polls/:id, GET /api/polls/:id/results, POST /api/polls/:id/vote (if poll allows)
- Authenticated endpoints: POST /api/polls, PUT /api/polls/:id, DELETE /api/polls/:id, POST /api/polls/:id/options
- CSRF token required for all state-changing operations (POST, PUT, DELETE)

## Endpoints

### 1. Get All Polls
**GET** `/api/polls`

Query Parameters:
- `status` (optional): Filter by status (active, closed, archived). Default: active
- `type` (optional): Filter by type (simple, complex)
- `visibility` (optional): Filter by visibility (public, private, locals_only)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (1-100, default: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "What is your favorite color?",
      "description": "Choose your favorite color",
      "type": "simple",
      "visibility": "public",
      "resultsVisibility": "always",
      "status": "active",
      "deadline": null,
      "creatorId": 1,
      "creator": {
        "id": 1,
        "username": "admin",
        "firstName": "Admin",
        "lastName": "User"
      },
      "options": [
        {
          "id": 1,
          "text": "Red",
          "voteCount": 5
        },
        {
          "id": 2,
          "text": "Blue",
          "voteCount": 3
        }
      ],
      "totalVotes": 8,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10
  }
}
```

### 2. Get Poll by ID
**GET** `/api/polls/:id`

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "What is your favorite color?",
    "description": "Choose your favorite color",
    "type": "simple",
    "allowUserContributions": false,
    "allowUnauthenticatedVotes": true,
    "visibility": "public",
    "resultsVisibility": "always",
    "deadline": null,
    "locationId": null,
    "creatorId": 1,
    "status": "active",
    "creator": {
      "id": 1,
      "username": "admin",
      "firstName": "Admin",
      "lastName": "User"
    },
    "location": null,
    "options": [
      {
        "id": 1,
        "text": "Red",
        "voteCount": 5,
        "authenticatedVotes": 3
      },
      {
        "id": 2,
        "text": "Blue",
        "voteCount": 3,
        "authenticatedVotes": 2
      }
    ],
    "totalVotes": 8,
    "totalAuthenticatedVotes": 5,
    "userVote": {
      "optionId": 1,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

### 3. Create Poll
**POST** `/api/polls`

Authentication: Required  
CSRF: Required

Request Body:
```json
{
  "title": "What is your favorite color?",
  "description": "Choose your favorite color from the options below",
  "type": "simple",
  "allowUserContributions": false,
  "allowUnauthenticatedVotes": true,
  "visibility": "public",
  "resultsVisibility": "always",
  "deadline": "2024-12-31T23:59:59.000Z",
  "locationId": null,
  "options": [
    { "text": "Red" },
    { "text": "Blue" },
    { "text": "Green" }
  ]
}
```

Complex Poll Example:
```json
{
  "title": "Best Restaurant",
  "description": "Vote for the best restaurant",
  "type": "complex",
  "allowUserContributions": true,
  "allowUnauthenticatedVotes": false,
  "visibility": "public",
  "resultsVisibility": "after_vote",
  "options": [
    {
      "text": "Italian Restaurant",
      "photoUrl": "/images/italian.jpg",
      "linkUrl": "https://example.com/italian",
      "displayText": "Best Italian in town",
      "answerType": "custom"
    },
    {
      "text": "Chinese Restaurant",
      "photoUrl": "/images/chinese.jpg",
      "linkUrl": "https://example.com/chinese",
      "displayText": "Authentic Chinese cuisine",
      "answerType": "custom"
    }
  ]
}
```

Field Descriptions:
- `type`: "simple" (text-based) or "complex" (rich options with photos/links)
- `visibility`: "public" (anyone can see), "private" (only creator), "locals_only" (authenticated users)
- `resultsVisibility`: "always", "after_vote", "after_deadline"
- `answerType` (complex polls): "person", "article", "custom"

### 4. Update Poll
**PUT** `/api/polls/:id`

Authentication: Required (creator or admin)  
CSRF: Required

Request Body (all fields optional):
```json
{
  "title": "Updated Poll Title",
  "description": "Updated description",
  "deadline": "2024-12-31T23:59:59.000Z",
  "status": "closed"
}
```

### 5. Delete Poll
**DELETE** `/api/polls/:id`

Authentication: Required (creator or admin)  
CSRF: Required

Behavior:
- If poll has votes: Soft delete (status set to "archived")
- If poll has no votes: Hard delete (permanently removed)

Response:
```json
{
  "success": true,
  "message": "Poll deleted successfully."
}
```

### 6. Vote on Poll
**POST** `/api/polls/:id/vote`

Authentication: Optional (depends on poll settings)  
CSRF: Optional for unauthenticated users  
Rate Limit: 10 votes/hour for unauthenticated users

Request Body:
```json
{
  "optionId": 1
}
```

Response:
```json
{
  "success": true,
  "message": "Vote recorded successfully.",
  "data": {
    "voteId": 123,
    "optionId": 1,
    "voteCounts": {
      "1": 6,
      "2": 3
    }
  }
}
```

Notes:
- Users can change their vote by voting again
- Only one vote per user/session per poll
- Unauthenticated votes tracked by session ID and IP address

### 7. Add Poll Option
**POST** `/api/polls/:id/options`

Authentication: Required  
CSRF: Required

Request Body (simple poll):
```json
{
  "text": "Yellow"
}
```

Request Body (complex poll):
```json
{
  "text": "Mexican Restaurant",
  "photoUrl": "/images/mexican.jpg",
  "linkUrl": "https://example.com/mexican",
  "displayText": "Best tacos in town",
  "answerType": "custom"
}
```

Requirements:
- Poll must have `allowUserContributions: true`
- Poll must be in "active" status

### 8. Get Poll Results
**GET** `/api/polls/:id/results`

Authentication: Optional

Response:
```json
{
  "success": true,
  "data": {
    "poll": {
      "id": 1,
      "title": "What is your favorite color?",
      "description": "Choose your favorite color",
      "type": "simple",
      "status": "active",
      "deadline": null,
      "creator": {
        "id": 1,
        "username": "admin",
        "firstName": "Admin",
        "lastName": "User"
      }
    },
    "results": {
      "options": [
        {
          "id": 1,
          "text": "Red",
          "voteCount": 6,
          "authenticatedVotes": 4,
          "unauthenticatedVotes": 2,
          "percentage": 60.00
        },
        {
          "id": 2,
          "text": "Blue",
          "voteCount": 4,
          "authenticatedVotes": 2,
          "unauthenticatedVotes": 2,
          "percentage": 40.00
        }
      ],
      "totalVotes": 10,
      "totalAuthenticatedVotes": 6,
      "totalUnauthenticatedVotes": 4
    }
  }
}
```

Visibility Rules:
- `always`: Results visible to everyone
- `after_vote`: Results visible only to users who have voted
- `after_deadline`: Results visible only after poll deadline or when closed

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common Status Codes:
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions or CSRF error)
- `404`: Not Found (poll or option doesn't exist)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Rate Limits

- General API calls: 100 requests per 15 minutes
- Poll creation: 20 requests per 15 minutes
- Voting (unauthenticated): 10 votes per hour
- Authenticated users bypass vote rate limits

Rate limit information is returned in response headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Time when limit resets (Unix timestamp)

## CSRF Protection

For authenticated state-changing operations (POST, PUT, DELETE):
1. Obtain CSRF token from `/api/auth/csrf-token`
2. Include token in both:
   - Cookie: `csrf_token=<token>`
   - Header: `x-csrf-token: <token>`

For unauthenticated voting:
- CSRF token is optional but recommended
- If provided, must be valid

## Examples

### Create a simple poll with curl:
```bash
curl -X POST http://localhost:3000/api/polls \
  -H "Cookie: auth_token=<your-token>; csrf_token=<csrf-token>" \
  -H "x-csrf-token: <csrf-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Favorite Programming Language",
    "type": "simple",
    "visibility": "public",
    "resultsVisibility": "always",
    "allowUnauthenticatedVotes": true,
    "options": [
      {"text": "JavaScript"},
      {"text": "Python"},
      {"text": "Go"}
    ]
  }'
```

### Vote on a poll (authenticated):
```bash
curl -X POST http://localhost:3000/api/polls/1/vote \
  -H "Cookie: auth_token=<your-token>; csrf_token=<csrf-token>" \
  -H "x-csrf-token: <csrf-token>" \
  -H "Content-Type: application/json" \
  -d '{"optionId": 1}'
```

### Get poll results:
```bash
curl http://localhost:3000/api/polls/1/results
```
