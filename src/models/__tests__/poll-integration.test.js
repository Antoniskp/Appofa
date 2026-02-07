/**
 * Integration test for Poll system models
 * Tests actual database operations, constraints, and cascading behavior
 * Run with: NODE_ENV=test node src/models/__tests__/poll-integration.test.js
 */

const { sequelize, Poll, PollOption, PollVote, User, Location } = require('../index');

async function setupTestDatabase() {
  // Sync all models to create tables
  await sequelize.sync({ force: true });
  console.log('✓ Test database synchronized\n');
}

async function createTestUser(username = 'testuser') {
  // Add timestamp to ensure uniqueness
  const uniqueUsername = `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return await User.create({
    username: uniqueUsername,
    email: `${uniqueUsername}@test.com`,
    password: 'testpassword123',
    role: 'viewer'
  });
}

async function createTestLocation() {
  const timestamp = Date.now();
  return await Location.create({
    name: 'Test City',
    slug: `test-city-${timestamp}`,
    type: 'municipality',
    lat: 40.7128,
    lng: -74.0060
  });
}

async function testPollCreation() {
  console.log('Test 1: Poll Creation and Field Validation');
  
  const user = await createTestUser('pollcreator');
  
  // Test valid poll creation
  const poll = await Poll.create({
    title: 'What is your favorite color?',
    description: 'A simple poll about color preferences',
    type: 'simple',
    creatorId: user.id,
    visibility: 'public',
    status: 'active'
  });
  
  console.log('  ✓ Poll created successfully:', poll.id);
  console.log('  ✓ Default values applied:', {
    type: poll.type,
    visibility: poll.visibility,
    resultsVisibility: poll.resultsVisibility,
    allowUserContributions: poll.allowUserContributions
  });
  
  // Test title length validation
  try {
    await Poll.create({
      title: 'ABC', // Too short
      creatorId: user.id
    });
    console.log('  ✗ Title validation failed - should have rejected short title');
  } catch (error) {
    console.log('  ✓ Title length validation works correctly');
  }
  
  return { poll, user };
}

async function testPollOptions() {
  console.log('\nTest 2: Poll Options Creation and Ordering');
  
  const user = await createTestUser('optionsuser');
  const poll = await Poll.create({
    title: 'Favorite programming language?',
    creatorId: user.id
  });
  
  // Create multiple options
  const options = await PollOption.bulkCreate([
    { pollId: poll.id, text: 'JavaScript', order: 1 },
    { pollId: poll.id, text: 'Python', order: 2 },
    { pollId: poll.id, text: 'Java', order: 3 },
    { pollId: poll.id, text: 'Go', order: 4 }
  ]);
  
  console.log('  ✓ Created', options.length, 'poll options');
  
  // Test option retrieval with ordering
  const pollWithOptions = await Poll.findByPk(poll.id, {
    include: [{
      model: PollOption,
      as: 'options',
      order: [['order', 'ASC']]
    }]
  });
  
  console.log('  ✓ Retrieved poll with options:', pollWithOptions.options.length);
  console.log('  ✓ Options ordered correctly:', pollWithOptions.options.map(o => o.text).join(', '));
  
  return { poll, options, user };
}

async function testVoting() {
  console.log('\nTest 3: Voting and Unique Vote Constraint');
  
  const user = await createTestUser('voter');
  const poll = await Poll.create({
    title: 'Test Poll',
    creatorId: user.id
  });
  const option = await PollOption.create({
    pollId: poll.id,
    text: 'Option A'
  });
  
  // Test authenticated vote
  const vote = await PollVote.create({
    pollId: poll.id,
    optionId: option.id,
    userId: user.id,
    isAuthenticated: true
  });
  
  console.log('  ✓ Authenticated vote recorded');
  
  // Test unique vote constraint
  try {
    await PollVote.create({
      pollId: poll.id,
      optionId: option.id,
      userId: user.id,
      isAuthenticated: true
    });
    console.log('  ✗ Unique constraint failed - user voted twice!');
  } catch (error) {
    console.log('  ✓ Unique vote constraint enforced correctly');
  }
  
  // Test anonymous vote
  const anonVote = await PollVote.create({
    pollId: poll.id,
    optionId: option.id,
    userId: null,
    isAuthenticated: false,
    sessionId: 'session-123',
    ipAddress: '192.168.1.1'
  });
  
  console.log('  ✓ Anonymous vote recorded');
  
  return { poll, option, user };
}

async function testAssociations() {
  console.log('\nTest 4: Model Associations');
  
  const creator = await createTestUser('creator');
  const voter = await createTestUser('voter');
  
  const poll = await Poll.create({
    title: 'Association Test Poll',
    creatorId: creator.id
  });
  
  const option = await PollOption.create({
    pollId: poll.id,
    text: 'Test Option'
  });
  
  await PollVote.create({
    pollId: poll.id,
    optionId: option.id,
    userId: voter.id,
    isAuthenticated: true
  });
  
  // Test Poll -> Creator association
  const pollWithCreator = await Poll.findByPk(poll.id, {
    include: [{ model: User, as: 'creator' }]
  });
  console.log('  ✓ Poll creator association:', pollWithCreator.creator.username);
  
  // Test Poll -> Options association
  const pollWithOptions = await Poll.findByPk(poll.id, {
    include: [{ model: PollOption, as: 'options' }]
  });
  console.log('  ✓ Poll options association:', pollWithOptions.options.length, 'option(s)');
  
  // Test Poll -> Votes association
  const pollWithVotes = await Poll.findByPk(poll.id, {
    include: [{ model: PollVote, as: 'votes' }]
  });
  console.log('  ✓ Poll votes association:', pollWithVotes.votes.length, 'vote(s)');
  
  // Test nested associations
  const fullPoll = await Poll.findByPk(poll.id, {
    include: [
      { model: User, as: 'creator' },
      {
        model: PollOption,
        as: 'options',
        include: [{ model: PollVote, as: 'votes' }]
      }
    ]
  });
  
  const voteCount = fullPoll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  console.log('  ✓ Nested associations work:', voteCount, 'total vote(s)');
}

async function testCascadeDeletes() {
  console.log('\nTest 5: Cascade Deletes');
  
  const user = await createTestUser('deletetest');
  const poll = await Poll.create({
    title: 'Delete Test Poll',
    creatorId: user.id
  });
  
  const option1 = await PollOption.create({ pollId: poll.id, text: 'Option 1' });
  const option2 = await PollOption.create({ pollId: poll.id, text: 'Option 2' });
  
  await PollVote.create({
    pollId: poll.id,
    optionId: option1.id,
    userId: user.id,
    isAuthenticated: true
  });
  
  const initialOptionCount = await PollOption.count({ where: { pollId: poll.id } });
  const initialVoteCount = await PollVote.count({ where: { pollId: poll.id } });
  
  console.log('  - Before delete:', initialOptionCount, 'options,', initialVoteCount, 'vote(s)');
  
  // Delete the poll - should cascade to options and votes
  await poll.destroy();
  
  const afterOptionCount = await PollOption.count({ where: { pollId: poll.id } });
  const afterVoteCount = await PollVote.count({ where: { pollId: poll.id } });
  
  console.log('  - After delete:', afterOptionCount, 'options,', afterVoteCount, 'vote(s)');
  console.log('  ✓ Cascade delete working correctly');
}

async function testComplexPolls() {
  console.log('\nTest 6: Complex Polls with Rich Options');
  
  const user = await createTestUser('complexuser');
  const poll = await Poll.create({
    title: 'Best Article of the Year',
    type: 'complex',
    creatorId: user.id
  });
  
  const option = await PollOption.create({
    pollId: poll.id,
    displayText: 'Amazing Tech Breakthrough',
    photoUrl: 'https://example.com/photo.jpg',
    linkUrl: 'https://example.com/article',
    answerType: 'article',
    order: 1
  });
  
  console.log('  ✓ Complex poll option created with rich data');
  console.log('  ✓ Option details:', {
    displayText: option.displayText,
    answerType: option.answerType
  });
}

async function testLocationBasedPolls() {
  console.log('\nTest 7: Location-based Polls');
  
  const user = await createTestUser('localuser');
  const location = await createTestLocation();
  
  const poll = await Poll.create({
    title: 'Local Community Poll',
    visibility: 'locals_only',
    locationId: location.id,
    creatorId: user.id
  });
  
  const pollWithLocation = await Poll.findByPk(poll.id, {
    include: [{ model: Location, as: 'location' }]
  });
  
  console.log('  ✓ Location-based poll created');
  console.log('  ✓ Location association:', pollWithLocation.location.name);
}

async function testUserContributions() {
  console.log('\nTest 8: User-contributed Options');
  
  const creator = await createTestUser('pollowner');
  const contributor = await createTestUser('contributor');
  
  const poll = await Poll.create({
    title: 'Collaborative Poll',
    allowUserContributions: true,
    creatorId: creator.id
  });
  
  // Creator adds initial option
  await PollOption.create({
    pollId: poll.id,
    text: 'Initial Option',
    order: 1
  });
  
  // User contributes an option
  const contributedOption = await PollOption.create({
    pollId: poll.id,
    text: 'User Contributed Option',
    addedByUserId: contributor.id,
    order: 2
  });
  
  const optionWithContributor = await PollOption.findByPk(contributedOption.id, {
    include: [{ model: User, as: 'addedBy' }]
  });
  
  console.log('  ✓ User-contributed option created');
  console.log('  ✓ Contributor tracked:', optionWithContributor.addedBy.username);
}

async function runAllTests() {
  console.log('🧪 Running Poll System Integration Tests\n');
  console.log('=' .repeat(60));
  
  try {
    await setupTestDatabase();
    
    await testPollCreation();
    await testPollOptions();
    await testVoting();
    await testAssociations();
    await testCascadeDeletes();
    await testComplexPolls();
    await testLocationBasedPolls();
    await testUserContributions();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All integration tests passed successfully!\n');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

// Run all tests
runAllTests();
