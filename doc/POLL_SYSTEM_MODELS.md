# Poll System Database Models

This document describes the database models for the comprehensive poll system.

## Overview

The poll system consists of three main models:
1. **Poll** - The main poll entity
2. **PollOption** - Individual options within a poll
3. **PollVote** - Records of votes cast on poll options

## Models

### 1. Poll Model (`src/models/Poll.js`)

Represents a poll that can be created by users.

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | Yes (PK) | Auto | Primary key |
| `title` | STRING | Yes | - | Poll title (5-200 chars) |
| `description` | TEXT | No | - | Optional poll description |
| `type` | ENUM | Yes | 'simple' | Poll type: 'simple' or 'complex' |
| `allowUserContributions` | BOOLEAN | Yes | false | Allow users to add options |
| `allowUnauthenticatedVotes` | BOOLEAN | Yes | false | Allow unauthenticated voting |
| `visibility` | ENUM | Yes | 'public' | Who can see: 'public', 'private', 'locals_only' |
| `resultsVisibility` | ENUM | Yes | 'always' | When results shown: 'always', 'after_vote', 'after_deadline' |
| `deadline` | DATE | No | - | Optional voting deadline |
| `locationId` | INTEGER | No | - | For locals_only polls (FK: Locations) |
| `creatorId` | INTEGER | Yes | - | Poll creator (FK: Users) |
| `status` | ENUM | Yes | 'active' | Status: 'active', 'closed', 'archived' |
| `createdAt` | DATE | Yes | Auto | Creation timestamp |
| `updatedAt` | DATE | Yes | Auto | Last update timestamp |

#### Associations

- **belongsTo** User (as 'creator') via `creatorId`
- **belongsTo** Location (as 'location') via `locationId`
- **hasMany** PollOption (as 'options') via `pollId`
- **hasMany** PollVote (as 'votes') via `pollId`

---

### 2. PollOption Model (`src/models/PollOption.js`)

Represents an individual option within a poll.

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | Yes (PK) | Auto | Primary key |
| `pollId` | INTEGER | Yes | - | Parent poll (FK: Polls) |
| `text` | STRING | Conditional | - | Required for simple polls |
| `photoUrl` | STRING | No | - | Photo URL for complex polls |
| `linkUrl` | STRING | No | - | Link URL for complex polls |
| `displayText` | STRING | No | - | Display text for complex polls |
| `answerType` | ENUM | No | - | Type: 'person', 'article', 'custom' |
| `addedByUserId` | INTEGER | No | - | User who added (FK: Users) |
| `order` | INTEGER | Yes | 0 | Display order |
| `createdAt` | DATE | Yes | Auto | Creation timestamp |
| `updatedAt` | DATE | Yes | Auto | Last update timestamp |

#### Associations

- **belongsTo** Poll (as 'poll') via `pollId`
- **belongsTo** User (as 'addedBy') via `addedByUserId`
- **hasMany** PollVote (as 'votes') via `optionId`

#### Indexes

- Index on `pollId` for efficient poll option lookups

---

### 3. PollVote Model (`src/models/PollVote.js`)

Records votes cast on poll options.

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | Yes (PK) | Auto | Primary key |
| `pollId` | INTEGER | Yes | - | Poll being voted on (FK: Polls) |
| `optionId` | INTEGER | Yes | - | Option selected (FK: PollOptions) |
| `userId` | INTEGER | No | - | Voting user (FK: Users), null for anonymous |
| `isAuthenticated` | BOOLEAN | Yes | - | Whether vote is authenticated |
| `sessionId` | STRING | No | - | Session ID for anonymous votes |
| `ipAddress` | STRING | No | - | IP address for tracking |
| `createdAt` | DATE | Yes | Auto | Vote timestamp |
| `updatedAt` | DATE | Yes | Auto | Last update timestamp |

#### Associations

- **belongsTo** Poll (as 'poll') via `pollId`
- **belongsTo** PollOption (as 'option') via `optionId`
- **belongsTo** User (as 'user') via `userId`

#### Indexes

1. **Unique composite index** on `[pollId, userId]` (where userId is NOT NULL)
   - Ensures one vote per authenticated user per poll
   - Named: `unique_user_vote_per_poll`

2. **Composite index** on `[pollId, sessionId]`
   - For tracking anonymous votes by session

---

## User Model Associations

The existing User model has been extended with these associations:

- **hasMany** Poll (as 'polls') via `creatorId` - Polls created by user
- **hasMany** PollVote (as 'pollVotes') via `userId` - Votes cast by user

---

## Usage Examples

### Creating a Simple Poll

```javascript
const { Poll, PollOption, User } = require('./src/models');

// Create a poll
const poll = await Poll.create({
  title: 'What is your favorite programming language?',
  description: 'Help us understand the community preferences',
  type: 'simple',
  creatorId: userId,
  visibility: 'public',
  resultsVisibility: 'always',
  status: 'active'
});

// Add options
await PollOption.bulkCreate([
  { pollId: poll.id, text: 'JavaScript', order: 1 },
  { pollId: poll.id, text: 'Python', order: 2 },
  { pollId: poll.id, text: 'Java', order: 3 },
  { pollId: poll.id, text: 'Go', order: 4 }
]);
```

### Creating a Complex Poll with User Contributions

```javascript
const poll = await Poll.create({
  title: 'Best local restaurant',
  type: 'complex',
  allowUserContributions: true,
  visibility: 'locals_only',
  locationId: locationId,
  creatorId: userId
});

// Initial options
await PollOption.create({
  pollId: poll.id,
  displayText: 'Pizza Palace',
  photoUrl: 'https://example.com/pizza.jpg',
  linkUrl: 'https://pizzapalace.com',
  answerType: 'custom',
  order: 1
});
```

### Recording a Vote

```javascript
const { PollVote } = require('./src/models');

// Authenticated vote
await PollVote.create({
  pollId: pollId,
  optionId: optionId,
  userId: userId,
  isAuthenticated: true
});

// Anonymous vote
await PollVote.create({
  pollId: pollId,
  optionId: optionId,
  userId: null,
  isAuthenticated: false,
  sessionId: sessionId,
  ipAddress: req.ip
});
```

### Querying Poll Results

```javascript
const poll = await Poll.findByPk(pollId, {
  include: [
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'username', 'avatar']
    },
    {
      model: PollOption,
      as: 'options',
      include: [
        {
          model: PollVote,
          as: 'votes'
        }
      ]
    }
  ]
});

// Calculate vote counts
const results = poll.options.map(option => ({
  id: option.id,
  text: option.text,
  voteCount: option.votes.length
}));
```

---

## Database Schema Notes

### Cascading Deletes

- When a **Poll** is deleted:
  - All associated **PollOptions** are deleted (CASCADE)
  - All associated **PollVotes** are deleted (CASCADE)

- When a **PollOption** is deleted:
  - All associated **PollVotes** are deleted (CASCADE)

### Soft References

- When a **User** is deleted:
  - Their created **Polls** are deleted (CASCADE via creatorId)
  - Their **PollVotes** have userId set to NULL (SET NULL)
  - PollOptions they added have addedByUserId set to NULL (SET NULL)

- When a **Location** is deleted:
  - Associated **Polls** have locationId set to NULL (SET NULL)

### Vote Constraints

- Authenticated users can vote once per poll (enforced by unique index)
- Anonymous votes are tracked by sessionId and ipAddress
- The `isAuthenticated` flag allows for different handling of authenticated vs anonymous votes

---

## Testing

A comprehensive test suite is available at `src/models/__tests__/poll-models.test.js`.

Run tests with:
```bash
node src/models/__tests__/poll-models.test.js
```

The test validates:
- Model definitions
- Field types and constraints
- ENUM values
- Associations
- Indexes
- Default values
- Foreign key constraints
- Validation rules

---

## Future Enhancements

Potential additions to consider:

1. **Vote weight/ranking**: Support for ranked-choice or weighted voting
2. **Poll templates**: Reusable poll configurations
3. **Poll analytics**: Detailed statistics and demographics
4. **Poll sharing**: Social sharing capabilities
5. **Poll notifications**: Alert users of new polls or results
6. **Vote history**: Detailed audit trail for votes
7. **Poll cloning**: Duplicate existing polls
8. **Multi-select polls**: Allow selecting multiple options
9. **Poll scheduling**: Auto-open/close at specific times
10. **Poll categories/tags**: Better organization and discovery
