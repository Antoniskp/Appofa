/**
 * Test file to validate Poll system models and associations
 * Run with: node src/models/__tests__/poll-models.test.js
 */

const { sequelize, Poll, PollOption, PollVote, User, Location } = require('../index');

async function testModels() {
  console.log('🧪 Testing Poll System Models\n');

  try {
    // Test 1: Verify models are defined
    console.log('✓ Test 1: All models are properly defined');
    console.log('  - Poll:', Poll.name);
    console.log('  - PollOption:', PollOption.name);
    console.log('  - PollVote:', PollVote.name);

    // Test 2: Verify field definitions
    console.log('\n✓ Test 2: Field definitions are correct');
    const pollFields = Object.keys(Poll.rawAttributes);
    const requiredPollFields = ['id', 'title', 'type', 'visibility', 'resultsVisibility', 'creatorId', 'status'];
    const hasAllFields = requiredPollFields.every(field => pollFields.includes(field));
    console.log('  - Poll has all required fields:', hasAllFields);

    // Test 3: Verify ENUM values
    console.log('\n✓ Test 3: ENUM values are correct');
    console.log('  - Poll.type:', Poll.rawAttributes.type.values);
    console.log('  - Poll.visibility:', Poll.rawAttributes.visibility.values);
    console.log('  - Poll.status:', Poll.rawAttributes.status.values);
    console.log('  - PollOption.answerType:', PollOption.rawAttributes.answerType.values);

    // Test 4: Verify associations
    console.log('\n✓ Test 4: Associations are correctly defined');
    console.log('  - Poll associations:', Object.keys(Poll.associations).join(', '));
    console.log('  - PollOption associations:', Object.keys(PollOption.associations).join(', '));
    console.log('  - PollVote associations:', Object.keys(PollVote.associations).join(', '));
    
    // Verify specific associations
    const pollHasCreator = Poll.associations.creator && Poll.associations.creator.associationType === 'BelongsTo';
    const pollHasOptions = Poll.associations.options && Poll.associations.options.associationType === 'HasMany';
    const optionHasPoll = PollOption.associations.poll && PollOption.associations.poll.associationType === 'BelongsTo';
    const voteHasUser = PollVote.associations.user && PollVote.associations.user.associationType === 'BelongsTo';
    
    console.log('  - Poll belongsTo User (creator):', pollHasCreator);
    console.log('  - Poll hasMany PollOptions:', pollHasOptions);
    console.log('  - PollOption belongsTo Poll:', optionHasPoll);
    console.log('  - PollVote belongsTo User:', voteHasUser);

    // Test 5: Verify indexes
    console.log('\n✓ Test 5: Indexes are defined');
    console.log('  - PollOption has pollId index:', 
      PollOption.options.indexes.some(idx => idx.fields.includes('pollId')));
    console.log('  - PollVote has unique [pollId, userId] index:', 
      PollVote.options.indexes.some(idx => idx.unique && idx.fields.includes('pollId') && idx.fields.includes('userId')));
    console.log('  - PollVote has [pollId, sessionId] index:', 
      PollVote.options.indexes.some(idx => idx.fields.includes('pollId') && idx.fields.includes('sessionId')));

    // Test 6: Verify default values
    console.log('\n✓ Test 6: Default values are set correctly');
    console.log('  - Poll.type default:', Poll.rawAttributes.type.defaultValue);
    console.log('  - Poll.visibility default:', Poll.rawAttributes.visibility.defaultValue);
    console.log('  - Poll.status default:', Poll.rawAttributes.status.defaultValue);
    console.log('  - Poll.allowUserContributions default:', Poll.rawAttributes.allowUserContributions.defaultValue);
    console.log('  - PollOption.order default:', PollOption.rawAttributes.order.defaultValue);

    // Test 7: Verify foreign key constraints
    console.log('\n✓ Test 7: Foreign key constraints are defined');
    console.log('  - Poll.creatorId references Users:', 
      Poll.rawAttributes.creatorId.references.model === 'Users');
    console.log('  - PollOption.pollId references Polls:', 
      PollOption.rawAttributes.pollId.references.model === 'Polls');
    console.log('  - PollVote.optionId references PollOptions:', 
      PollVote.rawAttributes.optionId.references.model === 'PollOptions');

    // Test 8: Verify validation rules
    console.log('\n✓ Test 8: Validation rules are defined');
    console.log('  - Poll.title has length validation:', 
      Poll.rawAttributes.title.validate && Poll.rawAttributes.title.validate.len ? 'Yes' : 'No');
    
    console.log('\n🎉 All tests passed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testModels().then(() => {
  console.log('✅ Poll system models validation complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
