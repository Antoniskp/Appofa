# Poll System API Documentation

## Overview

The Poll System API provides comprehensive endpoints for creating, managing, and voting on polls. It supports multiple poll types, question types, and voting scenarios.

## Base URL

```
/api/polls
```

## Authentication

- **Required for**: Creating, updating, deleting polls
- **Optional for**: Voting (depends on poll settings), viewing polls
- **Method**: JWT token in Authorization header or auth_token cookie

## Endpoints

### 1. Create Poll

**POST** `/api/polls`

Creates a new poll with options.

**Authentication**: Required

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
X-CSRF-Token: <csrf_token>
```

**Request Body**:
```json
{
  "title": "What is your favorite framework?",
  "description": "Choose your preferred frontend framework",
  "pollType": "simple",
  "questionType": "single-choice",
  "allowUnauthenticatedVoting": true,
  "allowUserAddOptions": false,
  "status": "open",
  "settings": {},
  "options": [
    {
      "optionText": "React",
      "optionType": "text",
      "imageUrl": null,
      "linkUrl": null,
      "displayName": null,
      "order": 1
    },
    {
      "optionText": "Vue",
      "optionType": "text",
      "order": 2
    }
  ]
}
```

**Field Descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Poll title (5-200 chars) |
| description | string | No | Poll description (max 1000 chars) |
| pollType | enum | Yes | "simple" or "complex" |
| questionType | enum | Yes | "single-choice", "ranked-choice", or "free-text" |
| allowUnauthenticatedVoting | boolean | No | Allow non-logged users to vote (default: false) |
| allowUserAddOptions | boolean | No | Allow users to add options (default: false) |
| status | enum | No | "open" or "closed" (default: "open") |
| settings | object | No | Additional poll settings (JSONB) |
| options | array | Conditional | Required for non-free-text polls, min 2 options |

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Poll created successfully",
  "data": {
    "id": 1,
    "title": "What is your favorite framework?",
    "description": "Choose your preferred frontend framework",
    "pollType": "simple",
    "questionType": "single-choice",
    "allowUnauthenticatedVoting": true,
    "allowUserAddOptions": false,
    "status": "open",
    "creatorId": 1,
    "createdAt": "2024-02-07T10:00:00.000Z",
    "updatedAt": "2024-02-07T10:00:00.000Z",
    "options": [
      {
        "id": 1,
        "pollId": 1,
        "optionText": "React",
        "optionType": "text",
        "order": 1,
        "createdAt": "2024-02-07T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 2. List Polls

**GET** `/api/polls`

Retrieves a paginated list of polls with filters.

**Authentication**: Optional (shows personalized data if authenticated)

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 10, max: 100) |
| status | enum | Filter by "open" or "closed" |
| pollType | enum | Filter by "simple" or "complex" |
| creatorId | number | Filter by creator user ID |
| search | string | Search in title and description |

**Example Request**:
```
GET /api/polls?page=1&limit=20&status=open&search=framework
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "What is your favorite framework?",
      "description": "Choose your preferred frontend framework",
      "pollType": "simple",
      "questionType": "single-choice",
      "status": "open",
      "createdAt": "2024-02-07T10:00:00.000Z",
      "creator": {
        "id": 1,
        "username": "admin",
        "firstName": "Admin",
        "lastName": "User"
      },
      "optionCount": 3,
      "voteCount": 42,
      "userVoted": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### 3. Get Poll by ID

**GET** `/api/polls/:id`

Retrieves detailed information about a specific poll.

**Authentication**: Optional

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "What is your favorite framework?",
    "description": "Choose your preferred frontend framework",
    "pollType": "simple",
    "questionType": "single-choice",
    "allowUnauthenticatedVoting": true,
    "allowUserAddOptions": false,
    "status": "open",
    "settings": {},
    "creatorId": 1,
    "createdAt": "2024-02-07T10:00:00.000Z",
    "updatedAt": "2024-02-07T10:00:00.000Z",
    "creator": {
      "id": 1,
      "username": "admin",
      "firstName": "Admin",
      "lastName": "User"
    },
    "options": [
      {
        "id": 1,
        "pollId": 1,
        "optionText": "React",
        "optionType": "text",
        "imageUrl": null,
        "linkUrl": null,
        "displayName": null,
        "order": 1,
        "voteCount": 25
      },
      {
        "id": 2,
        "pollId": 1,
        "optionText": "Vue",
        "optionType": "text",
        "order": 2,
        "voteCount": 17
      }
    ],
    "userVotes": [
      {
        "id": 1,
        "optionId": 1,
        "rankPosition": null
      }
    ]
  }
}
```

---

### 4. Submit Vote

**POST** `/api/polls/:id/vote`

Submits a vote for a poll.

**Authentication**: Optional (depends on poll settings)

**Headers**:
```
Content-Type: application/json
X-CSRF-Token: <csrf_token>  // Optional for unauthenticated votes
```

**Request Body (Single-Choice)**:
```json
{
  "optionId": 1,
  "sessionId": "optional_for_unauth",
  "ipAddress": "optional_for_unauth"
}
```

**Request Body (Ranked-Choice)**:
```json
{
  "rankedOptions": [
    { "optionId": 2, "rankPosition": 1 },
    { "optionId": 1, "rankPosition": 2 },
    { "optionId": 3, "rankPosition": 3 }
  ],
  "sessionId": "optional_for_unauth"
}
```

**Request Body (Free-Text)**:
```json
{
  "freeTextResponse": "I think dark mode would be great!",
  "sessionId": "optional_for_unauth"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Vote submitted successfully",
  "data": {
    "vote": {
      "id": 1,
      "pollId": 1,
      "optionId": 1,
      "userId": 1,
      "isAuthenticated": true,
      "createdAt": "2024-02-07T10:05:00.000Z"
    },
    "updatedCounts": {
      "totalVotes": 43,
      "optionVotes": 26
    }
  }
}
```

---

### 5. Get Poll Results

**GET** `/api/polls/:id/results`

Retrieves detailed voting results and statistics.

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "pollId": 1,
    "title": "What is your favorite framework?",
    "totalVotes": 42,
    "totalAuthenticatedVotes": 35,
    "totalUnauthenticatedVotes": 7,
    "optionResults": [
      {
        "optionId": 1,
        "optionText": "React",
        "voteCount": 25,
        "percentage": 59.52,
        "authenticatedVotes": 20,
        "unauthenticatedVotes": 5
      },
      {
        "optionId": 2,
        "optionText": "Vue",
        "voteCount": 17,
        "percentage": 40.48,
        "authenticatedVotes": 15,
        "unauthenticatedVotes": 2
      }
    ],
    "chartData": {
      "labels": ["React", "Vue"],
      "values": [25, 17],
      "percentages": [59.52, 40.48],
      "colors": ["#3B82F6", "#10B981"]
    }
  }
}
```

**For Ranked-Choice Polls**:
```json
{
  "success": true,
  "data": {
    "pollId": 2,
    "totalVotes": 30,
    "optionResults": [...],
    "rankDistribution": {
      "1": [
        { "optionId": 1, "optionText": "React", "count": 18 },
        { "optionId": 2, "optionText": "Vue", "count": 8 },
        { "optionId": 3, "optionText": "Angular", "count": 4 }
      ],
      "2": [...],
      "3": [...]
    }
  }
}
```

---

### 6. Update Poll

**PUT** `/api/polls/:id`

Updates an existing poll.

**Authentication**: Required (must be creator or admin)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
X-CSRF-Token: <csrf_token>
```

**Request Body**:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "closed"
}
```

**Note**: Cannot update if poll has received votes (prevents manipulation)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Poll updated successfully",
  "data": {
    "id": 1,
    "title": "Updated title",
    ...
  }
}
```

---

### 7. Delete Poll

**DELETE** `/api/polls/:id`

Deletes a poll and all associated data.

**Authentication**: Required (must be creator or admin)

**Headers**:
```
Authorization: Bearer <token>
X-CSRF-Token: <csrf_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Poll deleted successfully"
}
```

---

### 8. Add Poll Option

**POST** `/api/polls/:id/options`

Adds a new option to an existing poll.

**Authentication**: Required

**Note**: Only works if poll has `allowUserAddOptions: true`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
X-CSRF-Token: <csrf_token>
```

**Request Body**:
```json
{
  "optionText": "Svelte",
  "optionType": "text",
  "imageUrl": null,
  "linkUrl": null,
  "displayName": null
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Poll option added successfully",
  "data": {
    "id": 4,
    "pollId": 1,
    "optionText": "Svelte",
    "createdById": 2,
    "createdAt": "2024-02-07T10:10:00.000Z"
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Poll does not exist |
| 409 | Conflict - Duplicate vote attempt |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

- **Read operations** (GET): 100 requests per 15 minutes
- **Write operations** (POST/PUT/DELETE): 10 requests per 15 minutes
- **Vote submissions**: 5 requests per minute

---

## Best Practices

1. **Poll Creation**:
   - Provide clear, concise titles
   - Include helpful descriptions
   - Use appropriate question types for your use case
   - Set reasonable option counts (2-10 recommended)

2. **Voting**:
   - For anonymous voting, generate unique sessionIds client-side
   - Store sessionId in localStorage for consistency
   - Handle vote conflicts gracefully

3. **Results**:
   - Cache results for closed polls
   - Poll results frequently for live updates on open polls
   - Use chart data directly with visualization libraries

4. **Performance**:
   - Use pagination for large poll lists
   - Filter by status to reduce data transfer
   - Leverage optional authentication for personalized experiences

---

## Examples

### Creating a Simple Yes/No Poll

```javascript
const response = await fetch('/api/polls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    title: 'Should we add dark mode?',
    pollType: 'simple',
    questionType: 'single-choice',
    allowUnauthenticatedVoting: true,
    options: [
      { optionText: 'Yes', order: 1 },
      { optionText: 'No', order: 2 }
    ]
  })
});
```

### Submitting a Vote (Authenticated)

```javascript
const response = await fetch(`/api/polls/${pollId}/vote`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify({
    optionId: selectedOptionId
  })
});
```

### Getting Results with Chart

```javascript
const response = await fetch(`/api/polls/${pollId}/results`);
const data = await response.json();

// Use with Chart.js
const chartConfig = {
  type: 'pie',
  data: {
    labels: data.data.chartData.labels,
    datasets: [{
      data: data.data.chartData.values,
      backgroundColor: data.data.chartData.colors
    }]
  }
};
```

---

## See Also

- [Poll System Implementation Guide](./POLL_SYSTEM.md)
- [Frontend Integration Guide](../POLL_FRONTEND_IMPLEMENTATION.md)
- [Testing Guide](../POLL_TESTING_GUIDE.md)
