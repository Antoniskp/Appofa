# Quick Start Guide - Hierarchical Locations Feature

## 🚀 Getting Started

The hierarchical locations feature is now fully implemented and ready to use. This guide will help you understand what was created and how to use it.

## 📦 What's Included

### Components (1)
```
components/LocationSelector.js
```
A reusable dropdown component for selecting locations across the application.

### Pages (2 new)
```
app/admin/locations/page.js       → /admin/locations
app/locations/[slug]/page.js      → /locations/[id]
```

### Updated Pages (4)
```
app/articles/[id]/edit/page.js    → Added location linking
app/profile/page.js               → Added home location
app/admin/page.js                 → Added quick link
lib/api.js                        → Added locationAPI
```

### Documentation (4 files)
```
FRONTEND_LOCATIONS_COMPLETE.md            → Implementation checklist
doc/LOCATIONS_FRONTEND.md                 → Feature documentation
doc/LOCATIONS_IMPLEMENTATION_SUMMARY.md   → Technical summary  
doc/LOCATIONS_ARCHITECTURE.md             → Architecture diagrams
```

## 🎯 Key Pages & Usage

### 1. Location Management (Admin/Moderator Only)
**URL**: `/admin/locations`

**What it does:**
- Create, edit, and delete locations
- View hierarchical structure
- Search and filter locations

**How to access:**
1. Login as admin or moderator
2. Go to Admin Dashboard (`/admin`)
3. Click "Manage Locations" button
4. Or navigate directly to `/admin/locations`

**Actions:**
- Click "Add Location" to create new location
- Click "Edit" on any location to modify it
- Click "Delete" (confirm) to remove a location
- Use search box to find locations
- Use type filter to show specific types

### 2. Location Detail Page (Public)
**URL**: `/locations/[id]`

**What it displays:**
- Location name and details
- Breadcrumb showing hierarchy
- Child locations (if any)
- Related articles
- Users from this location

**Example URLs:**
- `/locations/1` - View location with ID 1
- `/locations/123` - View location with ID 123

### 3. Article Editor with Locations
**URL**: `/articles/[id]/edit`

**New features:**
- "Locations" section below the form
- Add multiple locations to article
- Remove linked locations
- Real-time updates

**How to use:**
1. Edit any article
2. Scroll to "Locations" section
3. Select location from dropdown
4. Click "Add" to link
5. Click "Remove" to unlink

### 4. Profile with Home Location
**URL**: `/profile`

**New feature:**
- "Home Location" field in profile settings

**How to use:**
1. Go to your profile
2. Find "Home Location" selector
3. Choose your location
4. Click "Save changes"
5. Clear by clicking X in selector

## 🔧 Location Types & Hierarchy

### The 4 Levels
```
1. International (Top)
   └─ 2. Country
      └─ 3. Prefecture
         └─ 4. Municipality
```

### Example Hierarchy
```
Asia Pacific (international)
  └── Japan (country)
      ├── Tokyo (prefecture)
      │   ├── Shibuya (municipality)
      │   ├── Shinjuku (municipality)
      │   └── Minato (municipality)
      │
      └── Osaka (prefecture)
          ├── Osaka City (municipality)
          └── Sakai (municipality)
```

## 📝 Common Tasks

### Create a New Location

1. Navigate to `/admin/locations`
2. Click "Add Location" button
3. Fill in the form:
   - **Name** (required): English name
   - **Local Name**: Native language name
   - **Type** (required): Choose level in hierarchy
   - **Parent Location ID**: ID of parent (for hierarchy)
   - **Code**: ISO code or custom code
   - **Latitude/Longitude**: Geographic coordinates
4. Click "Create"

### Link Location to Article

1. Edit an article at `/articles/[id]/edit`
2. Scroll to "Locations" section
3. Open the location dropdown
4. Search or browse for location
5. Click to select
6. Click "Add" button
7. Location appears in linked list

### Set Your Home Location

1. Go to `/profile`
2. Find "Home Location" field
3. Open dropdown and select location
4. Click "Save changes"
5. Your profile now shows home location

### View Location Details

1. Navigate to `/locations/[id]` (replace [id] with location ID)
2. Or click location links from articles/profiles
3. View all location information
4. Browse child locations
5. See related articles and users

## 🎨 UI Components

### LocationSelector Dropdown
```
┌─────────────────────────────────────┐
│ Select a location            ✕  ▼  │ ← Button
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ Search locations...             │ │ ← Search
│ └─────────────────────────────────┘ │
│                                     │
│ INTERNATIONAL                       │ ← Type Group
│   Global (EN)                       │
│                                     │
│ COUNTRY                             │
│   Japan (日本)              JP      │ ← Location
│   United States             US      │
│                                     │
│ PREFECTURE                          │
│   Tokyo (東京)                      │
│     Japan                           │ ← Parent shown
│   Osaka (大阪)                      │
│     Japan                           │
└─────────────────────────────────────┘
```

### Location Management Table
```
┌────────────────────────────────────────────────────┐
│ Search: [        ]  Type: [All Types ▼]  [Add]    │
├────────────────────────────────────────────────────┤
│                                                    │
│ ○ Japan (日本)                    [Edit] [Delete] │
│   Type: country  •  Code: JP                      │
│                                                    │
│   ○ Tokyo (東京)                  [Edit] [Delete] │
│     Type: prefecture  •  2 child locations        │
│                                                    │
│     ○ Shibuya (渋谷)             [Edit] [Delete] │
│       Type: municipality                          │
│                                                    │
│     ○ Shinjuku (新宿)            [Edit] [Delete] │
│       Type: municipality                          │
└────────────────────────────────────────────────────┘
```

### Article Editor - Locations Section
```
┌────────────────────────────────────────────────────┐
│ Locations                                          │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ Tokyo (東京)  [prefecture]          [Remove]   │ │ ← Linked
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ [Select a location to add        ▼]     [Add]    │ ← Add new
└────────────────────────────────────────────────────┘
```

## 🔐 Permissions

| Role      | View | Add Locations | Edit/Delete | Link to Articles | Set Home |
|-----------|------|---------------|-------------|------------------|----------|
| Admin     | ✅   | ✅            | ✅          | ✅               | ✅       |
| Moderator | ✅   | ✅            | ✅          | ✅               | ✅       |
| Editor    | ✅   | ❌            | ❌          | ✅ (own)         | ✅       |
| Viewer    | ✅   | ❌            | ❌          | ❌               | ✅       |

## 🐛 Troubleshooting

### Dropdown Not Opening
- **Cause**: JavaScript error or slow API
- **Fix**: Check browser console, verify backend is running

### Cannot Create Location
- **Cause**: Not admin/moderator or missing required fields
- **Fix**: Check user role, fill all required fields (name, type)

### Location Not Linking to Article
- **Cause**: API error or permissions
- **Fix**: Check network tab, verify you can edit the article

### Hierarchy Not Showing Correctly
- **Cause**: Invalid parent_id references
- **Fix**: Ensure parent location exists before creating child

### Search Not Working
- **Cause**: Client-side filter issue
- **Fix**: Reload page, check search term, try clearing and retyping

## 💡 Tips & Best Practices

### Creating Locations
1. **Start from top**: Create international/country first
2. **Use codes**: Add ISO codes for countries (e.g., JP, US)
3. **Add coordinates**: Include lat/lng for mapping features
4. **Local names**: Always add local language names

### Linking to Articles
1. **Be specific**: Link to most specific location (municipality preferred)
2. **Multiple locations**: Articles can have multiple locations
3. **Review before publish**: Check linked locations before publishing

### Setting Home Location
1. **Be accurate**: Choose your actual location
2. **Update when moving**: Keep it current
3. **Privacy**: Home location visible to others

## 📚 Further Reading

- **Feature Documentation**: `doc/LOCATIONS_FRONTEND.md`
- **Implementation Details**: `doc/LOCATIONS_IMPLEMENTATION_SUMMARY.md`
- **Architecture**: `doc/LOCATIONS_ARCHITECTURE.md`
- **API Reference**: See `lib/api.js` and backend docs

## 🎯 Quick Links

### For Admins
- [Admin Dashboard](/admin)
- [Location Management](/admin/locations)
- [System Health](/admin/status)

### For Users
- [Your Profile](/profile)
- [Create Article](/editor)
- [Browse Articles](/articles)

## ⚡ Quick Reference

### API Methods (Developer)
```javascript
import { locationAPI } from '@/lib/api';

// List locations
await locationAPI.getAll({ type: 'country' });

// Get one location
await locationAPI.getById(123);

// Create (admin only)
await locationAPI.create({ name: 'Tokyo', type: 'prefecture' });

// Link to article
await locationAPI.link('article', articleId, locationId);

// Get article's locations
await locationAPI.getEntityLocations('article', articleId);
```

### Component Usage (Developer)
```jsx
import LocationSelector from '@/components/LocationSelector';

function MyComponent() {
  const [locationId, setLocationId] = useState(null);
  
  return (
    <LocationSelector
      value={locationId}
      onChange={setLocationId}
      placeholder="Select location"
      allowClear={true}
    />
  );
}
```

## ✅ Success!

The hierarchical locations feature is now fully integrated into Appofa. All components are built, tested, and ready for use.

**Next Steps:**
1. Seed database with initial locations
2. Test with real users
3. Gather feedback
4. Iterate and improve

---

**Questions?** Check the documentation or review the code!
**Issues?** See troubleshooting section above.
**Feedback?** We'd love to hear how it works for you!

Happy locating! 🌍
