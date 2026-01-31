#!/bin/bash

# News Application Manual Test Script
# This script demonstrates the core functionality of the application

echo "==================================="
echo "News Application Test Script"
echo "==================================="
echo ""

# Set the base URL
BASE_URL="http://localhost:3000"

echo "Prerequisites Check:"
echo "1. PostgreSQL server is running"
echo "2. Database 'newsapp' has been created"
echo "3. Server is running on port 3000"
echo ""
echo "Press Enter to continue or Ctrl+C to exit..."
read

echo ""
echo "Step 1: Testing API root endpoint..."
curl -s "$BASE_URL/" | json_pp 2>/dev/null || curl -s "$BASE_URL/"
echo ""
echo ""

echo "Step 2: Registering an Admin user..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }')
echo "$ADMIN_RESPONSE" | json_pp 2>/dev/null || echo "$ADMIN_RESPONSE"
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo ""
echo "Admin Token: $ADMIN_TOKEN"
echo ""

echo "Step 3: Registering an Editor user..."
EDITOR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "editor",
    "email": "editor@example.com",
    "password": "editor123",
    "role": "editor",
    "firstName": "Editor",
    "lastName": "User"
  }')
echo "$EDITOR_RESPONSE" | json_pp 2>/dev/null || echo "$EDITOR_RESPONSE"
EDITOR_TOKEN=$(echo "$EDITOR_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo ""

echo "Step 4: Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')
echo "$LOGIN_RESPONSE" | json_pp 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

echo "Step 5: Getting user profile (authenticated)..."
curl -s -X GET "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | json_pp 2>/dev/null || \
curl -s -X GET "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo ""

echo "Step 6: Creating a news article (as Admin)..."
ARTICLE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/articles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Breaking News: Technology Breakthrough",
    "content": "A major technological breakthrough has been announced today. Scientists have made significant progress in the field of quantum computing, potentially revolutionizing the way we process information.",
    "summary": "Scientists announce major breakthrough in quantum computing",
    "category": "Technology",
    "status": "published"
  }')
echo "$ARTICLE_RESPONSE" | json_pp 2>/dev/null || echo "$ARTICLE_RESPONSE"
ARTICLE_ID=$(echo "$ARTICLE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo ""
echo "Article ID: $ARTICLE_ID"
echo ""

echo "Step 7: Getting all articles (public access)..."
curl -s -X GET "$BASE_URL/api/articles?status=published" | json_pp 2>/dev/null || \
curl -s -X GET "$BASE_URL/api/articles?status=published"
echo ""
echo ""

echo "Step 8: Getting single article..."
if [ ! -z "$ARTICLE_ID" ]; then
  curl -s -X GET "$BASE_URL/api/articles/$ARTICLE_ID" | json_pp 2>/dev/null || \
  curl -s -X GET "$BASE_URL/api/articles/$ARTICLE_ID"
else
  curl -s -X GET "$BASE_URL/api/articles/1" | json_pp 2>/dev/null || \
  curl -s -X GET "$BASE_URL/api/articles/1"
fi
echo ""
echo ""

echo "Step 9: Updating article (as Editor)..."
if [ ! -z "$ARTICLE_ID" ] && [ ! -z "$EDITOR_TOKEN" ]; then
  curl -s -X PUT "$BASE_URL/api/articles/$ARTICLE_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $EDITOR_TOKEN" \
    -d '{
      "title": "Updated: Major Technology Breakthrough Confirmed",
      "content": "Following the initial announcement, the technological breakthrough has been confirmed by independent researchers."
    }' | json_pp 2>/dev/null || \
  curl -s -X PUT "$BASE_URL/api/articles/$ARTICLE_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $EDITOR_TOKEN" \
    -d '{
      "title": "Updated: Major Technology Breakthrough Confirmed",
      "content": "Following the initial announcement, the technological breakthrough has been confirmed by independent researchers."
    }'
else
  echo "Skipping - missing article ID or editor token"
fi
echo ""
echo ""

echo "==================================="
echo "Test Script Complete!"
echo "==================================="
echo ""
echo "Summary:"
echo "- Admin user created and authenticated"
echo "- Editor user created and authenticated"
echo "- User login tested"
echo "- Profile retrieval tested"
echo "- Article creation tested"
echo "- Article listing tested"
echo "- Article retrieval tested"
echo "- Article update tested (role-based)"
echo ""
echo "To delete the test article, run:"
if [ ! -z "$ARTICLE_ID" ] && [ ! -z "$ADMIN_TOKEN" ]; then
  echo "curl -X DELETE $BASE_URL/api/articles/$ARTICLE_ID -H \"Authorization: Bearer $ADMIN_TOKEN\""
fi
echo ""
