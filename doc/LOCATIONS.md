# Hierarchical Locations Feature

## Overview

The hierarchical locations system provides a structured way to organize and link geographic locations to articles, users, and other entities in the application. The system supports four hierarchical levels: International → Country → Prefecture/State → Municipality/City.

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [User Guide](#user-guide)
4. [Admin Guide](#admin-guide)
5. [Developer Guide](#developer-guide)
6. [Data Sources](#data-sources)

## Database Schema

### Locations Table

The `Locations` table stores hierarchical location data with the following structure:

| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key, auto-increment |
| name | STRING | Official location name (required) |
| name_local | STRING | Local language name (optional) |
| type | ENUM | Location type: international, country, prefecture, municipality |
| parent_id | INTEGER | Foreign key to parent location (nullable) |
| code | STRING | ISO code or official identifier (e.g., "JP", "US-CA") |
| slug | STRING | URL-friendly unique identifier |
| lat | DECIMAL(10,8) | Latitude coordinate |
| lng | DECIMAL(11,8) | Longitude coordinate |
| bounding_box | JSON | Optional bounding box: {north, south, east, west} |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- Unique index on `(type, name, parent_id)` for deduplication
- Unique index on `slug`
- Index on `parent_id` for hierarchical queries
- Index on `type` for filtering
- Index on `code` for lookups

### Location Links Table

The `LocationLinks` table enables polymorphic associations between locations and other entities:

| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key, auto-increment |
| location_id | INTEGER | Foreign key to Locations table |
| entity_type | ENUM | Type of linked entity: article, user |
| entity_id | INTEGER | ID of the linked entity |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- Unique index on `(location_id, entity_type, entity_id)` to prevent duplicates
- Index on `(entity_type, entity_id)` for entity lookups
- Index on `location_id` for location lookups

### User Model Extension

The `Users` table has been extended with:

| Field | Type | Description |
|-------|------|-------------|
| home_location_id | INTEGER | Foreign key to Locations table (nullable) |

## API Endpoints

### Public Endpoints

#### GET /api/locations

List all locations with optional filtering.

**Query Parameters:**
- `type` - Filter by location type (international, country, prefecture, municipality)
- `parent_id` - Filter by parent location ID
- `search` - Search locations by name, local name, or code
- `limit` - Maximum results per page (default: 100, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Japan",
      "name_local": "日本",
      "type": "country",
      "parent_id": null,
      "code": "JP",
      "slug": "japan",
      "lat": "36.20480000",
      "lng": "138.25290000",
      "bounding_box": null,
      "parent": {
        "id": 1,
        "name": "World",
        "type": "international"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 100,
    "offset": 0
  }
}
```

#### GET /api/locations/:id

Get a specific location with details, children, and linked entities.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Tokyo",
    "name_local": "東京都",
    "type": "prefecture",
    "parent_id": 1,
    "parent": {
      "id": 1,
      "name": "Japan",
      "type": "country",
      "slug": "japan"
    },
    "children": [
      {
        "id": 3,
        "name": "Shibuya",
        "type": "municipality",
        "slug": "shibuya"
      }
    ],
    "linkedArticles": [
      {
        "id": 10,
        "title": "Article about Tokyo",
        "summary": "...",
        "author": {
          "id": 1,
          "username": "john"
        }
      }
    ],
    "linkedUsers": [
      {
        "id": 5,
        "username": "tokyoresident",
        "firstName": "John",
        "lastName": "Doe"
      }
    ]
  }
}
```

#### GET /api/locations/:id/children

Get child locations of a specific location.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Shibuya",
      "name_local": "渋谷区",
      "type": "municipality",
      "parent_id": 2,
      "slug": "shibuya"
    }
  ]
}
```

### Protected Endpoints (Admin/Moderator)

#### POST /api/locations

Create a new location.

**Headers:**
- `x-csrf-token`: CSRF token (required)
- `Cookie`: auth_token (required)

**Request Body:**
```json
{
  "name": "Kyoto",
  "name_local": "京都府",
  "type": "prefecture",
  "parent_id": 1,
  "code": "JP-26",
  "slug": "kyoto",
  "lat": 35.0116,
  "lng": 135.7681
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location created successfully",
  "data": {
    "id": 4,
    "name": "Kyoto",
    ...
  }
}
```

#### PUT /api/locations/:id

Update an existing location.

**Headers:** Same as POST

**Request Body:** Same as POST (all fields optional)

#### DELETE /api/locations/:id

Delete a location (only if it has no children).

**Headers:**
- `x-csrf-token`: CSRF token (required)
- `Cookie`: auth_token (required)

**Response:**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

### Location Linking Endpoints (Authenticated Users)

#### POST /api/locations/links

Link an entity (article or user) to a location.

**Request Body:**
```json
{
  "location_id": 3,
  "entity_type": "article",
  "entity_id": 10
}
```

#### DELETE /api/locations/links

Unlink an entity from a location.

**Request Body:** Same as POST

### User Profile Endpoints

#### PUT /api/auth/profile

Update user profile including home location.

**Request Body:**
```json
{
  "username": "newusername",
  "home_location_id": 3
}
```

To remove home location, set `home_location_id` to `null`.

## User Guide

### Adding a Location to Your Article

1. Navigate to create or edit an article
2. Scroll to the "Location" section
3. Use the hierarchical dropdown to select a location:
   - Start with International/Country
   - Select more specific levels as needed (Prefecture, Municipality)
4. You can select any level of specificity
5. Click "Save" to associate the location with your article

### Setting Your Home Location

1. Go to your Profile page
2. Find the "Home Location" section
3. Use the location selector to choose your home location
4. Click "Update Profile" to save
5. To remove your home location, click "Clear selection" before saving

### Removing a Location

- For articles: Edit the article and clear the location selection
- For your profile: Edit your profile and click "Clear selection" in the location field

## Admin Guide

### Managing Locations

Admins and moderators can manage the location database through the Location Management page at `/admin/locations`.

#### Adding a New Location

1. Navigate to `/admin/locations`
2. Click "Add New Location"
3. Fill in the required fields:
   - **Name**: Official location name (required)
   - **Local Name**: Name in local language (optional)
   - **Type**: Select hierarchy level (required)
   - **Parent Location ID**: ID of parent location (leave empty for top-level)
   - **Code**: ISO or official code (e.g., "US-CA")
   - **Slug**: URL-friendly identifier (required, must be unique)
   - **Latitude/Longitude**: Geographic coordinates (optional)
4. Click "Create Location"

#### Editing a Location

1. Find the location in the table
2. Click "Edit"
3. Modify the fields as needed
4. Click "Update Location"

#### Deleting a Location

1. Find the location in the table
2. Click "Delete"
3. Confirm the deletion
4. **Note**: Locations with children cannot be deleted. Delete children first.

#### Best Practices

- Use official names from ISO, GADM, or GeoNames databases
- Always provide geographic coordinates when available
- Use consistent slug formatting (lowercase, hyphens)
- Verify parent-child relationships before creating
- Check for duplicates before creating new locations

## Developer Guide

### Using LocationSelector Component

```jsx
import LocationSelector from '@/components/LocationSelector';

function MyForm() {
  const [locationId, setLocationId] = useState(null);
  
  return (
    <LocationSelector
      value={locationId}
      onChange={setLocationId}
      label="Select Location"
      required={false}
      allowedTypes={['international', 'country', 'prefecture', 'municipality']}
    />
  );
}
```

### Querying Locations in Backend

```javascript
const { Location } = require('./models');

// Get location with parent and children
const location = await Location.findByPk(id, {
  include: [
    { model: Location, as: 'parent' },
    { model: Location, as: 'children' }
  ]
});

// Get all countries
const countries = await Location.findAll({
  where: { type: 'country' },
  order: [['name', 'ASC']]
});

// Search locations
const results = await Location.findAll({
  where: {
    [Op.or]: [
      { name: { [Op.like]: `%${search}%` } },
      { name_local: { [Op.like]: `%${search}%` } }
    ]
  }
});
```

### Creating Location Links

```javascript
const { LocationLink } = require('./models');

// Link article to location
await LocationLink.create({
  location_id: 5,
  entity_type: 'article',
  entity_id: 123
});

// Get all articles for a location
const links = await LocationLink.findAll({
  where: {
    location_id: 5,
    entity_type: 'article'
  }
});
```

## Data Sources

The location data should be sourced from official, authoritative databases:

### Recommended Sources

1. **ISO 3166** - Country codes
   - ISO 3166-1 alpha-2: Two-letter country codes (e.g., "JP", "US", "GR")
   - ISO 3166-2: Subdivision codes (e.g., "US-CA", "JP-13")
   - Website: https://www.iso.org/iso-3166-country-codes.html

2. **GeoNames** - Geographic database
   - Free geographic database covering all countries
   - Includes names, coordinates, and administrative divisions
   - Website: https://www.geonames.org/
   - Download: https://download.geonames.org/export/dump/

3. **GADM** - Database of Global Administrative Areas
   - High-quality administrative boundary data
   - Available for download in various formats
   - Website: https://gadm.org/

4. **Natural Earth** - Public domain map dataset
   - Cultural and physical features
   - Available at multiple scales
   - Website: https://www.naturalearthdata.com/

### Seeding the Database

To populate the database with initial location data:

```bash
npm run seed:locations
# or
node src/seed-locations.js
```

The seed script includes:
- World (international level)
- Sample countries: Japan, United States, Greece
- Sample prefectures/states: Tokyo, Osaka, California, New York, Attica
- Sample municipalities: Shibuya, Shinjuku, San Francisco, Athens, etc.

### Adding Custom Locations

You can extend the seed script or use the admin interface to add more locations. When adding locations:

1. Verify the official name from authoritative sources
2. Include local language names when applicable
3. Use ISO codes where available
4. Provide accurate coordinates
5. Maintain proper hierarchical relationships

## Future Enhancements

Potential future additions to the location system:

1. **Polygon/GeoJSON Support** - Store detailed geographic boundaries
2. **Map Visualization** - Display locations and articles on interactive maps
3. **Location Autocomplete** - Type-ahead search for faster selection
4. **Timezone Information** - Store timezone data for each location
5. **Population Data** - Include demographic information
6. **Alternative Names** - Support multiple language names
7. **Historical Locations** - Track location name changes over time
8. **Postal Codes** - Link postal/ZIP codes to municipalities
9. **Location Verification** - Admin approval workflow for user-submitted locations
10. **Nearby Locations** - Find locations within a geographic radius

## Support

For questions or issues related to the locations feature:

1. Check this documentation
2. Review the API endpoint responses for error messages
3. Contact system administrators for database-level issues
4. Refer to the codebase comments for implementation details

---

**Last Updated:** February 2026  
**Version:** 1.0.0
