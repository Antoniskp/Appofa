#!/bin/bash

# News Application Manual Test Script
# This script demonstrates the core functionality of the application
# Authentication uses HttpOnly cookies + CSRF tokens (no Bearer headers).

echo "==================================="
echo "News Application Test Script"
echo "==================================="
echo ""

# Set the base URL
BASE_URL="http://localhost:3000"

# Temporary cookie jar files for admin and editor sessions
ADMIN_COOKIES=$(mktemp /tmp/appofa_admin_cookies_XXXXXX.txt)
EDITOR_COOKIES=$(mktemp /tmp/appofa_editor_cookies_XXXXXX.txt)

cleanup() {
  rm -f "$ADMIN_COOKIES" "$EDITOR_COOKIES"
}
trap cleanup EXIT

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
ADMIN_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }')
echo "$ADMIN_REGISTER_RESPONSE" | json_pp 2>/dev/null || echo "$ADMIN_REGISTER_RESPONSE"
echo ""

echo "Step 3: Registering an Editor user..."
EDITOR_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "editor",
    "email": "editor@example.com",
    "password": "editor123",
    "role": "editor",
    "firstName": "Editor",
    "lastName": "User"
  }')
echo "$EDITOR_REGISTER_RESPONSE" | json_pp 2>/dev/null || echo "$EDITOR_REGISTER_RESPONSE"
echo ""

echo "Step 4: Logging in as Admin (cookies stored in cookie jar)..."
curl -s -c "$ADMIN_COOKIES" -b "$ADMIN_COOKIES" \
  -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' | json_pp 2>/dev/null
# Extract CSRF token from cookie jar (csrf_token is not HttpOnly, so curl saves it)
ADMIN_CSRF=$(grep 'csrf_token' "$ADMIN_COOKIES" | awk '{print $NF}')
if [ -z "$ADMIN_CSRF" ]; then
  echo "WARNING: Admin CSRF token not found - admin login may have failed"
fi
echo ""
echo "Admin CSRF token: $ADMIN_CSRF"
echo ""

echo "Step 4b: Logging in as Editor (cookies stored in cookie jar)..."
curl -s -c "$EDITOR_COOKIES" -b "$EDITOR_COOKIES" \
  -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "editor@example.com",
    "password": "editor123"
  }' | json_pp 2>/dev/null
EDITOR_CSRF=$(grep 'csrf_token' "$EDITOR_COOKIES" | awk '{print $NF}')
if [ -z "$EDITOR_CSRF" ]; then
  echo "WARNING: Editor CSRF token not found - editor login may have failed"
fi
echo ""
echo "Editor CSRF token: $EDITOR_CSRF"
echo ""

echo "Step 5: Getting user profile (authenticated via cookie)..."
curl -s -b "$ADMIN_COOKIES" \
  -X GET "$BASE_URL/api/auth/profile" | json_pp 2>/dev/null || \
curl -s -b "$ADMIN_COOKIES" \
  -X GET "$BASE_URL/api/auth/profile"
echo ""
echo ""

echo "Step 6: Creating a news article (as Admin, with CSRF token)..."
ARTICLE_RESPONSE=$(curl -s -c "$ADMIN_COOKIES" -b "$ADMIN_COOKIES" \
  -X POST "$BASE_URL/api/articles" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $ADMIN_CSRF" \
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
if [ -n "$ARTICLE_ID" ]; then
  curl -s -X GET "$BASE_URL/api/articles/$ARTICLE_ID" | json_pp 2>/dev/null || \
  curl -s -X GET "$BASE_URL/api/articles/$ARTICLE_ID"
else
  curl -s -X GET "$BASE_URL/api/articles/1" | json_pp 2>/dev/null || \
  curl -s -X GET "$BASE_URL/api/articles/1"
fi
echo ""
echo ""

echo "Step 9: Updating article (as Editor, with CSRF token)..."
if [ -n "$ARTICLE_ID" ] && [ -n "$EDITOR_CSRF" ]; then
  curl -s -c "$EDITOR_COOKIES" -b "$EDITOR_COOKIES" \
    -X PUT "$BASE_URL/api/articles/$ARTICLE_ID" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $EDITOR_CSRF" \
    -d '{
      "title": "Updated: Major Technology Breakthrough Confirmed",
      "content": "Following the initial announcement, the technological breakthrough has been confirmed by independent researchers."
    }' | json_pp 2>/dev/null || \
  curl -s -c "$EDITOR_COOKIES" -b "$EDITOR_COOKIES" \
    -X PUT "$BASE_URL/api/articles/$ARTICLE_ID" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $EDITOR_CSRF" \
    -d '{
      "title": "Updated: Major Technology Breakthrough Confirmed",
      "content": "Following the initial announcement, the technological breakthrough has been confirmed by independent researchers."
    }'
else
  echo "Skipping - missing article ID or editor CSRF token"
fi
echo ""
echo ""

echo "==================================="
echo "Test Script Complete!"
echo "==================================="
echo ""
echo "Summary:"
echo "- Admin user registered"
echo "- Editor user registered"
echo "- Admin and Editor login tested (cookie-based auth)"
echo "- Profile retrieval tested (cookie auth)"
echo "- Article creation tested (cookie auth + CSRF)"
echo "- Article listing tested (public)"
echo "- Article retrieval tested (public)"
echo "- Article update tested (cookie auth + CSRF, role-based)"
echo ""
echo "To delete the test article, run:"
if [ -n "$ARTICLE_ID" ] && [ -n "$ADMIN_CSRF" ]; then
  echo "curl -b $ADMIN_COOKIES -X DELETE $BASE_URL/api/articles/$ARTICLE_ID -H \"X-CSRF-Token: $ADMIN_CSRF\""
fi
echo ""
