# Hierarchical Locations Feature - Frontend Documentation

## Overview

The hierarchical locations feature provides a complete frontend implementation for managing and displaying geographic locations across the Appofa platform. This feature allows users to:

- Browse and view location hierarchies (International → Country → Prefecture → Municipality)
- Link locations to articles and user profiles
- Manage locations through an admin interface
- Display location information and related content

## Components Created

### 1. LocationSelector Component
**File:** `components/LocationSelector.js`

A reusable dropdown component for selecting locations from a hierarchical list.

**Features:**
- Hierarchical display grouped by location type
- Search/filter functionality
- Displays location names in both English and local language
- Shows parent location context
- Clear selection option
- Responsive dropdown with proper z-index handling

**Props:**
```javascript
{
  value: number | null,           // Selected location ID
  onChange: (id) => void,         // Callback when selection changes
  placeholder: string,            // Placeholder text (default: "Select a location")
  className: string,              // Additional CSS classes
  allowClear: boolean,            // Show clear button (default: true)
  filterType: string | null,      // Filter by location type
  filterParentId: number | null   // Filter by parent location ID
}
```

**Usage Example:**
```jsx
import LocationSelector from '@/components/LocationSelector';

function MyComponent() {
  const [locationId, setLocationId] = useState(null);

  return (
    <LocationSelector
      value={locationId}
      onChange={setLocationId}
      placeholder="Select your location"
      allowClear={true}
    />
  );
}
```

### 2. Location Management Page
**File:** `app/admin/locations/page.js`

Admin/moderator interface for CRUD operations on locations.

**Features:**
- List all locations in hierarchical tree structure
- Search by name, local name, or code
- Filter by location type
- Create new locations with all fields
- Edit existing locations
- Delete locations (with confirmation)
- Visual hierarchy with indentation
- Protected by ProtectedRoute (admin/moderator only)

**Accessible at:** `/admin/locations`

**Location Fields:**
- `name` (required) - English name
- `name_local` - Local language name
- `type` (required) - One of: international, country, prefecture, municipality
- `parent_id` - ID of parent location (creates hierarchy)
- `code` - Location code (e.g., ISO codes)
- `lat` / `lng` - Geographic coordinates

### 3. Location Detail Page
**File:** `app/locations/[slug]/page.js`

Public page displaying location information and related content.

**Features:**
- Breadcrumb navigation showing location hierarchy
- Location details (name, type, coordinates, code)
- List of child locations (if any)
- Related articles linked to the location
- Users with this location as home location
- Dynamic routing using Next.js App Router

**Accessible at:** `/locations/[id]`

**Example URLs:**
- `/locations/1` - International location
- `/locations/123` - Specific municipality

### 4. Article Editor Updates
**File:** `app/articles/[id]/edit/page.js`

Enhanced article editor with location linking functionality.

**New Features:**
- Location selector integrated into article form
- Display linked locations with remove option
- Add multiple locations to an article
- Real-time updates via API
- Visual feedback for linked locations

**How to Use:**
1. Edit an article at `/articles/[id]/edit`
2. Scroll to the "Locations" section
3. Use the dropdown to select a location
4. Click "Add" to link the location
5. Click "Remove" to unlink a location
6. Changes are saved immediately via API

### 5. Profile Page Updates
**File:** `app/profile/page.js`

User profile page with home location selection.

**New Features:**
- Home location selector in profile settings
- Display current home location
- Clear/change home location
- Integrated with existing profile update flow

**How to Use:**
1. Navigate to `/profile`
2. Find the "Home Location" field
3. Select your home location from the dropdown
4. Click "Save changes" to update profile

## API Integration

### Location API Methods
**File:** `lib/api.js`

Added `locationAPI` namespace with the following methods:

```javascript
locationAPI.getAll(params)              // Get all locations with optional filters
locationAPI.getById(id)                 // Get location details
locationAPI.create(locationData)        // Create new location (admin/moderator)
locationAPI.update(id, locationData)    // Update location (admin/moderator)
locationAPI.delete(id)                  // Delete location (admin/moderator)
locationAPI.link(entityType, entityId, locationId)     // Link location to entity
locationAPI.unlink(entityType, entityId, locationId)   // Unlink location from entity
locationAPI.getEntityLocations(entityType, entityId)   // Get entity's locations
locationAPI.getLocationEntities(id)                    // Get location's linked entities
```

### Query Parameters

**GET /api/locations:**
- `type` - Filter by location type
- `parent_id` - Filter by parent location
- `limit` - Limit number of results
- `offset` - Pagination offset

**Example Usage:**
```javascript
// Get all countries
const countries = await locationAPI.getAll({ type: 'country' });

// Get municipalities in a prefecture
const cities = await locationAPI.getAll({ parent_id: 47 });

// Link location to article
await locationAPI.link('article', articleId, locationId);
```

## Location Types Hierarchy

The system supports four hierarchical levels:

1. **International** (Top level)
   - Global regions or international organizations
   - No parent

2. **Country**
   - Individual countries
   - Parent: International (optional)

3. **Prefecture**
   - States, provinces, regions, prefectures
   - Parent: Country

4. **Municipality**
   - Cities, towns, villages
   - Parent: Prefecture

**Example Hierarchy:**
```
International
└── Asia Pacific
    └── Japan (Country)
        ├── Tokyo (Prefecture)
        │   ├── Chiyoda (Municipality)
        │   ├── Shibuya (Municipality)
        │   └── Shinjuku (Municipality)
        └── Osaka (Prefecture)
            ├── Osaka City (Municipality)
            └── Sakai (Municipality)
```

## User Roles and Permissions

### Admin
- Full access to all location features
- Create, read, update, delete locations
- Link/unlink locations from any entity

### Moderator
- Full access to all location features
- Same permissions as admin for locations

### Editor/Viewer
- Read-only access to locations
- Can view location details
- Can link locations to their own articles
- Can set their own home location

## Styling and UI Patterns

All components follow the existing Appofa design patterns:

### Tailwind CSS Classes
- **Inputs:** `w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500`
- **Buttons:** `bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700`
- **Cards:** `bg-white rounded-lg shadow-md p-6`

### Color Scheme
- Blue: Primary actions (`bg-blue-600`)
- Green: Success states (`bg-green-100 text-green-800`)
- Red: Delete/destructive actions (`text-red-600`)
- Gray: Neutral/secondary elements

### Responsive Design
All components are responsive and work on:
- Mobile (sm: <640px)
- Tablet (md: 640px-1024px)
- Desktop (lg: >1024px)

## Error Handling

All components implement proper error handling:

1. **Loading States**
   - Skeleton loaders or loading text
   - Disabled buttons during submission

2. **Error States**
   - AlertMessage component for errors
   - Try-catch blocks around API calls
   - User-friendly error messages

3. **Validation**
   - Required fields marked with asterisk
   - Form validation before submission
   - Confirmation dialogs for destructive actions

## Testing Recommendations

### Manual Testing Checklist

**LocationSelector:**
- [ ] Dropdown opens and closes correctly
- [ ] Search filters locations
- [ ] Selection updates parent component
- [ ] Clear button works
- [ ] Displays parent location context
- [ ] Groups by location type correctly

**Location Management:**
- [ ] Can create locations with all fields
- [ ] Can edit existing locations
- [ ] Delete confirmation works
- [ ] Search filters work
- [ ] Type filter works
- [ ] Hierarchical display shows correctly
- [ ] Only admins/moderators can access

**Location Detail:**
- [ ] Displays location information
- [ ] Breadcrumb navigation works
- [ ] Shows child locations
- [ ] Shows linked articles
- [ ] Shows users from location
- [ ] Links to related pages work

**Article Editor:**
- [ ] Can add locations to article
- [ ] Can remove locations from article
- [ ] Linked locations display correctly
- [ ] Changes persist after save

**Profile Page:**
- [ ] Can set home location
- [ ] Can clear home location
- [ ] Location displays after save
- [ ] Updates persist

### API Integration Tests

Test that all API endpoints work:
```javascript
// GET /api/locations
// GET /api/locations/:id
// POST /api/locations
// PUT /api/locations/:id
// DELETE /api/locations/:id
// POST /api/locations/link
// POST /api/locations/unlink
// GET /api/locations/:entity_type/:entity_id/locations
// GET /api/locations/:id/entities
```

## Accessibility

Components follow accessibility best practices:

- Semantic HTML elements
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader friendly

## Performance Considerations

1. **Lazy Loading**
   - Location data loaded on demand
   - Pagination for large datasets

2. **Caching**
   - Selected location cached in state
   - Prevents redundant API calls

3. **Optimistic Updates**
   - UI updates immediately
   - Reverts on error

## Future Enhancements

Possible improvements for future iterations:

1. **Search and Discovery**
   - Global location search
   - Location-based article filtering
   - Map visualization

2. **Geocoding**
   - Automatic coordinate lookup
   - Address to location conversion

3. **Localization**
   - Multi-language support
   - Translation management

4. **Analytics**
   - Popular locations
   - Usage statistics
   - Geographic distribution charts

5. **Bulk Operations**
   - Import locations from CSV
   - Bulk update/delete
   - Location merging

## Troubleshooting

### Common Issues

**LocationSelector not displaying:**
- Check API connection to `/api/locations`
- Verify backend server is running
- Check browser console for errors

**Cannot save locations:**
- Verify user has admin/moderator role
- Check CSRF token is present
- Verify all required fields are filled

**Locations not linking:**
- Ensure entity (article/user) exists
- Check entity ID is correct
- Verify backend link endpoint is working

**Hierarchy not displaying:**
- Check parent_id references are valid
- Ensure no circular references
- Verify location types are correct

## Support and Maintenance

For issues or questions:
1. Check this documentation
2. Review component source code
3. Check API endpoint responses
4. Review browser console for errors
5. Check server logs for backend issues

## Version History

**v1.0.0** (Current)
- Initial implementation of hierarchical locations
- Location selector component
- Location management interface
- Location detail pages
- Article and profile integration
- Full CRUD operations
- Entity linking functionality
