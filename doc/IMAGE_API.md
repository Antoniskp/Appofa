# Image Management API Documentation

This document describes the Image Management endpoints for the news application. These endpoints allow users to upload, manage, and associate images with articles.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Upload Image](#upload-image)
  - [Add External Image](#add-external-image)
  - [Get My Images](#get-my-images)
  - [Get Image by ID](#get-image-by-id)
  - [Update Image](#update-image)
  - [Delete Image](#delete-image)
  - [Search Images by Tag](#search-images-by-tag)
- [Using Images with Articles](#using-images-with-articles)

## Overview

The Image Management system provides functionality to:
- Upload and store images with automatic validation, resizing, and compression
- Add images from external URLs
- Tag images for easy searching and categorization
- Manage image metadata (title, tags)
- Associate images with articles as intro images
- Delete images and their associated files

### Image Processing
When an image is uploaded:
1. **Validation**: Only JPEG, PNG, GIF, and WebP formats are accepted
2. **Size limit**: Maximum 10MB file size
3. **Resizing**: Images larger than 1920px are automatically resized while maintaining aspect ratio
4. **Compression**: All images are compressed with 85% JPEG quality
5. **Thumbnails**: A 300x300px thumbnail is automatically generated
6. **Storage**: Images are stored in `/public/uploads/images/`

### Image Metadata
Each image record includes:
- `id`: Unique identifier
- `title`: Optional title
- `url`: Public URL to access the image
- `filename`: Server filename
- `originalName`: Original uploaded filename
- `mimeType`: MIME type of the image
- `size`: File size in bytes
- `width`: Image width in pixels
- `height`: Image height in pixels
- `tags`: Array of free-text tags
- `ownerId`: ID of the user who owns the image
- `isExternal`: Boolean indicating if image is from external URL
- `createdAt`: Timestamp when image was added
- `updatedAt`: Timestamp when image was last updated

## Authentication

All image endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### Upload Image

Upload a new image file with automatic processing.

**Endpoint:** `POST /api/images/upload`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**
```
image: [file]          (required) - Image file to upload
title: string          (optional) - Title for the image
tags: JSON array       (optional) - Array of tags as JSON string, e.g., ["nature", "landscape"]
```

**Example Request (curl):**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "title=Beautiful Landscape" \
  -F "tags=[\"nature\",\"landscape\"]"
```

**Example Request (JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('title', 'Beautiful Landscape');
formData.append('tags', JSON.stringify(['nature', 'landscape']));

const response = await fetch('http://localhost:3000/api/images/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Image uploaded successfully.",
  "data": {
    "image": {
      "id": 1,
      "title": "Beautiful Landscape",
      "url": "/uploads/images/landscape-1234567890.jpg",
      "filename": "landscape-1234567890.jpg",
      "originalName": "image.jpg",
      "mimeType": "image/jpeg",
      "size": 245678,
      "width": 1920,
      "height": 1080,
      "tags": ["nature", "landscape"],
      "ownerId": 5,
      "isExternal": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "owner": {
        "id": 5,
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "thumbnailUrl": "/uploads/images/thumbnails/thumb_landscape-1234567890.jpg"
  }
}
```

**Error Responses:**
- **400 Bad Request**: No file uploaded or invalid file type
- **401 Unauthorized**: Missing or invalid authentication token
- **500 Internal Server Error**: Server error during upload

---

### Add External Image

Add an image from an external URL without uploading a file.

**Endpoint:** `POST /api/images/external`

**Authentication:** Required

**Request Body:**
```json
{
  "url": "https://example.com/image.jpg",
  "title": "External Image Title",
  "tags": ["tag1", "tag2"]
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/images/external \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/image.jpg",
    "title": "Beautiful Photo",
    "tags": ["nature", "travel"]
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "External image added successfully.",
  "data": {
    "image": {
      "id": 2,
      "title": "Beautiful Photo",
      "url": "https://example.com/image.jpg",
      "tags": ["nature", "travel"],
      "ownerId": 5,
      "isExternal": true,
      "createdAt": "2024-01-15T10:35:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z",
      "owner": {
        "id": 5,
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Missing URL or invalid URL format
- **401 Unauthorized**: Missing or invalid authentication token

---

### Get My Images

Retrieve all images owned by the authenticated user with pagination and optional tag filtering.

**Endpoint:** `GET /api/images/my-images`

**Authentication:** Required

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Number of results per page
- `tag` (optional): Filter images by specific tag

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/images/my-images?page=1&limit=10&tag=nature" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": 1,
        "title": "Beautiful Landscape",
        "url": "/uploads/images/landscape-1234567890.jpg",
        "tags": ["nature", "landscape"],
        "ownerId": 5,
        "isExternal": false,
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": 2,
        "title": "Beautiful Photo",
        "url": "https://example.com/image.jpg",
        "tags": ["nature", "travel"],
        "ownerId": 5,
        "isExternal": true,
        "createdAt": "2024-01-15T10:35:00.000Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### Get Image by ID

Retrieve details of a specific image.

**Endpoint:** `GET /api/images/:id`

**Authentication:** Required

**Permissions:** Owner, admin, editor, or moderator

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/images/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "image": {
      "id": 1,
      "title": "Beautiful Landscape",
      "url": "/uploads/images/landscape-1234567890.jpg",
      "filename": "landscape-1234567890.jpg",
      "originalName": "image.jpg",
      "mimeType": "image/jpeg",
      "size": 245678,
      "width": 1920,
      "height": 1080,
      "tags": ["nature", "landscape"],
      "ownerId": 5,
      "isExternal": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "owner": {
        "id": 5,
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
}
```

**Error Responses:**
- **404 Not Found**: Image not found
- **403 Forbidden**: User does not have permission to view this image

---

### Update Image

Update image metadata (title and/or tags). Only the owner can update an image.

**Endpoint:** `PUT /api/images/:id`

**Authentication:** Required

**Permissions:** Owner only

**Request Body:**
```json
{
  "title": "Updated Title",
  "tags": ["new-tag", "updated"]
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/images/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Landscape",
    "tags": ["nature", "mountain", "scenic"]
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Image updated successfully.",
  "data": {
    "image": {
      "id": 1,
      "title": "Updated Landscape",
      "url": "/uploads/images/landscape-1234567890.jpg",
      "tags": ["nature", "mountain", "scenic"],
      "ownerId": 5,
      "isExternal": false,
      "updatedAt": "2024-01-15T11:00:00.000Z",
      "owner": {
        "id": 5,
        "username": "johndoe"
      }
    }
  }
}
```

**Error Responses:**
- **404 Not Found**: Image not found
- **403 Forbidden**: User is not the owner of the image

---

### Delete Image

Delete an image and its associated files. Only the owner can delete an image.

**Endpoint:** `DELETE /api/images/:id`

**Authentication:** Required

**Permissions:** Owner only

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/images/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Image deleted successfully."
}
```

**Error Responses:**
- **404 Not Found**: Image not found
- **403 Forbidden**: User is not the owner of the image

**Note:** Deleting an image will also remove the physical file and thumbnail from the server (for uploaded images). External images will only remove the database record.

---

### Search Images by Tag

Search for images by a specific tag. Returns only images owned by the authenticated user.

**Endpoint:** `GET /api/images/search`

**Authentication:** Required

**Query Parameters:**
- `tag` (required): Tag to search for
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Number of results per page

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/images/search?tag=nature&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": 1,
        "title": "Beautiful Landscape",
        "url": "/uploads/images/landscape-1234567890.jpg",
        "tags": ["nature", "mountain", "scenic"],
        "ownerId": 5,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Missing tag parameter

---

## Using Images with Articles

Images can be associated with articles as intro images. The intro image is displayed with the article in listings and detail views.

### Create Article with Intro Image

When creating an article, include the `introImageId` field:

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Article",
    "content": "Article content here...",
    "summary": "Article summary",
    "introImageId": 1
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Article created successfully.",
  "data": {
    "article": {
      "id": 10,
      "title": "My Article",
      "content": "Article content here...",
      "introImageId": 1,
      "introImage": {
        "id": 1,
        "url": "/uploads/images/landscape-1234567890.jpg",
        "title": "Beautiful Landscape",
        "width": 1920,
        "height": 1080
      }
    }
  }
}
```

### Update Article to Add/Change Intro Image

```bash
curl -X PUT http://localhost:3000/api/articles/10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "introImageId": 2
  }'
```

### Remove Intro Image from Article

Set `introImageId` to `null`:

```bash
curl -X PUT http://localhost:3000/api/articles/10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "introImageId": null
  }'
```

### Permissions

- Users can only use their own images with articles
- Admin, editor, and moderator roles can use any image
- When fetching articles, the intro image data is automatically included in the response

---

## Best Practices

1. **Image Size**: Upload reasonably sized images. The system will resize large images, but smaller uploads are faster.

2. **Tagging**: Use consistent, descriptive tags to make images easy to find later. Examples: "landscape", "portrait", "product", "banner".

3. **Image Naming**: Use meaningful titles for images to help organize your media library.

4. **External Images**: When using external images, ensure the URL is reliable and the image is publicly accessible.

5. **Image Reuse**: Search your existing images by tag before uploading new ones to avoid duplicates.

6. **File Formats**: Use JPEG for photos, PNG for graphics with transparency, and WebP for modern web optimization.

7. **Cleanup**: Delete unused images to keep your media library organized and save storage space.

## Rate Limits

Image upload endpoints are subject to rate limiting:
- Upload: 20 requests per 15 minutes
- Add external image: 20 requests per 15 minutes
- Other image operations: 100 requests per 15 minutes

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": "Detailed error information (in development mode)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error
