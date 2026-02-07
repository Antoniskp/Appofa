# Poll/Voting System Documentation

## Overview

This comprehensive poll/voting system supports multiple types of polls with flexible voting mechanisms, including authenticated and unauthenticated voting.

## Database Models

### Poll Model (`src/models/Poll.js`)

Main poll entity with complete configuration options.

**Fields:**
- `id` (INTEGER, PRIMARY KEY): Auto-incrementing poll ID
- `title` (STRING, REQUIRED): Poll title (3-200 characters)
- `description` (TEXT, OPTIONAL): Detailed poll description
- `status` (ENUM: 'open', 'closed', DEFAULT: 'open'): Poll status
- `creatorId` (INTEGER, REQUIRED, FK to User): Poll creator
- `pollType` (ENUM: 'simple', 'complex', DEFAULT: 'simple'):
  - `simple`: Text-based options
  - `complex`: Options with images, articles, or person profiles
- `questionType` (ENUM: 'single-choice', 'ranked-choice', 'free-text', DEFAULT: 'single-choice'):
  - `single-choice`: Select one option
  - `ranked-choice`: Rank options in order of preference
  - `free-text`: Open text responses
- `allowUnauthenticatedVoting` (BOOLEAN, DEFAULT: false): Allow non-logged users to vote
- `allowUserAddOptions` (BOOLEAN, DEFAULT: false): Allow users to add their own options
- `settings` (JSON, DEFAULT: {}): Flexible configuration object for:
  - Max ranked choices
  - Free-text character limits
  - Custom validation rules
  - Display preferences
- `createdAt` (DATE): Creation timestamp
- `updatedAt` (DATE): Last update timestamp

**Associations:**
- `belongsTo` User (as 'creator')
- `hasMany` PollOption (as 'options')
- `hasMany` Vote (as 'votes')

### PollOption Model (`src/models/PollOption.js`)

Answer choices for polls, supporting both simple and complex option types.

**Fields:**
- `id` (INTEGER, PRIMARY KEY): Auto-incrementing option ID
- `pollId` (INTEGER, REQUIRED, FK to Poll): Associated poll
- `optionText` (TEXT, REQUIRED): Option text (1-1000 characters)
- `optionType` (ENUM: 'text', 'article', 'person', DEFAULT: 'text'):
  - `text`: Simple text option
  - `article`: Article/news reference with link
  - `person`: Person profile with image
- `imageUrl` (STRING, OPTIONAL): Image URL for complex options
- `linkUrl` (STRING, OPTIONAL): Link to article, profile, etc.
- `displayName` (STRING, OPTIONAL): Display name for articles or persons
- `metadata` (JSON, DEFAULT: {}): Additional flexible data
- `createdById` (INTEGER, OPTIONAL, FK to User): User who added option (if user-added)
- `order` (INTEGER, DEFAULT: 0): Display order
- `createdAt` (DATE): Creation timestamp
- `updatedAt` (DATE): Last update timestamp

**Associations:**
- `belongsTo` Poll (as 'poll')
- `belongsTo` User (as 'createdBy')
- `hasMany` Vote (as 'votes')

### Vote Model (`src/models/Vote.js`)

Individual votes with support for authenticated/unauthenticated voting and multiple voting types.

**Fields:**
- `id` (INTEGER, PRIMARY KEY): Auto-incrementing vote ID
- `pollId` (INTEGER, REQUIRED, FK to Poll): Associated poll
- `optionId` (INTEGER, OPTIONAL, FK to PollOption): Selected option (null for free-text)
- `userId` (INTEGER, OPTIONAL, FK to User): Voting user (null for unauthenticated)
- `isAuthenticated` (BOOLEAN, DEFAULT: false): Whether vote is authenticated
- `rankPosition` (INTEGER, OPTIONAL): Ranking position for ranked-choice (1=first, 2=second, etc.)
- `freeTextResponse` (TEXT, OPTIONAL): Free-text answer
- `sessionId` (STRING, OPTIONAL): Session ID for unauthenticated vote tracking
- `ipAddress` (STRING, OPTIONAL): IP address for duplicate prevention
- `createdAt` (DATE): Vote timestamp
- `updatedAt` (DATE): Last update timestamp

**Associations:**
- `belongsTo` Poll (as 'poll')
- `belongsTo` PollOption (as 'option')
- `belongsTo` User (as 'user')

## Database Migration

**File:** `src/migrations/006-create-polls-tables.js`

### Migration Features:
- Creates all three tables (Polls, PollOptions, Votes)
- Adds proper foreign key constraints with CASCADE/SET NULL
- Creates indexes for optimal query performance:
  - `polls_creator_id_idx`: Fast lookup of user's polls
  - `polls_status_idx`: Filter polls by status
  - `poll_options_poll_id_idx`: Fast option retrieval
  - `poll_options_created_by_id_idx`: User-added options
  - `poll_options_poll_id_order_idx`: Ordered option display
  - `votes_poll_id_idx`: Vote aggregation
  - `votes_option_id_idx`: Option vote counting
  - `votes_user_id_idx`: User voting history
  - `votes_session_id_idx`: Unauthenticated vote tracking
  - `votes_poll_id_user_id_idx`: Single-vote enforcement (authenticated)
  - `votes_poll_id_session_id_idx`: Single-vote enforcement (unauthenticated)

### Running the Migration:

```bash
# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down
```

### With Docker:

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migration
npm run migrate:up
```

## Use Cases

### 1. Simple Single-Choice Poll
```javascript
// Create poll
const poll = await Poll.create({
  title: "What's your favorite color?",
  creatorId: userId,
  pollType: 'simple',
  questionType: 'single-choice',
  status: 'open'
});

// Add options
await PollOption.bulkCreate([
  { pollId: poll.id, optionText: 'Red', order: 1 },
  { pollId: poll.id, optionText: 'Blue', order: 2 },
  { pollId: poll.id, optionText: 'Green', order: 3 }
]);

// Vote (authenticated)
await Vote.create({
  pollId: poll.id,
  optionId: option.id,
  userId: voterId,
  isAuthenticated: true
});
```

### 2. Ranked-Choice Voting
```javascript
const poll = await Poll.create({
  title: "Rank your favorite programming languages",
  creatorId: userId,
  pollType: 'simple',
  questionType: 'ranked-choice',
  settings: { maxRankings: 3 }
});

// Vote with rankings
await Vote.bulkCreate([
  { pollId: poll.id, optionId: option1.id, userId: voterId, rankPosition: 1 },
  { pollId: poll.id, optionId: option2.id, userId: voterId, rankPosition: 2 },
  { pollId: poll.id, optionId: option3.id, userId: voterId, rankPosition: 3 }
]);
```

### 3. Complex Poll with Articles
```javascript
const poll = await Poll.create({
  title: "Best Article of the Week",
  creatorId: userId,
  pollType: 'complex',
  questionType: 'single-choice'
});

// Add article options
await PollOption.create({
  pollId: poll.id,
  optionText: "Full article excerpt...",
  optionType: 'article',
  displayName: "Breaking: Major News Story",
  imageUrl: "/images/article-banner.jpg",
  linkUrl: "/articles/123",
  metadata: { articleId: 123, author: 'John Doe' },
  order: 1
});
```

### 4. Unauthenticated Voting
```javascript
const poll = await Poll.create({
  title: "Quick Survey",
  creatorId: userId,
  allowUnauthenticatedVoting: true
});

// Vote without authentication
await Vote.create({
  pollId: poll.id,
  optionId: option.id,
  isAuthenticated: false,
  sessionId: req.sessionID,
  ipAddress: req.ip
});
```

### 5. User-Added Options
```javascript
const poll = await Poll.create({
  title: "What feature should we build next?",
  creatorId: userId,
  allowUserAddOptions: true
});

// User adds their own option
await PollOption.create({
  pollId: poll.id,
  optionText: "Dark mode support",
  createdById: userId,
  order: await getNextOrder(poll.id)
});
```

### 6. Free-Text Responses
```javascript
const poll = await Poll.create({
  title: "What improvements would you like to see?",
  creatorId: userId,
  questionType: 'free-text',
  settings: { maxLength: 500 }
});

// Submit free-text vote
await Vote.create({
  pollId: poll.id,
  userId: voterId,
  freeTextResponse: "I would love to see better mobile support...",
  isAuthenticated: true
});
```

## Query Examples

### Get Poll with All Options and Vote Counts
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
          model: Vote,
          as: 'votes',
          attributes: []
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('options.votes.id')), 'voteCount']
        ]
      },
      order: [['order', 'ASC']]
    }
  ],
  group: ['Poll.id', 'creator.id', 'options.id']
});
```

### Check if User Has Voted
```javascript
const hasVoted = await Vote.findOne({
  where: {
    pollId: pollId,
    userId: userId
  }
});
```

### Get User's Vote History
```javascript
const userVotes = await Vote.findAll({
  where: { userId: userId },
  include: [
    {
      model: Poll,
      as: 'poll',
      attributes: ['id', 'title', 'questionType']
    },
    {
      model: PollOption,
      as: 'option',
      attributes: ['id', 'optionText']
    }
  ],
  order: [['createdAt', 'DESC']]
});
```

### Get Ranked-Choice Results
```javascript
const rankedVotes = await Vote.findAll({
  where: { pollId: pollId },
  include: [
    {
      model: PollOption,
      as: 'option'
    }
  ],
  order: [['userId', 'ASC'], ['rankPosition', 'ASC']]
});
```

## Testing

Two test files are provided:

### 1. Model Verification Test
```bash
node src/test-poll-models.js
```
Verifies:
- All model files exist
- Models can be loaded
- Migration structure is correct
- Associations are defined
- Model fields are correct

### 2. Integration Test
```bash
node src/test-poll-migration.js
```
Verifies:
- Migration can run successfully
- All tables are created
- All columns are present
- Rollback works correctly

## Security Considerations

1. **Vote Integrity**: Use indexes to prevent duplicate votes
2. **Unauthenticated Voting**: Track by sessionId and IP address
3. **Input Validation**: All text fields have length limits
4. **Foreign Key Constraints**: Maintain referential integrity
5. **Soft Deletion**: Consider adding `deletedAt` for polls

## Future Enhancements

- Vote weight/scoring systems
- Poll expiration dates
- Anonymous voting (hide voter identity)
- Poll templates
- Real-time vote updates
- Result analytics and charts
- Poll cloning/duplication
- Scheduled poll opening/closing

## Model Exports

All models are exported from `src/models/index.js`:

```javascript
const { Poll, PollOption, Vote } = require('./models');
```
