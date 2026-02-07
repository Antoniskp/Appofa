#!/bin/bash

# End-to-End Poll System Test Script
# Tests the complete poll creation, voting, and results flow

set -e  # Exit on error

API_URL="http://localhost:3000/api"
POLLS_URL="$API_URL/polls"
AUTH_URL="$API_URL/auth"
COOKIE_FILE="/tmp/poll_test_cookies.txt"

echo "=== Poll System End-to-End Test ==="
echo ""

# Clean up old cookies
rm -f $COOKIE_FILE

# 1. Register a test user
echo "1. Registering test user..."
REGISTER_RESPONSE=$(curl -s -c $COOKIE_FILE -X POST "$AUTH_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "polltest'$(date +%s)'",
    "email": "polltest'$(date +%s)'@example.com",
    "password": "Test123456",
    "firstName": "Poll",
    "lastName": "Tester"
  }')

echo "Register response: $REGISTER_RESPONSE"
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.user.id')

# Extract token from cookie
if [ -f "$COOKIE_FILE" ]; then
  TOKEN=$(grep auth_token $COOKIE_FILE | awk '{print $7}')
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✓ User registered successfully (ID: $USER_ID)"
echo ""

# Get CSRF token
echo "Getting CSRF token..."
CSRF_RESPONSE=$(curl -s -b $COOKIE_FILE -c $COOKIE_FILE "$API_URL/auth/csrf-token")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | jq -r '.csrfToken')

if [ -z "$CSRF_TOKEN" ] || [ "$CSRF_TOKEN" == "null" ]; then
  echo "❌ Failed to get CSRF token"
  exit 1
fi

echo "✓ CSRF token obtained"
echo ""

# 2. Create a simple poll
echo "2. Creating a simple poll..."
CREATE_POLL_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$POLLS_URL" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "title": "What is your favorite programming language?",
    "description": "Choose your preferred language",
    "pollType": "simple",
    "questionType": "single-choice",
    "allowUnauthenticatedVoting": true,
    "allowUserAddOptions": false,
    "status": "open",
    "options": [
      {"optionText": "JavaScript"},
      {"optionText": "Python"},
      {"optionText": "Java"},
      {"optionText": "Go"}
    ]
  }')

echo "Create poll response: $CREATE_POLL_RESPONSE"
POLL_ID=$(echo $CREATE_POLL_RESPONSE | jq -r '.data.id')

if [ "$POLL_ID" == "null" ] || [ -z "$POLL_ID" ]; then
  echo "❌ Failed to create poll"
  exit 1
fi

echo "✓ Poll created successfully (ID: $POLL_ID)"
echo ""

# 3. Get poll details
echo "3. Fetching poll details..."
POLL_DETAILS=$(curl -s "$POLLS_URL/$POLL_ID")
POLL_TITLE=$(echo $POLL_DETAILS | jq -r '.data.title')
OPTION_COUNT=$(echo $POLL_DETAILS | jq -r '.data.options | length')

echo "Poll: $POLL_TITLE"
echo "Options: $OPTION_COUNT"
echo "✓ Poll details retrieved successfully"
echo ""

# 4. Get an option ID for voting
OPTION_ID=$(echo $POLL_DETAILS | jq -r '.data.options[0].id')
echo "4. Voting for option ID: $OPTION_ID"

# 5. Submit a vote
VOTE_RESPONSE=$(curl -s -X POST "$POLLS_URL/$POLL_ID/vote" \
  -H "Content-Type: application/json" \
  -b $COOKIE_FILE \
  -d "{
    \"optionId\": $OPTION_ID
  }")

echo "Vote response: $VOTE_RESPONSE"
VOTE_SUCCESS=$(echo $VOTE_RESPONSE | jq -r '.success')

if [ "$VOTE_SUCCESS" != "true" ]; then
  echo "❌ Failed to submit vote"
  exit 1
fi

echo "✓ Vote submitted successfully"
echo ""

# 6. Get poll results
echo "6. Fetching poll results..."
RESULTS_RESPONSE=$(curl -s "$POLLS_URL/$POLL_ID/results")
TOTAL_VOTES=$(echo $RESULTS_RESPONSE | jq -r '.data.totalVotes')
echo "Total votes: $TOTAL_VOTES"

if [ "$TOTAL_VOTES" != "1" ]; then
  echo "❌ Vote count mismatch (expected 1, got $TOTAL_VOTES)"
  exit 1
fi

echo "✓ Poll results retrieved successfully"
echo ""

# 7. Create a ranked-choice poll
echo "7. Creating a ranked-choice poll..."
RANKED_POLL_RESPONSE=$(curl -s -X POST "$POLLS_URL" \
  -H "Content-Type: application/json" \
  -b $COOKIE_FILE \
  -d '{
    "title": "Rank your favorite frameworks",
    "description": "Rank from most to least favorite",
    "pollType": "simple",
    "questionType": "ranked-choice",
    "allowUnauthenticatedVoting": false,
    "status": "open",
    "options": [
      {"optionText": "React"},
      {"optionText": "Vue"},
      {"optionText": "Angular"}
    ]
  }')

RANKED_POLL_ID=$(echo $RANKED_POLL_RESPONSE | jq -r '.data.id')

if [ "$RANKED_POLL_ID" == "null" ] || [ -z "$RANKED_POLL_ID" ]; then
  echo "❌ Failed to create ranked-choice poll"
  exit 1
fi

echo "✓ Ranked-choice poll created (ID: $RANKED_POLL_ID)"
echo ""

# 8. Create a free-text poll
echo "8. Creating a free-text poll..."
FREETEXT_POLL_RESPONSE=$(curl -s -X POST "$POLLS_URL" \
  -H "Content-Type: application/json" \
  -b $COOKIE_FILE \
  -d '{
    "title": "What features would you like to see?",
    "description": "Share your suggestions",
    "pollType": "simple",
    "questionType": "free-text",
    "allowUnauthenticatedVoting": true,
    "status": "open"
  }')

FREETEXT_POLL_ID=$(echo $FREETEXT_POLL_RESPONSE | jq -r '.data.id')

if [ "$FREETEXT_POLL_ID" == "null" ] || [ -z "$FREETEXT_POLL_ID" ]; then
  echo "❌ Failed to create free-text poll"
  exit 1
fi

echo "✓ Free-text poll created (ID: $FREETEXT_POLL_ID)"
echo ""

# 9. List all polls
echo "9. Listing all polls..."
POLLS_LIST=$(curl -s "$POLLS_URL")
POLL_COUNT=$(echo $POLLS_LIST | jq -r '.data | length')

echo "Total polls: $POLL_COUNT"

if [ "$POLL_COUNT" -lt "3" ]; then
  echo "❌ Expected at least 3 polls"
  exit 1
fi

echo "✓ Poll listing successful"
echo ""

# 10. Update poll
echo "10. Updating poll description..."
UPDATE_RESPONSE=$(curl -s -X PUT "$POLLS_URL/$POLL_ID" \
  -H "Content-Type: application/json" \
  -b $COOKIE_FILE \
  -d '{
    "description": "Updated: Choose your most preferred language"
  }')

UPDATE_SUCCESS=$(echo $UPDATE_RESPONSE | jq -r '.success')

if [ "$UPDATE_SUCCESS" != "true" ]; then
  echo "❌ Failed to update poll"
  exit 1
fi

echo "✓ Poll updated successfully"
echo ""

# 11. Close a poll
echo "11. Closing the ranked-choice poll..."
CLOSE_RESPONSE=$(curl -s -X PUT "$POLLS_URL/$RANKED_POLL_ID" \
  -H "Content-Type: application/json" \
  -b $COOKIE_FILE \
  -d '{
    "status": "closed"
  }')

CLOSE_SUCCESS=$(echo $CLOSE_RESPONSE | jq -r '.success')

if [ "$CLOSE_SUCCESS" != "true" ]; then
  echo "❌ Failed to close poll"
  exit 1
fi

echo "✓ Poll closed successfully"
echo ""

# 12. Test unauthenticated voting
echo "12. Testing unauthenticated voting..."
SESSION_ID="test_session_$(date +%s)"
UNAUTH_VOTE=$(curl -s -X POST "$POLLS_URL/$POLL_ID/vote" \
  -H "Content-Type: application/json" \
  -d "{
    \"optionId\": $OPTION_ID,
    \"sessionId\": \"$SESSION_ID\",
    \"ipAddress\": \"192.168.1.100\"
  }")

UNAUTH_SUCCESS=$(echo $UNAUTH_VOTE | jq -r '.success')

if [ "$UNAUTH_SUCCESS" != "true" ]; then
  echo "❌ Failed to submit unauthenticated vote"
  exit 1
fi

echo "✓ Unauthenticated vote submitted successfully"
echo ""

# 13. Verify vote count increased
echo "13. Verifying vote count..."
UPDATED_RESULTS=$(curl -s "$POLLS_URL/$POLL_ID/results")
NEW_TOTAL_VOTES=$(echo $UPDATED_RESULTS | jq -r '.data.totalVotes')

echo "Updated total votes: $NEW_TOTAL_VOTES"

if [ "$NEW_TOTAL_VOTES" != "2" ]; then
  echo "❌ Vote count mismatch (expected 2, got $NEW_TOTAL_VOTES)"
  exit 1
fi

echo "✓ Vote count verified"
echo ""

# 14. Delete a poll
echo "14. Deleting the free-text poll..."
DELETE_RESPONSE=$(curl -s -X DELETE "$POLLS_URL/$FREETEXT_POLL_ID" \
  -b $COOKIE_FILE)

DELETE_SUCCESS=$(echo $DELETE_RESPONSE | jq -r '.success')

if [ "$DELETE_SUCCESS" != "true" ]; then
  echo "❌ Failed to delete poll"
  exit 1
fi

echo "✓ Poll deleted successfully"
echo ""

echo "=== All Tests Passed! ✅ ==="
echo ""
echo "Summary:"
echo "- Created 3 polls (simple, ranked-choice, free-text)"
echo "- Submitted authenticated and unauthenticated votes"
echo "- Retrieved poll details and results"
echo "- Updated and closed polls"
echo "- Deleted a poll"
echo "- All API endpoints working correctly"
