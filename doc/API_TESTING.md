# API Testing Examples

This file contains example requests for testing the News Application API.

## Prerequisites
- Server should be running on http://localhost:3000
- PostgreSQL database should be set up and running

## Authentication Examples

### 1. Register a new user (Viewer)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "viewer",
    "email": "viewer@example.com",
    "password": "viewer123",
    "firstName": "Viewer",
    "lastName": "User"
  }'
```

### 2. Register a new user (Editor Request)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "editorcandidate",
    "email": "editorcandidate@example.com",
    "password": "editor123",
    "firstName": "Editor",
    "lastName": "User"
  }'
```

### 3. Register a new user (Moderator Request)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "moderatorcandidate",
    "email": "moderatorcandidate@example.com",
    "password": "moderator123",
    "firstName": "Moderator",
    "lastName": "User"
  }'
```

### 4. Login
```bash
curl -c /tmp/cookies.txt -b /tmp/cookies.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

The server sets two cookies: `auth_token` (HttpOnly JWT) and `csrf_token` (readable, for CSRF protection).
Use `-c`/`-b` with a cookie jar file to persist them across requests. Extract the CSRF token for mutation requests:

```bash
CSRF_TOKEN=$(grep 'csrf_token' /tmp/cookies.txt | awk '{print $NF}')
```

### 5. Get User Profile
```bash
curl -b /tmp/cookies.txt -X GET http://localhost:3000/api/auth/profile
```

### 6. Admin: Update User Role
```bash
curl -X PUT http://localhost:3000/api/auth/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -b "auth_token=ADMIN_TOKEN_HERE" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "role": "editor"
  }'
```

### 7. Admin: Get User Stats
```bash
curl -X GET http://localhost:3000/api/auth/users/stats \
  -b "auth_token=ADMIN_TOKEN_HERE"
```

### 8. Admin: Get Users
```bash
curl -X GET http://localhost:3000/api/auth/users \
  -b "auth_token=ADMIN_TOKEN_HERE"
```

## Article Examples

### 6. Create an Article (Authenticated)
```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -b "auth_token=YOUR_TOKEN_HERE" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "title": "Breaking News: Technology Breakthrough",
    "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "summary": "A major technological breakthrough has been announced",
    "category": "Technology",
    "status": "published"
  }'
```

### 7. Get All Articles (Public)
```bash
curl -X GET "http://localhost:3000/api/articles?status=published&page=1&limit=10"
```

### 8. Get All Articles with Filter (Public)
```bash
curl -X GET "http://localhost:3000/api/articles?category=Technology&status=published"
```

### 9. Get Single Article (Public)
```bash
curl -X GET http://localhost:3000/api/articles/1
```

### 10. Update Article (Authenticated)
```bash
curl -X PUT http://localhost:3000/api/articles/1 \
  -H "Content-Type: application/json" \
  -b "auth_token=YOUR_TOKEN_HERE" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "title": "Updated Breaking News Title",
    "content": "Updated content goes here...",
    "status": "published"
  }'
```

### 11. Delete Article (Authenticated - Admin or Author only)
```bash
curl -X DELETE http://localhost:3000/api/articles/1 \
  -b "auth_token=YOUR_TOKEN_HERE" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN_HERE"
```

## Testing Workflow

1. Start the server: `npm run dev`
2. Register users (they start as viewers by default)
3. Login with each user and save their auth + CSRF cookies
4. Test article creation with authenticated users
5. Test article retrieval (public and authenticated)
6. Test article updates with different roles
7. Test article deletion with different roles
8. Verify role-based access control

## Expected Behaviors

- **Viewer**: Can create articles and view published articles
- **Editor**: Can create articles, edit all articles, view all articles
- **Moderator**: Can edit and delete all articles, manage locations
- **Admin**: Full access to all operations including deletion and user management
- **Public**: Can only view published articles and locations

## Location API Examples

### 1. List All Locations (Public)
```bash
curl -X GET "http://localhost:3000/api/locations"
```

### 2. List Locations with Filtering (Public)
```bash
# Get all countries
curl -X GET "http://localhost:3000/api/locations?type=country"

# Get all prefectures in Japan (assuming Japan has id 1)
curl -X GET "http://localhost:3000/api/locations?type=prefecture&parent_id=1"

# Search for locations
curl -X GET "http://localhost:3000/api/locations?search=tokyo"

# Paginate results
curl -X GET "http://localhost:3000/api/locations?limit=20&offset=0"
```

### 3. Get Location Details (Public)
```bash
curl -X GET http://localhost:3000/api/locations/1
```

### 4. Create Location (Admin/Moderator Only)
```bash
# Create a country
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -b "auth_token=ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Greece",
    "name_local": "Ελλάδα",
    "type": "country",
    "code": "GR",
    "lat": 39.0742,
    "lng": 21.8243
  }'

# Create a prefecture under a country (parent_id=1)
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -b "auth_token=ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Attica",
    "type": "prefecture",
    "parent_id": 1,
    "lat": 38.0,
    "lng": 23.7
  }'

# Create a municipality under a prefecture (parent_id=2)
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -b "auth_token=ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Athens",
    "type": "municipality",
    "parent_id": 2,
    "lat": 37.9838,
    "lng": 23.7275,
    "bounding_box": {
      "north": 38.1,
      "south": 37.8,
      "east": 23.9,
      "west": 23.5
    }
  }'
```

### 5. Update Location (Admin/Moderator Only)
```bash
curl -X PUT http://localhost:3000/api/locations/1 \
  -H "Content-Type: application/json" \
  -b "auth_token=ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Hellenic Republic",
    "name_local": "Ελληνική Δημοκρατία"
  }'
```

### 6. Delete Location (Admin/Moderator Only)
```bash
# Note: Cannot delete if location has children
curl -X DELETE http://localhost:3000/api/locations/1 \
  -b "auth_token=ADMIN_TOKEN_HERE"
```

### 7. Link Location to Article (Authenticated - Must Own Article or Be Admin/Moderator)
```bash
curl -X POST http://localhost:3000/api/locations/link \
  -H "Content-Type: application/json" \
  -b "auth_token=YOUR_TOKEN_HERE" \
  -d '{
    "location_id": 3,
    "entity_type": "article",
    "entity_id": 1
  }'
```

### 8. Link Location to User (Authenticated - Must Be User or Admin)
```bash
curl -X POST http://localhost:3000/api/locations/link \
  -H "Content-Type: application/json" \
  -b "auth_token=YOUR_TOKEN_HERE" \
  -d '{
    "location_id": 3,
    "entity_type": "user",
    "entity_id": 1
  }'
```

### 9. Unlink Location from Entity (Authenticated)
```bash
curl -X POST http://localhost:3000/api/locations/unlink \
  -H "Content-Type: application/json" \
  -b "auth_token=YOUR_TOKEN_HERE" \
  -d '{
    "location_id": 3,
    "entity_type": "article",
    "entity_id": 1
  }'
```

### 10. Get All Locations Linked to an Article (Public)
```bash
curl -X GET http://localhost:3000/api/locations/article/1/locations
```

### 11. Get All Locations Linked to a User (Public)
```bash
curl -X GET http://localhost:3000/api/locations/user/1/locations
```

### 12. Get All Entities (Articles/Users) Linked to a Location (Public)
```bash
# Get all entities
curl -X GET http://localhost:3000/api/locations/1/entities

# Get only articles
curl -X GET "http://localhost:3000/api/locations/1/entities?entity_type=article"

# Get only users
curl -X GET "http://localhost:3000/api/locations/1/entities?entity_type=user"
```

### 13. Set User Home Location (Authenticated)
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -b "auth_token=YOUR_TOKEN_HERE" \
  -d '{
    "homeLocationId": 3
  }'

# Clear home location
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -b "auth_token=YOUR_TOKEN_HERE" \
  -d '{
    "homeLocationId": null
  }'
```

## Location Testing Workflow

1. **Setup**: Create hierarchical locations (admin/moderator)
   - Create an international region
   - Create a country under it
   - Create a prefecture under the country
   - Create a municipality under the prefecture

2. **Linking**: Associate locations with content
   - Create an article and link it to the municipality
   - Link the article to multiple locations (country, municipality)
   - Set a user's home location

3. **Querying**: Retrieve location data
   - Get location details with children
   - Get all locations of a specific type
   - Get articles linked to a location
   - Get users with a specific home location

4. **Management**: Update and maintain locations (admin/moderator)
   - Update location details
   - Add/remove location coordinates
   - Delete unused locations (without children)

## Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (e.g., location already exists)
- `500 Internal Server Error`: Server error
