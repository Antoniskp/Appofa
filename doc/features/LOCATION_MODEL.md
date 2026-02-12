# Location Model Architecture and Documentation

## Overview

This document describes the hierarchical locations model implementation for the Appofa news application. The system allows articles and users to be associated with locations at various hierarchical levels (international, country, prefecture, municipality).

## Database Schema

### Location Table

The `Location` model represents a hierarchical location system:

```sql
CREATE TABLE "Locations" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,              -- Official name
  name_local VARCHAR(255),                 -- Local language name
  type ENUM('international', 'country', 'prefecture', 'municipality') NOT NULL,
  parent_id INTEGER REFERENCES "Locations"(id) ON DELETE CASCADE,
  code VARCHAR(20),                        -- ISO/official code (e.g., ISO country code)
  slug VARCHAR(255) UNIQUE NOT NULL,       -- URL-friendly identifier
  lat DECIMAL(10,8),                       -- Latitude
  lng DECIMAL(11,8),                       -- Longitude
  bounding_box JSON,                       -- Optional: {north, south, east, west}
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_location_name_per_parent UNIQUE (type, name, parent_id)
);

-- Indexes
CREATE INDEX location_code_index ON "Locations"(code);
CREATE INDEX location_parent_index ON "Locations"(parent_id);
CREATE INDEX location_slug_index ON "Locations"(slug);
```

### LocationLink Table (Polymorphic Linking)

The `LocationLink` model provides polymorphic associations between locations and other entities:

```sql
CREATE TABLE "LocationLinks" (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES "Locations"(id) ON DELETE CASCADE,
  entity_type ENUM('article', 'user') NOT NULL,
  entity_id INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_location_entity_link UNIQUE (location_id, entity_type, entity_id)
);

-- Indexes
CREATE INDEX entity_index ON "LocationLinks"(entity_type, entity_id);
CREATE INDEX location_index ON "LocationLinks"(location_id);
```

### User Table Update

The `User` model has been extended with a home location field:

```sql
ALTER TABLE "Users" ADD COLUMN "homeLocationId" INTEGER REFERENCES "Locations"(id) ON DELETE SET NULL;
```

## Hierarchical Structure

Locations follow a 4-level hierarchy:

1. **International** - Top-level regions (e.g., "Europe", "Asia")
2. **Country** - Countries (e.g., "Greece", "Japan")
3. **Prefecture** - States/provinces/prefectures (e.g., "Attica", "Tokyo")
4. **Municipality** - Cities/towns/municipalities (e.g., "Athens", "Kyoto")

Each level (except international) can have a `parent_id` pointing to its parent location.

## API Endpoints

### Public Endpoints

- `GET /api/locations` - List locations with optional filtering
  - Query params: `type`, `parent_id`, `search`, `limit`, `offset`
  
- `GET /api/locations/:id` - Get location details including children and links

- `GET /api/locations/:id/entities` - Get articles and users linked to a location
  - Query params: `entity_type` (optional filter)

- `GET /api/locations/:entity_type/:entity_id/locations` - Get all locations linked to an entity

### Protected Endpoints (Authenticated Users)

- `POST /api/locations/link` - Link a location to an article or user
  - Body: `{ location_id, entity_type, entity_id }`
  - Authorization: Must own the entity or be admin/moderator

- `POST /api/locations/unlink` - Unlink a location from an entity
  - Body: `{ location_id, entity_type, entity_id }`
  - Authorization: Must own the entity or be admin/moderator

### Admin/Moderator Only Endpoints

- `POST /api/locations` - Create a new location
  - Body: `{ name, name_local, type, parent_id, code, lat, lng, bounding_box }`

- `PUT /api/locations/:id` - Update a location
  - Body: Same fields as create (all optional)

- `DELETE /api/locations/:id` - Delete a location
  - Fails if location has children

## Deduplication Strategy

The system prevents duplicate locations using:

1. **Unique constraint**: `(type, name, parent_id)` - ensures no duplicate location names at the same hierarchical level
2. **Slug uniqueness**: Each location has a unique slug generated from its name and type
3. **Code validation**: Optional official codes (ISO, GADM, etc.) can be used for additional verification

## Frontend Components

### LocationSelector Component

A reusable hierarchical dropdown component used throughout the application:

- **Location**: `components/LocationSelector.js`
- **Props**: 
  - `value`: Selected location ID
  - `onChange`: Callback when selection changes
  - `allowedTypes`: Array of allowed location types
  - `placeholder`: Custom placeholder text
  - `allowClear`: Allow clearing selection

### Admin Location Management

- **Path**: `/admin/locations`
- **Access**: Admin and Moderator roles only
- **Features**:
  - List all locations with search and filtering
  - Create new locations
  - Edit existing locations
  - Delete locations (with child check)
  - View hierarchical structure

### Location Detail Page

- **Path**: `/locations/[slug]`
- **Access**: Public
- **Features**:
  - Display location information
  - Show parent breadcrumb
  - List child locations
  - Show linked articles and users
  - Map display (if coordinates available)

### Article Editor Integration

- **Path**: `/articles/[id]/edit` and `/editor`
- **Features**:
  - Select multiple locations to link to article
  - Remove location links
  - View currently linked locations

### User Profile Integration

- **Path**: `/profile`
- **Features**:
  - Select home location
  - Update or remove home location
  - View home location in profile

## Usage Examples

### Creating a Location Hierarchy

```javascript
// 1. Create a country
POST /api/locations
{
  "name": "Greece",
  "type": "country",
  "code": "GR",
  "lat": 39.0742,
  "lng": 21.8243
}
// Returns: { id: 1, slug: "country-greece", ... }

// 2. Create a prefecture under the country
POST /api/locations
{
  "name": "Attica",
  "type": "prefecture",
  "parent_id": 1,
  "lat": 38.0,
  "lng": 23.7
}
// Returns: { id: 2, slug: "prefecture-attica", ... }

// 3. Create a municipality under the prefecture
POST /api/locations
{
  "name": "Athens",
  "type": "municipality",
  "parent_id": 2,
  "lat": 37.9838,
  "lng": 23.7275
}
// Returns: { id: 3, slug: "municipality-athens", ... }
```

### Linking a Location to an Article

```javascript
// Link article 42 to Athens
POST /api/locations/link
{
  "location_id": 3,
  "entity_type": "article",
  "entity_id": 42
}
```

### Setting a User's Home Location

```javascript
// Update user profile with home location
PUT /api/auth/profile
{
  "homeLocationId": 3
}
```

### Querying Locations

```javascript
// Get all countries
GET /api/locations?type=country

// Get all prefectures in Greece (parent_id=1)
GET /api/locations?type=prefecture&parent_id=1

// Search for locations
GET /api/locations?search=athens

// Get location with children and links
GET /api/locations/3
```

## Map Integration (Future Enhancement)

The location model is designed to support map visualization:

- **Point display**: Uses `lat` and `lng` for single point markers
- **Bounding box**: The `bounding_box` JSON field can store polygon data
- **Future**: Support for GeoJSON polygons for precise area representation

Example bounding box structure:
```json
{
  "north": 38.1,
  "south": 37.8,
  "east": 23.9,
  "west": 23.5
}
```

## Data Sources

For production deployment, consider seeding locations from official sources:

1. **ISO 3166** - Country codes
2. **GADM** - Global Administrative Areas Database
3. **GeoNames** - Geographical database
4. **Natural Earth** - Public domain map dataset

## Security Considerations

1. **Role-based access**: Only admins and moderators can create/update/delete locations
2. **Entity ownership**: Users can only link their own articles unless they're admin/moderator
3. **Validation**: All inputs are validated for type, required fields, and constraints
4. **SQL injection protection**: Sequelize ORM with parameterized queries
5. **No sensitive data**: Locations are public information

## Performance Optimization

1. **Indexes**: Proper indexing on `parent_id`, `code`, and `slug` for fast queries
2. **Caching**: Location data is relatively static and suitable for caching
3. **Pagination**: List endpoints support `limit` and `offset`
4. **Eager loading**: Associations are loaded efficiently using Sequelize includes

## Migration Notes

See [UPGRADE_GUIDE.md](./UPGRADE_GUIDE.md) for detailed migration instructions.

Key points:
- Database schema will auto-sync in development mode
- In production, ensure database is accessible before starting the app
- No breaking changes to existing tables
- New tables and columns added cleanly
