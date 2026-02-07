#!/usr/bin/env node
/**
 * Test model associations and relationships
 */

const { Sequelize } = require('sequelize');
const path = require('path');

console.log('=== Testing Poll Model Associations ===\n');

// Use in-memory SQLite for testing
const testDb = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Recreate models with test database
const { DataTypes } = require('sequelize');

// Define minimal User model for testing
const User = testDb.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false }
});

// Define Poll model
const Poll = testDb.define('Poll', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  creatorId: { type: DataTypes.INTEGER, allowNull: false },
  pollType: { type: DataTypes.STRING, defaultValue: 'simple' },
  questionType: { type: DataTypes.STRING, defaultValue: 'single-choice' }
});

// Define PollOption model
const PollOption = testDb.define('PollOption', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pollId: { type: DataTypes.INTEGER, allowNull: false },
  optionText: { type: DataTypes.TEXT, allowNull: false },
  order: { type: DataTypes.INTEGER, defaultValue: 0 }
});

// Define Vote model
const Vote = testDb.define('Vote', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pollId: { type: DataTypes.INTEGER, allowNull: false },
  optionId: { type: DataTypes.INTEGER },
  userId: { type: DataTypes.INTEGER },
  isAuthenticated: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Set up associations
User.hasMany(Poll, { foreignKey: 'creatorId', as: 'polls' });
Poll.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

Poll.hasMany(PollOption, { foreignKey: 'pollId', as: 'options' });
PollOption.belongsTo(Poll, { foreignKey: 'pollId', as: 'poll' });

Poll.hasMany(Vote, { foreignKey: 'pollId', as: 'votes' });
Vote.belongsTo(Poll, { foreignKey: 'pollId', as: 'poll' });

Vote.belongsTo(PollOption, { foreignKey: 'optionId', as: 'option' });
PollOption.hasMany(Vote, { foreignKey: 'optionId', as: 'votes' });

Vote.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Vote, { foreignKey: 'userId', as: 'votes' });

async function runTests() {
  try {
    // Sync models
    console.log('Test 1: Syncing database schema...');
    await testDb.sync({ force: true });
    console.log('  ✓ Database schema synced\n');

    // Create test user
    console.log('Test 2: Creating test user...');
    const user = await User.create({
      username: 'testuser'
    });
    console.log(`  ✓ User created (id: ${user.id})\n`);

    // Create poll
    console.log('Test 3: Creating poll...');
    const poll = await Poll.create({
      title: 'Test Poll',
      creatorId: user.id,
      pollType: 'simple',
      questionType: 'single-choice'
    });
    console.log(`  ✓ Poll created (id: ${poll.id})\n`);

    // Create poll options
    console.log('Test 4: Creating poll options...');
    const option1 = await PollOption.create({
      pollId: poll.id,
      optionText: 'Option 1',
      order: 1
    });
    const option2 = await PollOption.create({
      pollId: poll.id,
      optionText: 'Option 2',
      order: 2
    });
    console.log(`  ✓ Created ${2} options\n`);

    // Create vote
    console.log('Test 5: Creating vote...');
    const vote = await Vote.create({
      pollId: poll.id,
      optionId: option1.id,
      userId: user.id,
      isAuthenticated: true
    });
    console.log(`  ✓ Vote created (id: ${vote.id})\n`);

    // Test associations - Poll with creator
    console.log('Test 6: Testing Poll -> User association...');
    const pollWithCreator = await Poll.findByPk(poll.id, {
      include: [{ model: User, as: 'creator' }]
    });
    if (pollWithCreator.creator && pollWithCreator.creator.username === 'testuser') {
      console.log(`  ✓ Poll.creator loaded correctly (${pollWithCreator.creator.username})\n`);
    } else {
      throw new Error('Poll.creator association failed');
    }

    // Test associations - Poll with options
    console.log('Test 7: Testing Poll -> PollOptions association...');
    const pollWithOptions = await Poll.findByPk(poll.id, {
      include: [{ model: PollOption, as: 'options' }]
    });
    if (pollWithOptions.options && pollWithOptions.options.length === 2) {
      console.log(`  ✓ Poll.options loaded correctly (${pollWithOptions.options.length} options)\n`);
    } else {
      throw new Error('Poll.options association failed');
    }

    // Test associations - Poll with votes
    console.log('Test 8: Testing Poll -> Votes association...');
    const pollWithVotes = await Poll.findByPk(poll.id, {
      include: [{ model: Vote, as: 'votes' }]
    });
    if (pollWithVotes.votes && pollWithVotes.votes.length === 1) {
      console.log(`  ✓ Poll.votes loaded correctly (${pollWithVotes.votes.length} vote)\n`);
    } else {
      throw new Error('Poll.votes association failed');
    }

    // Test associations - Vote with option
    console.log('Test 9: Testing Vote -> PollOption association...');
    const voteWithOption = await Vote.findByPk(vote.id, {
      include: [{ model: PollOption, as: 'option' }]
    });
    if (voteWithOption.option && voteWithOption.option.optionText === 'Option 1') {
      console.log(`  ✓ Vote.option loaded correctly (${voteWithOption.option.optionText})\n`);
    } else {
      throw new Error('Vote.option association failed');
    }

    // Test associations - Vote with user
    console.log('Test 10: Testing Vote -> User association...');
    const voteWithUser = await Vote.findByPk(vote.id, {
      include: [{ model: User, as: 'user' }]
    });
    if (voteWithUser.user && voteWithUser.user.username === 'testuser') {
      console.log(`  ✓ Vote.user loaded correctly (${voteWithUser.user.username})\n`);
    } else {
      throw new Error('Vote.user association failed');
    }

    // Test associations - User polls
    console.log('Test 11: Testing User -> Polls association...');
    const userWithPolls = await User.findByPk(user.id, {
      include: [{ model: Poll, as: 'polls' }]
    });
    if (userWithPolls.polls && userWithPolls.polls.length === 1) {
      console.log(`  ✓ User.polls loaded correctly (${userWithPolls.polls.length} poll)\n`);
    } else {
      throw new Error('User.polls association failed');
    }

    // Test associations - PollOption votes
    console.log('Test 12: Testing PollOption -> Votes association...');
    const optionWithVotes = await PollOption.findByPk(option1.id, {
      include: [{ model: Vote, as: 'votes' }]
    });
    if (optionWithVotes.votes && optionWithVotes.votes.length === 1) {
      console.log(`  ✓ PollOption.votes loaded correctly (${optionWithVotes.votes.length} vote)\n`);
    } else {
      throw new Error('PollOption.votes association failed');
    }

    // Test complex nested query
    console.log('Test 13: Testing complex nested query...');
    const fullPoll = await Poll.findByPk(poll.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { 
          model: PollOption, 
          as: 'options',
          include: [{ model: Vote, as: 'votes' }]
        },
        { 
          model: Vote, 
          as: 'votes',
          include: [
            { model: User, as: 'user' },
            { model: PollOption, as: 'option' }
          ]
        }
      ]
    });
    
    if (fullPoll.creator && fullPoll.options && fullPoll.votes) {
      console.log('  ✓ Complex nested query successful');
      console.log(`    - Creator: ${fullPoll.creator.username}`);
      console.log(`    - Options: ${fullPoll.options.length}`);
      console.log(`    - Votes: ${fullPoll.votes.length}\n`);
    } else {
      throw new Error('Complex nested query failed');
    }

    console.log('=== ✓ All Association Tests Passed! ===\n');
    console.log('All model relationships are working correctly:');
    console.log('  • User ↔ Poll (one-to-many)');
    console.log('  • Poll ↔ PollOption (one-to-many)');
    console.log('  • Poll ↔ Vote (one-to-many)');
    console.log('  • PollOption ↔ Vote (one-to-many)');
    console.log('  • User ↔ Vote (one-to-many)');
    console.log('  • Complex nested queries working\n');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await testDb.close();
  }
}

runTests();
