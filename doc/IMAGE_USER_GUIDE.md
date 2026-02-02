# Image Management User Guide

This guide explains how to use the image management features in the news application to upload, organize, and use images with your articles.

## Table of Contents
- [Overview](#overview)
- [Uploading Images](#uploading-images)
- [Adding External Images](#adding-external-images)
- [Managing Your Images](#managing-your-images)
- [Using Images with Articles](#using-images-with-articles)
- [Organizing with Tags](#organizing-with-tags)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The image management system allows you to:
- Upload images from your computer
- Add images from external URLs
- Organize images with tags
- Search through your image library
- Use images as intro images for articles
- Edit image titles and tags
- Delete unwanted images

### What Happens When You Upload an Image?

The system automatically:
1. **Validates** your image (must be JPEG, PNG, GIF, or WebP)
2. **Checks size** (maximum 10MB)
3. **Resizes** if larger than 1920px (maintaining aspect ratio)
4. **Compresses** to optimize file size and loading speed
5. **Creates a thumbnail** (300x300px) for previews
6. **Stores** the image securely on the server

## Uploading Images

### Requirements
- **File types**: JPEG (.jpg, .jpeg), PNG (.png), GIF (.gif), WebP (.webp)
- **Maximum size**: 10 MB per file
- **Recommended**: Images at least 800px wide for best quality

### How to Upload

1. **Prepare your image**
   - Choose a high-quality image
   - Ensure it's in a supported format
   - Keep file size under 10MB

2. **Upload via API** (see [IMAGE_API.md](IMAGE_API.md) for details)

### What Gets Stored

For each uploaded image, the system stores:
- The processed image file
- A 300x300px thumbnail
- Metadata (title, tags, dimensions, file size)
- Original filename
- Upload date and owner information

## Adding External Images

You can also add images from external websites without uploading them.

### Requirements
- A valid, publicly accessible image URL
- The URL must start with `http://` or `https://`

### Benefits of External Images
- No storage space used on the server
- Useful for referencing images from other websites
- Faster to add (no upload time)

### Limitations
- If the external source removes the image, it will break
- No automatic resizing or optimization
- Must be publicly accessible (no authentication required)

### How to Add External Images

Use the external image endpoint (see [IMAGE_API.md](IMAGE_API.md)):
```bash
POST /api/images/external
{
  "url": "https://example.com/image.jpg",
  "title": "My External Image",
  "tags": ["reference", "external"]
}
```

## Managing Your Images

### Viewing Your Images

Retrieve all your images with pagination:
```bash
GET /api/images/my-images?page=1&limit=20
```

This returns:
- List of your images
- Pagination information (total count, pages)
- Image metadata (title, URL, tags, upload date)

### Updating Image Information

You can update the title and tags of any image you own:

```bash
PUT /api/images/:id
{
  "title": "New Title",
  "tags": ["new-tag", "updated"]
}
```

**Note:** You cannot change:
- The actual image file (must delete and re-upload)
- The image URL
- The owner
- Upload date

### Deleting Images

To delete an image:
```bash
DELETE /api/images/:id
```

**Important:**
- Only image owners can delete their images
- Deletion is permanent and cannot be undone
- The physical file and thumbnail are removed from the server
- If an article uses this image, the association will be broken

**Before deleting:**
- Check if the image is used in any articles
- Consider if you might need it again in the future
- Make sure you have a backup if the image is important

## Using Images with Articles

### Setting an Intro Image

When creating or editing an article, specify the `introImageId`:

**Creating an article with an intro image:**
```bash
POST /api/articles
{
  "title": "My Article",
  "content": "Article content...",
  "introImageId": 123
}
```

**Adding an intro image to an existing article:**
```bash
PUT /api/articles/:id
{
  "introImageId": 123
}
```

**Removing an intro image:**
```bash
PUT /api/articles/:id
{
  "introImageId": null
}
```

### Permissions

- **Your own images**: You can always use your own images
- **Other users' images**: Only admin, editor, and moderator roles can use images they don't own
- **External images**: Same permission rules apply

### How Intro Images Are Displayed

When you fetch an article, the intro image is included:
```json
{
  "article": {
    "id": 1,
    "title": "My Article",
    "introImageId": 123,
    "introImage": {
      "id": 123,
      "url": "/uploads/images/photo-123.jpg",
      "title": "Article Photo",
      "width": 1920,
      "height": 1080
    }
  }
}
```

Use this data to display the image in your frontend.

## Organizing with Tags

Tags help you organize and find images quickly.

### Tagging Best Practices

1. **Be Consistent**
   - Use lowercase tags: "landscape" not "Landscape"
   - Use single words or hyphens: "sunset", "blue-sky"

2. **Be Descriptive**
   - Include subject: "portrait", "building", "food"
   - Include style: "minimal", "vibrant", "black-and-white"
   - Include use case: "banner", "thumbnail", "background"

3. **Be Specific**
   - "mountain-sunset" is better than just "nature"
   - "product-shoes" is better than just "product"

4. **Use Multiple Tags**
   - Each image can have many tags
   - Example: ["landscape", "mountain", "sunset", "nature", "autumn"]

### Searching by Tags

Find images with a specific tag:
```bash
GET /api/images/search?tag=landscape&page=1&limit=20
```

Or filter your images:
```bash
GET /api/images/my-images?tag=landscape
```

### Example Tagging Strategy

**Photo categories:**
- Subject: "person", "building", "nature", "food"
- Color: "blue", "red", "monochrome"
- Orientation: "portrait", "landscape", "square"
- Quality: "high-res", "stock", "photo"

**Usage:**
- "article-header"
- "thumbnail"
- "background"
- "inline-content"

**Topics:**
- "technology"
- "business"
- "sports"
- "politics"

## Best Practices

### For Uploads

1. **Optimize Before Upload**
   - While the system resizes large images, uploading pre-optimized images is faster
   - Aim for 1920px or less for the longest dimension

2. **Use Descriptive Filenames**
   - The original filename is stored and can help you remember the image
   - Use names like "beach-sunset-2024.jpg" instead of "IMG_1234.jpg"

3. **Check Quality**
   - Review images before uploading
   - Ensure they're clear, well-lit, and appropriate

### For Organization

1. **Tag Immediately**
   - Add tags when you upload/add an image
   - It's easier than going back later

2. **Use Meaningful Titles**
   - Titles help when browsing your image library
   - Include context: "Beach sunset for travel article"

3. **Regular Cleanup**
   - Periodically review and delete unused images
   - Keeps your library organized and saves storage

4. **Reuse Images**
   - Search your library before uploading new images
   - Avoid duplicates

### For Articles

1. **Choose Appropriate Images**
   - Intro images should relate to the article content
   - Use high-quality, professional images

2. **Consider Dimensions**
   - Images should work at different sizes
   - Avoid images with important details in corners (may be cropped)

3. **Test Display**
   - Check how the image looks with your article
   - Ensure text is readable if overlaid

## Troubleshooting

### Upload Issues

**"Invalid file type" error**
- Solution: Only JPEG, PNG, GIF, and WebP are supported
- Check the file extension matches the actual file type

**"File too large" error**
- Solution: Image must be under 10MB
- Compress or resize the image before uploading

**"No file uploaded" error**
- Solution: Ensure you're sending the file in the correct format
- Check that the field name is "image" in the form data

### External Image Issues

**"Invalid URL format" error**
- Solution: URL must be complete with http:// or https://
- Example: "https://example.com/image.jpg"

**External image not displaying**
- Check if the URL is still valid
- Ensure the image is publicly accessible
- Try opening the URL in a browser

### Permission Issues

**"You do not have permission to use this image"**
- Solution: You can only use your own images
- Admins, editors, and moderators can use any image
- Request permission or upload your own image

**"Access denied" when viewing/editing image**
- Solution: You can only manage your own images
- Contact the image owner or an administrator

### Search and Filter Issues

**No results when searching**
- Check spelling of the tag
- Tags are case-sensitive in some databases
- Try browsing all images to verify the tag exists

**Wrong images in search results**
- Tags must match exactly
- Use the search endpoint, not a general filter

## Rate Limits

To prevent abuse, there are rate limits:
- **Upload/Add**: 20 requests per 15 minutes
- **View/Search**: 100 requests per 15 minutes

If you hit a rate limit:
- Wait 15 minutes before trying again
- For bulk operations, space out your requests
- Contact an administrator if you need higher limits

## Security and Privacy

### Your Images Are Private
- Only you can see your images (unless shared via article)
- Admins, editors, and moderators can view all images for moderation
- Images used in published articles become visible to article viewers

### Safe Practices
- Don't upload copyrighted images without permission
- Don't upload personal or sensitive information
- Use appropriate content only
- Follow the application's content policies

### Storage
- Images are stored securely on the server
- Uploaded images are automatically optimized
- Database stores only metadata and file paths
- Regular backups protect against data loss

## Getting Help

If you encounter issues:
1. Check this guide for solutions
2. Review the [API Documentation](IMAGE_API.md)
3. Contact a system administrator
4. Report bugs through the proper channels

## Advanced Usage

### Bulk Operations
For uploading multiple images, make separate API calls for each image. Space out requests to avoid rate limits.

### Integration with Content
While intro images are automatically associated with articles, you can also:
- Reference image URLs in article content
- Create galleries by linking multiple articles
- Use tags to create themed collections

### Workflow Suggestions

**For Content Creators:**
1. Upload/add images first
2. Tag and title appropriately
3. Create your article
4. Select intro image from your library
5. Publish

**For Regular Contributors:**
1. Build an image library over time
2. Tag consistently
3. Reuse images across articles
4. Clean up unused images monthly

---

*This guide covers the core image management features. For technical details and API specifications, see [IMAGE_API.md](IMAGE_API.md).*
