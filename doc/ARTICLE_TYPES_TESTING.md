# Article Types and Categories Feature - Testing Guide

## Overview
This guide helps you test the new article types and categories feature that has been implemented.

## Changes Summary

### 1. Article Types
Articles now have three distinct types:
- **Personal (Προσωπικό)**: Only visible to the creator (default)
- **Articles (Άρθρα)**: Educational articles visible publicly
- **News (Νέα)**: News articles visible publicly

### 2. Categories by Type

#### News Categories (14 total):
- Κόσμος
- Ελλάδα
- Οικονομία
- Τεχνολογία
- Πολιτική - Παραπολιτικά
- Lifestyle - Πολιτισμός
- Auto-moto
- Sports
- Υγεία - Sexuality
- Ταξίδια
- Απόψεις
- Περιβάλλον - Σεισμοί
- Μάρκετ
- Στον κόσμο τους - Αστεία

#### Articles/Educational Categories (7 total):
- Γενικά
- Λογική
- Μαθηματικά
- Συνταγές
- Κρατικά
- Οικονομία
- Πολιτική

#### Personal Type:
- No categories required (can be added later if needed)

## Database Migration

If you have an existing database with articles, run the migration script:

```bash
npm run migrate:article-types
```

This will:
- Set existing articles' type based on their `isNews` field
- Keep the `isNews` field for backward compatibility

Before running the script, ensure you have applied the Sequelize migration for the `type` field in your environment.

## Testing Instructions

### 1. Test Creating Articles

#### Create a Personal Article:
1. Log in to the application
2. Navigate to `/editor`
3. Click "Show Form" to create a new article
4. Select **"Προσωπικό (Personal)"** as the article type
5. Notice that the Category field shows "Δεν απαιτείται" (Not required)
6. Fill in title and content
7. Click "Create Article"
8. Verify the article is created with a gray badge showing "Προσωπικό"

#### Create an Educational Article:
1. In the editor form, select **"Άρθρα (Articles)"** as the article type
2. Notice the Category dropdown now shows 7 educational categories
3. Select a category (e.g., "Μαθηματικά")
4. Fill in title and content
5. Click "Create Article"
6. Verify the article is created with a purple "Άρθρα" badge and the selected category

#### Create a News Article:
1. In the editor form, select **"Νέα (News)"** as the article type
2. Notice the Category dropdown now shows 14 news categories
3. Select a category (e.g., "Τεχνολογία")
4. Fill in title and content
5. Click "Create Article"
6. Verify the article is created with a green "Νέα" badge and the selected category

### 2. Test Editing Articles

1. Navigate to any article detail page
2. Click "Edit Article" (if you have permission)
3. Change the article type
4. Notice that the category dropdown updates automatically
5. Select a new category if required
6. Save the changes
7. Verify the article shows the updated type and category

### 3. Test Article Display

#### Article Cards:
- Check the articles list at `/articles`
- Each article should show:
  - Type badge (gray/purple/green based on type)
  - Category badge (if applicable)
  - All badges should be color-coded consistently

#### Article Detail Page:
- Navigate to a specific article
- Verify the type and category badges appear at the top
- Check that the colors match the type

#### Editor Dashboard:
- Go to `/editor`
- Your articles list should show type badges
- Verify the color coding is consistent

### 4. Test Category Requirements

1. Try to create a News article without selecting a category
   - The form should prevent submission (required field)
2. Try to create an Articles article without selecting a category
   - The form should prevent submission (required field)
3. Create a Personal article without a category
   - This should work fine (no category required)

### 5. Test Backward Compatibility

The `isNews` field is kept for backward compatibility:
- Old API calls using `isNews: true` will create News type articles
- Old API calls using `isNews: false` will create Personal type articles
- The new `type` field takes precedence if both are provided

## UI/UX Features

### Dependent Dropdowns:
- The Category dropdown changes based on the selected Article Type
- Categories are disabled for Personal type
- Categories are required for News and Articles types

### Visual Feedback:
- Type badges are color-coded:
  - Gray: Personal
  - Purple: Articles
  - Green: News
- Consistent styling across all pages
- Greek labels with English translations in parentheses

### Form Validation:
- Category is required only when the article type has categories
- Asterisk (*) appears next to "Category" label when required
- Form prevents submission without required category

## API Changes

### Create Article Endpoint: `POST /api/articles`
New field: `type` (optional, defaults to 'personal')
```json
{
  "title": "My Article",
  "content": "Article content...",
  "type": "news",
  "category": "Τεχνολογία",
  "status": "draft"
}
```

### Update Article Endpoint: `PUT /api/articles/:id`
New field: `type` (optional)
```json
{
  "type": "articles",
  "category": "Μαθηματικά"
}
```

### Get Articles Endpoint: `GET /api/articles`
New query parameter: `type` (optional)
```
GET /api/articles?type=news
GET /api/articles?type=articles&category=Μαθηματικά
```

## Configuration

Article types and categories are defined in:
`/config/articleCategories.json`

To add or modify categories:
1. Edit the JSON file
2. Restart the application
3. Categories will be updated automatically

## Files Modified

### Backend:
- `src/models/Article.js` - Added `type` field
- `src/controllers/articleController.js` - Updated to handle type field
- `src/constants/articleTypes.js` - Article type constants
- `config/articleCategories.json` - Categories configuration

### Frontend:
- `app/editor/page.js` - Create form with type/category dropdowns
- `app/articles/[id]/edit/page.js` - Edit form with type/category dropdowns
- `app/articles/[id]/page.js` - Detail page showing type badges
- `components/ArticleCard.js` - Article cards showing type badges
- `lib/utils/articleTypes.js` - Utility functions for type display

### Migration:
- `src/update-article-types.js` - Migration script
- `package.json` - Added migration script command

## Troubleshooting

### Issue: Categories not showing
- Make sure the JSON file is properly formatted
- Check browser console for errors
- Verify the article type is selected

### Issue: Migration fails
- Ensure database connection is configured
- Check that the database is running
- Review migration script output for errors

### Issue: Type badges not displaying
- Clear browser cache
- Rebuild frontend: `npm run frontend:build`
- Check that article.type field exists in database

## Next Steps

Potential future enhancements:
1. Add categories for Personal type
2. Add category management UI for admins
3. Add category filtering on the articles page
4. Add category-based article recommendations
