# Hierarchical Locations - Frontend Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layout                       │
│                    (app/layout.js)                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│   Public     │    │    Admin     │      │   User       │
│   Routes     │    │   Routes     │      │   Routes     │
└──────────────┘    └──────────────┘      └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│ /locations/  │    │/admin/       │      │ /profile     │
│  [slug]      │    │ locations    │      │              │
└──────────────┘    └──────────────┘      └──────────────┘
        │                     │                     │
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │ LocationSelector │
                   │   Component      │
                   └──────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │   locationAPI    │
                   │   (lib/api.js)   │
                   └──────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │  Backend API     │
                   │ /api/locations   │
                   └──────────────────┘
```

## Data Flow

### 1. Fetching Locations

```
User Action
    │
    ├─> LocationSelector.open()
    │       │
    │       ├─> locationAPI.getAll({ type, parent_id })
    │       │       │
    │       │       ├─> fetch('/api/locations?...')
    │       │       │       │
    │       │       │       └─> Backend Controller
    │       │       │               │
    │       │       └─<─ { success: true, locations: [...] }
    │       │
    │       ├─> setLocations(response.locations)
    │       │
    │       └─> Display grouped by type
    │
    └─> User selects location
            │
            └─> onChange(locationId) callback
```

### 2. Creating Location (Admin)

```
Admin Action
    │
    ├─> Location Management Page
    │       │
    │       ├─> Click "Add Location"
    │       │       │
    │       │       └─> Show Modal with Form
    │       │
    │       ├─> Fill in form fields
    │       │   (name, name_local, type, parent_id, code, lat, lng)
    │       │
    │       ├─> Submit form
    │       │       │
    │       │       ├─> locationAPI.create(formData)
    │       │       │       │
    │       │       │       ├─> POST '/api/locations'
    │       │       │       │       │
    │       │       │       │       └─> Backend validates & creates
    │       │       │       │               │
    │       │       │       └─<─ { success: true, location: {...} }
    │       │       │
    │       │       └─> fetchLocations() to refresh list
    │       │
    │       └─> Display success message
```

### 3. Linking Location to Article

```
Editor Action
    │
    ├─> Edit Article Page
    │       │
    │       ├─> Load article data
    │       │       │
    │       │       ├─> articleAPI.getById(id)
    │       │       │
    │       │       └─> locationAPI.getEntityLocations('article', id)
    │       │               │
    │       │               └─> Display linked locations
    │       │
    │       ├─> Select location from dropdown
    │       │       │
    │       │       └─> setNewLocationId(locationId)
    │       │
    │       ├─> Click "Add"
    │       │       │
    │       │       ├─> locationAPI.link('article', articleId, locationId)
    │       │       │       │
    │       │       │       ├─> POST '/api/locations/link'
    │       │       │       │   { entity_type: 'article',
    │       │       │       │     entity_id: articleId,
    │       │       │       │     location_id: locationId }
    │       │       │       │
    │       │       │       └─> Backend creates link in location_links table
    │       │       │
    │       │       └─> Reload linked locations
    │       │
    │       └─> Display updated list
```

### 4. Setting Home Location (Profile)

```
User Action
    │
    ├─> Profile Page
    │       │
    │       ├─> Load profile data
    │       │       │
    │       │       ├─> authAPI.getProfile()
    │       │       │       │
    │       │       │       └─> { user: { homeLocationId: 123 } }
    │       │       │
    │       │       └─> If homeLocationId exists:
    │       │           locationAPI.getById(homeLocationId)
    │       │
    │       ├─> Select new location from dropdown
    │       │       │
    │       │       └─> setProfileData({ homeLocationId: newId })
    │       │
    │       ├─> Click "Save changes"
    │       │       │
    │       │       ├─> authAPI.updateProfile({ homeLocationId: newId })
    │       │       │       │
    │       │       │       ├─> PUT '/api/auth/profile'
    │       │       │       │   { homeLocationId: newId }
    │       │       │       │
    │       │       │       └─> Backend updates users.home_location_id
    │       │       │
    │       │       └─> Display success message
```

## Component State Management

### LocationSelector Component

```javascript
State:
├─ locations: []                  // All available locations
├─ loading: boolean               // API fetch in progress
├─ error: string                  // Error message if any
├─ selectedLocation: object|null  // Currently selected location
├─ isOpen: boolean                // Dropdown open/closed
└─ searchTerm: string             // Search filter

Props:
├─ value: number|null             // Selected location ID (controlled)
├─ onChange: (id) => void         // Selection callback
├─ placeholder: string            // Dropdown placeholder text
├─ className: string              // Additional CSS classes
├─ allowClear: boolean            // Show clear button
├─ filterType: string|null        // Filter by location type
└─ filterParentId: number|null    // Filter by parent location
```

### Location Management Page

```javascript
State:
├─ locations: []                  // All locations
├─ loading: boolean               // Initial load
├─ error: string                  // Error message
├─ successMessage: string         // Success message
├─ searchTerm: string             // Search filter
├─ filterType: string             // Type filter
├─ showModal: boolean             // Create/edit modal visible
├─ editingLocation: object|null   // Location being edited
├─ formData: object               // Form field values
├─ submitting: boolean            // Form submission in progress
└─ deleteConfirm: number|null     // Location pending delete confirmation
```

### Location Detail Page

```javascript
State:
├─ location: object|null          // Main location data
├─ entities: object               // Linked articles and users
│   ├─ articles: []
│   └─ users: []
├─ children: []                   // Child locations
├─ breadcrumb: []                 // Hierarchy path
├─ loading: boolean               // Page loading
└─ error: string                  // Error message
```

## API Request/Response Contracts

### GET /api/locations
```javascript
Request:
  Query Params: { type?, parent_id?, limit?, offset? }

Response:
  { success: true, locations: [
    { id, name, name_local, type, parent_id, code, lat, lng,
      parent: { id, name, ... } }
  ]}
```

### GET /api/locations/:id
```javascript
Request:
  Path: /api/locations/123

Response:
  { success: true, location: {
    id, name, name_local, type, parent_id, code, lat, lng,
    parent: { id, name, type, ... }
  }}
```

### POST /api/locations
```javascript
Request:
  Body: { name, name_local?, type, parent_id?, code?, lat?, lng? }

Response:
  { success: true, location: { id, ... }}
```

### POST /api/locations/link
```javascript
Request:
  Body: { entity_type: 'article', entity_id: 123, location_id: 456 }

Response:
  { success: true, message: 'Location linked successfully' }
```

### GET /api/locations/article/:id/locations
```javascript
Request:
  Path: /api/locations/article/123/locations

Response:
  { success: true, locations: [...] }
```

### GET /api/locations/:id/entities
```javascript
Request:
  Path: /api/locations/456/entities

Response:
  { success: true, articles: [...], users: [...] }
```

## Database Schema

```sql
┌─────────────────────────────────────────────────────┐
│                    locations                         │
├──────────────┬──────────────────────────────────────┤
│ id           │ INTEGER PRIMARY KEY AUTO_INCREMENT   │
│ name         │ VARCHAR(255) NOT NULL                │
│ name_local   │ VARCHAR(255)                         │
│ type         │ ENUM('international', 'country',     │
│              │      'prefecture', 'municipality')   │
│ parent_id    │ INTEGER REFERENCES locations(id)     │
│ code         │ VARCHAR(50)                          │
│ lat          │ DECIMAL(10, 8)                       │
│ lng          │ DECIMAL(11, 8)                       │
│ created_at   │ TIMESTAMP DEFAULT CURRENT_TIMESTAMP  │
│ updated_at   │ TIMESTAMP DEFAULT CURRENT_TIMESTAMP  │
└──────────────┴──────────────────────────────────────┘
                          │
                          │ (parent_id FK)
                          ▼
                   Self-referencing
                   for hierarchy

┌─────────────────────────────────────────────────────┐
│                 location_links                       │
├──────────────┬──────────────────────────────────────┤
│ id           │ INTEGER PRIMARY KEY AUTO_INCREMENT   │
│ location_id  │ INTEGER REFERENCES locations(id)     │
│ entity_type  │ VARCHAR(50) ('article', 'user')      │
│ entity_id    │ INTEGER                              │
│ created_at   │ TIMESTAMP DEFAULT CURRENT_TIMESTAMP  │
├──────────────┴──────────────────────────────────────┤
│ UNIQUE(location_id, entity_type, entity_id)         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                      users                           │
├──────────────┬──────────────────────────────────────┤
│ id           │ INTEGER PRIMARY KEY AUTO_INCREMENT   │
│ ...          │ ...                                  │
│ home_location_id │ INTEGER REFERENCES locations(id) │
│ ...          │ ...                                  │
└──────────────┴──────────────────────────────────────┘
```

## Error Handling Flow

```
API Call
    │
    ├─> try {
    │     const response = await locationAPI.method()
    │     
    │     if (response.success) {
    │         // Update state
    │         // Show success message
    │     } else {
    │         // Handle API error
    │         setError(response.message)
    │     }
    │   }
    │
    └─> catch (error) {
          // Handle network/fetch error
          setError(error.message || 'Failed to...')
        }
        
Display:
    │
    ├─> <AlertMessage message={error} tone="error" />
    │
    └─> User sees friendly error message
```

## Authentication & Authorization Flow

```
User Request
    │
    ├─> ProtectedRoute Component
    │       │
    │       ├─> Check user role
    │       │   (via useAuth() context)
    │       │
    │       ├─> If admin/moderator:
    │       │   └─> Render admin pages
    │       │
    │       ├─> If editor:
    │       │   └─> Render with limited permissions
    │       │
    │       └─> If not authorized:
    │           └─> Redirect to login
    │
    ├─> API Request
    │       │
    │       ├─> Include credentials (cookies)
    │       │
    │       ├─> Include CSRF token (for mutations)
    │       │
    │       └─> Backend validates
    │               │
    │               ├─> If authorized: Process request
    │               │
    │               └─> If not: Return 401/403
    │
    └─> Handle response
```

## Performance Optimization

### Lazy Loading
```
Component Mount
    │
    ├─> Don't load locations immediately
    │
    └─> Load only when:
        ├─> Dropdown opens (LocationSelector)
        ├─> Page loads (Management/Detail pages)
        └─> User interaction triggers need
```

### Caching Strategy
```
locationAPI.getById(123)
    │
    ├─> Check if already loaded in component state
    │   │
    │   ├─> If yes: Use cached data
    │   │
    │   └─> If no: Fetch from API
    │           │
    │           └─> Store in state for reuse
```

### Debouncing (Search)
```
User types in search
    │
    ├─> Don't search on every keystroke
    │
    └─> Filter locally (no API call)
        - Client-side filtering of loaded data
        - Instant feedback
        - No network overhead
```

## Accessibility Features

```
Component Accessibility
    │
    ├─> Semantic HTML
    │   ├─> <button> for clickable elements
    │   ├─> <select> for dropdowns (custom styled)
    │   └─> <form> with proper labels
    │
    ├─> Keyboard Navigation
    │   ├─> Tab through form fields
    │   ├─> Enter to submit
    │   └─> Escape to close modals
    │
    ├─> ARIA Attributes
    │   ├─> role="alert" for errors
    │   ├─> role="status" for success
    │   └─> aria-label for icon buttons
    │
    └─> Color Contrast
        ├─> Text: >= 4.5:1 ratio
        └─> Interactive: >= 3:1 ratio
```

## Testing Strategy

```
Unit Tests
    │
    ├─> LocationSelector
    │   ├─> Renders correctly
    │   ├─> Search filters work
    │   ├─> Selection triggers onChange
    │   └─> Clear button works
    │
    ├─> API Methods
    │   ├─> Correct endpoints called
    │   ├─> Request format correct
    │   └─> Response parsed correctly
    │
    └─> Form Validation
        ├─> Required fields validated
        ├─> Data types correct
        └─> Edge cases handled

Integration Tests
    │
    ├─> Location Management
    │   ├─> Create → Read → Update → Delete
    │   ├─> Search and filter
    │   └─> Hierarchical display
    │
    ├─> Article Linking
    │   ├─> Link location
    │   ├─> Display linked
    │   └─> Unlink location
    │
    └─> Profile Update
        ├─> Set home location
        ├─> Save profile
        └─> Display updated

E2E Tests
    │
    ├─> Admin Workflow
    │   ├─> Login as admin
    │   ├─> Create location
    │   ├─> Edit location
    │   └─> Delete location
    │
    └─> User Workflow
        ├─> Login as editor
        ├─> Edit article
        ├─> Link location
        └─> Verify on detail page
```

---

This architecture document provides a comprehensive overview of how all the pieces fit together in the hierarchical locations feature.
