# API Testing Examples

This file contains example requests for testing the News Application API.

## Prerequisites
- Server should be running on http://localhost:3000
- PostgreSQL database should be set up and running

## Authentication Examples

### 1. Register a new user (Admin)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### 2. Register a new user (Editor)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "editor",
    "email": "editor@example.com",
    "password": "editor123",
    "role": "editor",
    "firstName": "Editor",
    "lastName": "User"
  }'
```

### 3. Register a new user (Viewer)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "viewer",
    "email": "viewer@example.com",
    "password": "viewer123",
    "role": "viewer",
    "firstName": "Viewer",
    "lastName": "User"
  }'
```

### 4. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Save the token from the response for subsequent requests.

### 5. Get User Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Article Examples

### 6. Create an Article (Authenticated)
```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
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
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Updated Breaking News Title",
    "content": "Updated content goes here...",
    "status": "published"
  }'
```

### 11. Delete Article (Authenticated - Admin or Author only)
```bash
curl -X DELETE http://localhost:3000/api/articles/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing Workflow

1. Start the server: `npm run dev`
2. Register users with different roles (admin, editor, viewer)
3. Login with each user and save their tokens
4. Test article creation with authenticated users
5. Test article retrieval (public and authenticated)
6. Test article updates with different roles
7. Test article deletion with different roles
8. Verify role-based access control

## Expected Behaviors

- **Viewer**: Can create articles and view published articles
- **Editor**: Can create articles, edit all articles, view all articles
- **Admin**: Full access to all operations including deletion
- **Public**: Can only view published articles

## Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
