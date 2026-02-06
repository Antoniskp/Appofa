# AI Project Instructions

## Section 1: Project Overview

### Project Summary
- News application with a Node.js/Express backend and a Next.js frontend
- PostgreSQL database managed with Sequelize ORM
- Authentication uses JWT and bcryptjs
- Node.js v18+ required (see README.md)

### Technology Stack
- **Frontend**: Next.js 15.x (App Router), React 19.x
- **Backend**: Express 5.x, Sequelize ORM
- **Database**: PostgreSQL (production), SQLite (tests)
- **Authentication**: JWT with HttpOnly cookies
- **Testing**: Jest
- **Styling**: Tailwind CSS

### Key Architectural Decisions
- Next.js App Router for routing and server components
- Separation of client/server components ('use client' directive)
- Centralized API client pattern (lib/api.js)
- Middleware chains for security (CSRF, Auth, Rate Limiting)
- Role-based access control (admin, editor, viewer)
- Hierarchical location system with polymorphic relationships

### Key Documentation
- **README.md** - Project setup and API overview
- **doc/PROJECT_SUMMARY.md** - Holistic project overview
- **doc/ARCHITECTURE.md** - System architecture and middleware stack
- **doc/SECURITY.md** - Security guidelines and best practices
- **doc/DEPLOYMENT.md** - Deployment procedures
- **doc/API_TESTING.md** - API testing guide
- **doc/LOCATIONS_ARCHITECTURE.md** - Location feature implementation
- **doc/VPS_DEPLOYMENT.md** - VPS deployment guide

### Live Demo
http://185.92.192.81

---

## Section 2: Development Principles

### DRY (Don't Repeat Yourself)

#### Reusable Components
- **ArticleCard** (`components/ArticleCard.js`) - Display articles with grid/list variants
- **AlertMessage** (`components/AlertMessage.js`) - Error/success messages with tone variants
- **EmptyState** (`components/EmptyState.js`) - Empty/error states with optional actions
- **SkeletonLoader** (`components/SkeletonLoader.js`) - Loading placeholders matching ArticleCard variants
- **LocationSelector** (`components/LocationSelector.js`) - Location picker with search and filtering
- **ProtectedRoute** (`components/ProtectedRoute.js`) - Authentication wrapper for protected pages
- **AdminTable** (`components/AdminTable.js`) - Reusable admin data table
- **Pagination** (`components/Pagination.js`) - Pagination controls

#### Custom Hooks
- **useAsyncData** (`hooks/useAsyncData.js`) - Standardized async data fetching with loading/error states
- **useFilters** (`hooks/useFilters.js`) - Filter state management for list pages
- **useAuth** (via `lib/auth-context.js`) - Authentication state and methods

#### Shared Utilities
- **lib/api.js** - Centralized API client with CSRF protection
- **lib/utils/articleTypes.js** - Article type utilities and helpers
- **lib/auth-context.js** - Authentication context provider
- **config/articleCategories.json** - Article type configuration

### Component Patterns

#### Client vs Server Components
- Use `'use client'` directive at the top for components requiring:
  - State management (useState, useReducer)
  - Effects (useEffect)
  - Event handlers
  - Browser APIs
  - Context consumers
- Server components (no directive) for:
  - Static content
  - Data fetching at build/request time
  - SEO-critical content

#### Protected Routes
```javascript
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      {/* Admin-only content */}
    </ProtectedRoute>
  );
}
```

#### Form Components and State Management
- Use controlled components with useState
- Implement client-side validation before API calls
- Use useAsyncData for form submission
- Show loading states during submission
- Display success/error feedback with AlertMessage

#### Loading and Error States
- **Always** show loading states with SkeletonLoader
- **Always** handle errors with AlertMessage or EmptyState
- **Never** leave users wondering if something is loading

### Code Organization

#### Backend Structure
```
src/
├── controllers/     # Business logic and data transformation
│   ├── articleController.js
│   ├── authController.js
│   └── locationController.js
├── models/          # Database models (Sequelize)
│   ├── Article.js
│   ├── User.js
│   ├── Location.js
│   └── LocationLink.js
├── routes/          # Route definitions and middleware chains
│   ├── articles.js
│   ├── auth.js
│   └── locations.js
├── middleware/      # Reusable middleware
│   ├── auth.js
│   ├── csrfProtection.js
│   ├── checkRole.js
│   ├── rateLimiter.js
│   └── optionalAuth.js
└── utils/           # Helper functions
```

#### Frontend Structure
```
app/                 # Pages (Next.js App Router)
├── page.js          # Home page
├── articles/        # Articles section
├── admin/           # Admin panel
└── auth/            # Authentication pages

components/          # Reusable UI components
├── ArticleCard.js
├── ProtectedRoute.js
└── ...

lib/                 # Utilities and shared code
├── api.js           # API client
├── auth-context.js  # Auth context
└── utils/           # Helper utilities

hooks/               # Custom React hooks
├── useAsyncData.js
└── useFilters.js

config/              # Configuration files
└── articleCategories.json
```

---

## Section 3: Coding Standards

### Frontend Patterns

#### Component Structure
```javascript
'use client'; // Always at the top for client components

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAsyncData from '@/hooks/useAsyncData';
// ... other imports

export default function ComponentName() {
  // 1. State declarations
  const [localState, setLocalState] = useState(initialValue);
  
  // 2. Custom hooks
  const { data, loading, error, refetch } = useAsyncData(
    () => apiFunction(params),
    [dependencies]
  );
  
  // 3. useEffect hooks
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 4. Event handlers
  const handleEvent = async (e) => {
    // Handler logic
  };
  
  // 5. Conditional rendering logic
  if (loading) return <SkeletonLoader />;
  if (error) return <AlertMessage message={error} />;
  
  // 6. Main render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

#### Custom Hooks Usage

**useAsyncData** - For data fetching:
```javascript
import useAsyncData from '@/hooks/useAsyncData';
import { articleAPI } from '@/lib/api';

const { data, loading, error, refetch } = useAsyncData(
  () => articleAPI.getAll({ type: 'news' }),
  [] // dependencies
);

// With options
const { data, loading, error } = useAsyncData(
  () => articleAPI.getById(id),
  [id],
  {
    initialData: null,
    transform: (data) => data.article,
    onSuccess: (data) => console.log('Loaded:', data),
    onError: (err) => console.error('Failed:', err)
  }
);
```

**useAuth** - For authentication state:
```javascript
import { useAuth } from '@/lib/auth-context';

const { user, login, logout, loading } = useAuth();

// Check if user is authenticated
if (user) {
  // Show user-specific content
}

// Perform login
await login(email, password);
```

**useFilters** - For filter state management:
```javascript
import useFilters from '@/hooks/useFilters';

const { filters, page, totalPages, updateFilter, resetFilters, nextPage, prevPage } = useFilters({
  type: 'news',
  category: ''
});
```

#### Reusable Components Reference

**ArticleCard** - Display articles:
```javascript
<ArticleCard 
  article={article}
  variant="grid" // or "list"
/>
```

**AlertMessage** - Show messages:
```javascript
<AlertMessage 
  message={error || success}
  tone="error" // or "success"
/>
```

**EmptyState** - Empty/error states:
```javascript
<EmptyState 
  type="empty" // or "error"
  message="No articles found"
  actionLabel="Create Article"
  onAction={() => router.push('/articles/create')}
/>
```

**SkeletonLoader** - Loading states:
```javascript
<SkeletonLoader 
  count={5}
  variant="grid" // or "list"
/>
```

**LocationSelector** - Location picker:
```javascript
<LocationSelector 
  value={selectedLocationId}
  onChange={setSelectedLocationId}
  filterType="municipality" // optional: filter by location type
  placeholder="Select location"
/>
```

**ProtectedRoute** - Route protection:
```javascript
<ProtectedRoute requiredRole="admin">
  <AdminContent />
</ProtectedRoute>
```

### Backend Patterns

#### Controller Structure
```javascript
const { Model } = require('../models');

exports.controllerName = async (req, res) => {
  try {
    // 1. Extract and validate input
    const { param1, param2 } = req.body;
    
    if (!param1) {
      return res.status(400).json({
        success: false,
        message: 'Validation error message'
      });
    }
    
    // 2. Check authorization
    if (req.user.id !== resourceOwnerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // 3. Perform business logic
    const result = await Model.findAll({ where: { param1 } });
    
    // 4. Return standardized response
    res.status(200).json({
      success: true,
      data: result,
      message: 'Optional success message'
    });
    
  } catch (error) {
    console.error('Error in controllerName:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

#### API Response Format

**Success Response:**
```javascript
res.status(200).json({
  success: true,
  data: { /* result data */ },
  message: 'Optional success message'
});
```

**Error Response:**
```javascript
res.status(400).json({
  success: false,
  message: 'User-friendly error description'
});

// In development, you can include error details
res.status(500).json({
  success: false,
  message: 'Internal server error',
  error: process.env.NODE_ENV === 'development' ? error.message : undefined
});
```

#### Route Structure with Middleware
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerName');
const { authMiddleware } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrfProtection');
const { createLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Public GET route with optional auth
router.get('/', 
  apiLimiter, 
  optionalAuthMiddleware, 
  controller.getAll
);

// Protected POST route with rate limiting and CSRF
router.post('/', 
  createLimiter,
  authMiddleware,
  csrfProtection,
  controller.create
);

// Admin-only route
router.delete('/:id',
  authMiddleware,
  checkRole(['admin']),
  controller.delete
);

module.exports = router;
```

---

## Section 4: Component Reusability Guidelines

### When to Create a Reusable Component

✅ **Create a reusable component when:**
- Pattern appears 2+ times across different pages
- Complex logic that could be isolated and tested independently
- Consistent UI element across pages
- Component could benefit other features in the future

❌ **Don't create a reusable component when:**
- Used only once and unlikely to be reused
- Highly specific to a single page's unique requirements
- Would require too many props making it overly complex

### Recent Refactoring Examples

1. **ArticleForm** - Consolidated article create/edit forms
   - Before: Duplicate form logic in create and edit pages
   - After: Single ArticleForm component with mode prop
   - Benefits: DRY, consistent validation, easier maintenance

2. **useAsyncData** - Standardized async data fetching
   - Before: Scattered useState/useEffect patterns for data fetching
   - After: Single hook with consistent loading/error handling
   - Benefits: Memory leak prevention, consistent UX, less boilerplate

3. **LocationSelector** - Reusable location picker
   - Before: Custom select implementations across forms
   - After: Single component with search and filtering
   - Benefits: Consistent UX, maintained in one place

### Anti-patterns to Avoid

❌ **Duplicating form logic across pages**
```javascript
// Bad - form logic duplicated
function CreatePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // ... form handling logic
}

function EditPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // ... same form handling logic (duplicated!)
}
```

✅ **Use shared form component**
```javascript
// Good - shared component
function ArticleForm({ initialData, onSubmit }) {
  // Form logic in one place
}

function CreatePage() {
  return <ArticleForm onSubmit={handleCreate} />;
}

function EditPage() {
  return <ArticleForm initialData={article} onSubmit={handleUpdate} />;
}
```

❌ **Inline data fetching without error handling**
```javascript
// Bad
useEffect(() => {
  fetch('/api/articles').then(res => res.json()).then(setArticles);
}, []);
```

✅ **Use useAsyncData hook**
```javascript
// Good
const { data: articles, loading, error } = useAsyncData(
  () => articleAPI.getAll(),
  []
);
```

❌ **Hardcoded API calls**
```javascript
// Bad
const response = await fetch('/api/articles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

✅ **Use API client abstraction**
```javascript
// Good
const response = await articleAPI.create(data);
```

❌ **Inconsistent loading/error states**
```javascript
// Bad - no loading state, poor error handling
function Component() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    apiCall().then(setData).catch(console.error);
  }, []);
  
  return <div>{data.map(...)}</div>;
}
```

✅ **Consistent loading/error states**
```javascript
// Good - proper states
function Component() {
  const { data, loading, error } = useAsyncData(() => apiCall(), []);
  
  if (loading) return <SkeletonLoader />;
  if (error) return <AlertMessage message={error} />;
  
  return <div>{data.map(...)}</div>;
}
```

---

## Section 5: API Integration Patterns

### Always Use the API Client Abstraction

**✅ Good - Use lib/api.js:**
```javascript
import { articleAPI, authAPI, locationAPI } from '@/lib/api';

// Fetch articles
const articles = await articleAPI.getAll({ type: 'news', page: 1 });

// Create article
const newArticle = await articleAPI.create(articleData);

// Authentication
await authAPI.login(email, password);
```

**❌ Bad - Direct fetch calls:**
```javascript
// Don't do this!
const response = await fetch('/api/articles');
const data = await response.json();
```

### API Client Pattern

The API client in `lib/api.js` provides:
- **Centralized configuration** - Base URL, headers
- **Automatic CSRF token injection** - Security built-in
- **Consistent error handling** - Standardized error responses
- **Response transformation** - Unwraps data from responses
- **Authentication headers** - Automatic token inclusion

### Available API Modules

#### authAPI
```javascript
authAPI.register(userData)
authAPI.login(email, password)
authAPI.logout()
authAPI.getProfile()
authAPI.updateProfile(updates)
authAPI.updatePassword(currentPassword, newPassword)
```

#### articleAPI
```javascript
articleAPI.getAll(params) // { type, category, page, limit, locationId }
articleAPI.getById(id)
articleAPI.create(articleData)
articleAPI.update(id, updates)
articleAPI.delete(id)
articleAPI.approveNews(id) // Admin only
```

#### locationAPI
```javascript
locationAPI.getAll(params) // { type, parentId, search }
locationAPI.getById(id)
locationAPI.create(locationData)
locationAPI.update(id, updates)
locationAPI.delete(id)
locationAPI.search(query)
```

#### adminAPI
```javascript
adminAPI.getUsers(params)
adminAPI.updateUserRole(userId, role)
adminAPI.deleteUser(userId)
```

### Error Handling Pattern

```javascript
'use client';
import { useState } from 'react';
import { articleAPI } from '@/lib/api';
import AlertMessage from '@/components/AlertMessage';

export default function MyComponent() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await articleAPI.create(data);
      
      // Handle success
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <AlertMessage message={error} tone="error" />}
      {/* Rest of component */}
    </div>
  );
}
```

---

## Section 6: Testing Patterns

### Test File Locations
```
__tests__/
├── components/          # Component tests
│   ├── ArticleCard.test.js
│   ├── ConfirmDialog.test.js
│   └── ...
├── hooks/              # Hook tests
│   ├── useAsyncData.test.js
│   └── useFilters.test.js
├── api/                # API integration tests
│   └── api.test.js
├── security/           # Security tests
│   ├── csrf.test.js
│   └── oauth.test.js
└── migrations/         # Migration tests
```

### Testing Requirements

**All new endpoints must have tests that cover:**
- ✅ Successful requests with valid data
- ✅ Authentication/authorization checks
- ✅ Validation errors with invalid data
- ✅ Edge cases and boundary conditions
- ✅ Error handling

**Component tests should verify:**
- ✅ Rendering with different props
- ✅ User interactions
- ✅ State changes
- ✅ Error states

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- ArticleCard.test.js

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Test Example Pattern

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Articles API', () => {
  describe('GET /api/articles', () => {
    it('should return articles list', async () => {
      const response = await request(app)
        .get('/api/articles')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({ title: 'Test' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## Section 7: Security Checklist

Every new feature must adhere to these security requirements:

### Authentication & Authorization
✅ Use `authMiddleware` for protected routes
✅ Use `checkRole(['admin'])` for admin-only routes
✅ Use `optionalAuthMiddleware` for public routes that benefit from auth context
✅ Verify resource ownership before modifications
✅ Never expose user passwords or sensitive tokens

### Input Validation
✅ Validate all user input on the backend
✅ Sanitize inputs to prevent injection attacks
✅ Use parameterized queries (Sequelize handles this)
✅ Validate file uploads (type, size, content)
✅ Implement proper error messages (don't leak system info)

### CSRF Protection
✅ Use `csrfProtection` middleware on all mutation endpoints (POST, PUT, DELETE)
✅ Frontend automatically includes CSRF token from API client
✅ Never disable CSRF protection without security review

### Rate Limiting
✅ Use appropriate rate limiters:
  - `authLimiter` (5 req/15min) - Login, registration
  - `createLimiter` (20 req/15min) - Create operations
  - `apiLimiter` (100 req/15min) - General API calls
✅ Implement stricter limits for sensitive operations
✅ Consider user-specific rate limits for high-value targets

### Data Protection
✅ Never log sensitive data (passwords, tokens, personal info)
✅ Use HTTPS in production (configured in deployment)
✅ Implement proper session management
✅ Hash passwords with bcrypt (already implemented)
✅ Use HttpOnly cookies for JWT tokens

### Error Handling
✅ Don't expose stack traces in production
✅ Use generic error messages for auth failures
✅ Log detailed errors server-side for debugging
✅ Return consistent error response format

**For comprehensive security guidelines, see:** `doc/SECURITY.md`

---

## Section 8: Performance Best Practices

### Frontend Performance

**Data Fetching:**
```javascript
// ✅ Use useAsyncData for automatic cleanup
const { data, loading, error } = useAsyncData(
  () => articleAPI.getAll(),
  []
);

// ❌ Avoid manual useEffect with fetch (memory leaks)
useEffect(() => {
  fetch('/api/articles').then(res => res.json()).then(setData);
}, []);
```

**Loading States:**
- ✅ Show loading states immediately with `<SkeletonLoader />`
- ✅ Use skeleton screens for better perceived performance
- ✅ Implement optimistic UI updates where appropriate
- ✅ Cache data when appropriate to avoid redundant requests

**Pagination:**
```javascript
// ✅ Implement pagination for large lists
const { data, loading } = useAsyncData(
  () => articleAPI.getAll({ page, limit: 20 }),
  [page]
);

// Use Pagination component
<Pagination 
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

**Component Optimization:**
- ✅ Use React.memo for expensive components that don't change often
- ✅ Avoid inline function definitions in render (use useCallback)
- ✅ Lazy load heavy components with dynamic imports
- ✅ Minimize bundle size by importing only what you need

### Backend Performance

**Database Queries:**
```javascript
// ✅ Use indexes for frequently queried fields
// Already configured in models

// ✅ Implement eager loading to avoid N+1 queries
const articles = await Article.findAll({
  include: [
    { model: User, as: 'creator' },
    { model: Location, through: 'article_locations' }
  ]
});

// ❌ Avoid N+1 queries
const articles = await Article.findAll();
for (let article of articles) {
  article.creator = await User.findByPk(article.userId); // N+1!
}
```

**Pagination:**
```javascript
// ✅ Always paginate large result sets
const limit = parseInt(req.query.limit) || 20;
const page = parseInt(req.query.page) || 1;
const offset = (page - 1) * limit;

const { count, rows } = await Model.findAndCountAll({
  limit,
  offset,
  order: [['createdAt', 'DESC']]
});
```

**Connection Pooling:**
- ✅ Already configured in Sequelize
- ✅ Reuse database connections
- ✅ Monitor connection pool usage

**Caching Strategies:**
- ✅ Consider caching frequently accessed, rarely changed data
- ✅ Use appropriate cache invalidation strategies
- ✅ Implement at application layer when needed

---

## Section 9: Accessibility Requirements

All new components must meet these accessibility standards:

### Semantic HTML
✅ Use semantic elements:
```javascript
// ✅ Good
<article>
  <header>
    <h1>Article Title</h1>
  </header>
  <nav>...</nav>
  <main>...</main>
  <footer>...</footer>
</article>

// ❌ Bad
<div class="article">
  <div class="header">
    <div class="title">Article Title</div>
  </div>
</div>
```

### ARIA Labels
✅ Include ARIA labels for icon buttons and interactive elements:
```javascript
<button 
  onClick={handleDelete}
  aria-label="Delete article"
  title="Delete article"
>
  <TrashIcon />
</button>
```

### Keyboard Navigation
✅ All interactive elements must be keyboard accessible
✅ Maintain logical tab order
✅ Provide visible focus indicators
✅ Support standard keyboard shortcuts (Esc to close modals, etc.)

### Color Contrast
✅ Maintain minimum 4.5:1 contrast ratio for text
✅ Don't rely solely on color to convey information
✅ Test with color blindness simulators

### Loading & Error Announcements
✅ Use aria-live regions for dynamic content:
```javascript
<div role="status" aria-live="polite">
  {loading && 'Loading articles...'}
  {error && `Error: ${error}`}
</div>
```

### Form Accessibility
✅ Associate labels with inputs:
```javascript
<label htmlFor="title">Article Title</label>
<input 
  id="title"
  name="title"
  aria-required="true"
  aria-invalid={!!errors.title}
/>
{errors.title && (
  <span id="title-error" role="alert">
    {errors.title}
  </span>
)}
```

---

## Section 10: File Organization

### Backend Structure
```
src/
├── controllers/         # Business logic
│   ├── articleController.js
│   ├── authController.js
│   ├── locationController.js
│   └── adminController.js
│
├── models/              # Database models (Sequelize)
│   ├── index.js         # Model loader
│   ├── Article.js
│   ├── User.js
│   ├── Location.js
│   └── LocationLink.js
│
├── routes/              # Route definitions
│   ├── articles.js
│   ├── auth.js
│   ├── locations.js
│   └── admin.js
│
├── middleware/          # Reusable middleware
│   ├── auth.js          # JWT authentication
│   ├── csrfProtection.js
│   ├── checkRole.js     # Role-based access
│   ├── rateLimiter.js
│   └── optionalAuth.js
│
├── utils/               # Helper functions
│   └── ...
│
├── migrations/          # Database migrations
│   └── YYYYMMDDHHMMSS-migration-name.js
│
├── config/              # Server configuration
│   ├── database.js
│   └── securityHeaders.js
│
├── app.js               # Express app setup
└── server.js            # Server entry point
```

### Frontend Structure
```
app/                     # Pages (Next.js App Router)
├── page.js              # Home page (/)
├── layout.js            # Root layout
├── articles/
│   ├── page.js          # Articles list (/articles)
│   ├── [id]/
│   │   └── page.js      # Article detail (/articles/:id)
│   ├── create/
│   │   └── page.js      # Create article (/articles/create)
│   └── edit/
│       └── [id]/
│           └── page.js  # Edit article (/articles/edit/:id)
├── admin/
│   ├── page.js          # Admin dashboard
│   ├── users/
│   └── locations/
└── auth/
    ├── login/
    └── register/

components/              # Reusable UI components
├── ArticleCard.js
├── AlertMessage.js
├── EmptyState.js
├── SkeletonLoader.js
├── LocationSelector.js
├── ProtectedRoute.js
├── Pagination.js
├── AdminTable.js
└── ...

lib/                     # Utilities and shared code
├── api.js               # API client (CRITICAL - use for all API calls)
├── auth-context.js      # Authentication context provider
├── utils/
│   └── articleTypes.js  # Article type utilities
└── analytics/
    └── google-analytics.js

hooks/                   # Custom React hooks
├── useAsyncData.js      # Async data fetching
└── useFilters.js        # Filter state management

config/                  # Configuration files
├── articleCategories.json  # Article type configurations
└── ...

public/                  # Static assets
├── images/
└── ...

__tests__/               # Tests
├── components/
├── hooks/
├── api/
└── ...
```

### Naming Conventions

**Files:**
- Components: PascalCase (e.g., `ArticleCard.js`)
- Hooks: camelCase with 'use' prefix (e.g., `useAsyncData.js`)
- Utilities: camelCase (e.g., `articleTypes.js`)
- API routes: kebab-case (e.g., `article-routes.js`)

**Variables and Functions:**
- camelCase for variables and functions
- PascalCase for React components
- UPPER_SNAKE_CASE for constants

---

## Section 11: Common Workflows

### Adding a New Page

1. **Create page file** in `app/[route]/page.js`:
```javascript
'use client';
import useAsyncData from '@/hooks/useAsyncData';
import { articleAPI } from '@/lib/api';
import SkeletonLoader from '@/components/SkeletonLoader';
import AlertMessage from '@/components/AlertMessage';

export default function MyPage() {
  const { data, loading, error } = useAsyncData(
    () => articleAPI.getAll(),
    []
  );

  if (loading) return <SkeletonLoader count={5} variant="grid" />;
  if (error) return <AlertMessage message={error} tone="error" />;

  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

2. **Add to navigation** (if needed) in layout or navigation component

3. **Test all states:**
   - Loading state displays correctly
   - Error state handles failures gracefully
   - Success state displays data properly

### Adding a New API Endpoint

1. **Define route** in `src/routes/`:
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/myController');
const { authMiddleware } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrfProtection');
const { createLimiter } = require('../middleware/rateLimiter');

router.post('/',
  createLimiter,
  authMiddleware,
  csrfProtection,
  controller.create
);

module.exports = router;
```

2. **Create controller** in `src/controllers/`:
```javascript
exports.create = async (req, res) => {
  try {
    const { field1, field2 } = req.body;
    
    // Validation
    if (!field1) {
      return res.status(400).json({
        success: false,
        message: 'Field1 is required'
      });
    }
    
    // Business logic
    const result = await Model.create({ field1, field2 });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

3. **Add to API client** in `lib/api.js`:
```javascript
export const myAPI = {
  create: (data) => apiRequest('/api/my-endpoint', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
```

4. **Write tests** in `__tests__/`:
```javascript
describe('My API', () => {
  it('should create resource', async () => {
    const response = await request(app)
      .post('/api/my-endpoint')
      .send({ field1: 'value' })
      .expect(201);
    
    expect(response.body.success).toBe(true);
  });
});
```

5. **Update API documentation** if applicable

### Creating a Reusable Component

1. **Identify duplicate pattern** across pages

2. **Extract to** `components/ComponentName.js`:
```javascript
export default function ComponentName({ 
  prop1, 
  prop2, 
  onAction 
}) {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
}
```

3. **Define clear props interface** with PropTypes or TypeScript

4. **Document usage** with JSDoc or comments:
```javascript
/**
 * ComponentName - Description of what it does
 * 
 * @param {string} prop1 - Description
 * @param {function} onAction - Callback when action occurs
 */
```

5. **Update consuming components** to use the new reusable component

### Adding a Custom Hook

1. **Create hook file** in `hooks/useMyHook.js`:
```javascript
import { useState, useEffect } from 'react';

export default function useMyHook(param) {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Hook logic
  }, [param]);
  
  return state;
}
```

2. **Write tests** for the hook

3. **Document usage** with examples

---

## Section 12: Key Features Architecture

### Locations Feature

**Hierarchical Structure:**
- Country → Prefecture → Municipality
- Parent-child relationships in database
- Polymorphic links to articles and users

**Key Files:**
- `src/models/Location.js` - Location model
- `src/models/LocationLink.js` - Polymorphic relationship model
- `components/LocationSelector.js` - Location picker UI
- `lib/api.js` - locationAPI methods

**Usage:**
```javascript
// Get locations by type
const municipalities = await locationAPI.getAll({ type: 'municipality' });

// Get children of a location
const prefectures = await locationAPI.getAll({ parentId: countryId });

// Link location to article
await articleAPI.update(articleId, {
  locationIds: [locationId1, locationId2]
});
```

**Documentation:** See `doc/LOCATIONS_ARCHITECTURE.md` for detailed implementation

### Article System

**Article Types:**
- **personal** - Private articles, only visible to creator
- **articles** - Educational content, publicly visible
- **news** - News articles, requires approval

**Article Status:**
- **draft** - Not published, only visible to creator
- **published** - Visible according to article type rules
- **archived** - Hidden from public view

**Categories:**
- Defined in `config/articleCategories.json`
- Different categories per article type
- Bilingual labels (English/Greek)

**Location Linking:**
- Many-to-many relationship with locations
- Articles can be associated with multiple locations
- Useful for geo-specific content

**Key Files:**
- `src/models/Article.js` - Article model
- `src/controllers/articleController.js` - Article business logic
- `components/ArticleCard.js` - Article display component
- `lib/utils/articleTypes.js` - Article type utilities

### Authentication System

**JWT-Based Authentication:**
- HttpOnly cookies for token storage
- Refresh token mechanism
- Token expiration handling

**CSRF Protection:**
- Double-submit cookie pattern
- Required for all mutation operations
- Automatic token handling in API client

**Role-Based Access Control:**
- Roles: `admin`, `editor`, `viewer`
- Middleware: `checkRole(['admin'])`
- Protected routes on frontend with `<ProtectedRoute>`

**Key Files:**
- `src/middleware/auth.js` - JWT verification
- `src/middleware/checkRole.js` - Role checking
- `src/middleware/csrfProtection.js` - CSRF token validation
- `lib/auth-context.js` - Frontend auth context

**Documentation:** See `doc/SECURITY.md` for security details

---

## Section 13: Environment & Configuration

### Required Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=appofa_db
DB_PORT=5432

# Authentication
JWT_SECRET=your_secret_key_minimum_32_characters_long

# Application
NODE_ENV=development  # or production
PORT=3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Security Notes:**
- ⚠️ Never commit `.env` to version control
- ⚠️ Use strong, unique secrets for JWT_SECRET
- ⚠️ Different secrets for development and production
- ⚠️ Rotate secrets periodically

### Configuration Files

**Article Categories** (`config/articleCategories.json`):
```json
{
  "articleTypes": {
    "personal": {
      "value": "personal",
      "label": "Personal",
      "labelEl": "Προσωπικό",
      "categories": []
    },
    "articles": {
      "categories": ["Γενικά", "Λογική", "Μαθηματικά", ...]
    },
    "news": {
      "categories": ["Κόσμος", "Ελλάδα", "Οικονομία", ...]
    }
  }
}
```

**Article Type Utilities** (`lib/utils/articleTypes.js`):
- `getArticleTypes()` - Get all article types
- `getCategories(type)` - Get categories for a specific type
- Helper functions for article type operations

**Database Config** (`config/database.js`):
- PostgreSQL for production
- SQLite for tests
- Connection pooling configured

**Security Headers** (`config/securityHeaders.js`):
- Helmet configuration
- CORS settings
- CSP policies

---

## Common Commands Reference

```bash
# Install dependencies
npm install

# Development
npm run dev              # Start backend API server
npm run frontend         # Start frontend dev server

# Production
npm start                # Start backend in production
npm run frontend:build   # Build frontend for production
npm run frontend:start   # Start frontend in production

# Testing
npm test                 # Run all tests
npm test -- <filename>   # Run specific test

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with initial data
```

---

## AI Workflow Guidance

### Before Making Changes
1. Read relevant documentation in `doc/` directory
2. Understand existing patterns in the codebase
3. Check for reusable components/hooks that already exist
4. Review security implications

### When Making Changes
✅ **DO:**
- Follow existing patterns and conventions
- Use reusable components and hooks
- Use the API client (lib/api.js) for all API calls
- Include proper loading and error states
- Add appropriate middleware (auth, CSRF, rate limiting)
- Write tests for new features
- Update documentation if needed

❌ **DON'T:**
- Add new dependencies unless absolutely necessary
- Duplicate existing logic (check for reusable components first)
- Hardcode API calls (use lib/api.js)
- Skip error handling or loading states
- Bypass security middleware
- Make changes without understanding the impact

### Testing Changes
- Run relevant tests: `npm test -- <test-file>`
- Test all states: loading, error, success
- Verify security measures are in place
- Check accessibility requirements

### Code Review Checklist
- [ ] Follows existing patterns
- [ ] Uses reusable components where appropriate
- [ ] Includes proper error handling
- [ ] Has loading states
- [ ] Includes tests
- [ ] Security measures in place (auth, CSRF, rate limiting)
- [ ] No hardcoded values or secrets
- [ ] Accessible (ARIA labels, semantic HTML, keyboard nav)
- [ ] Documentation updated if needed

---

## Repository Structure Summary
- **Backend**: `src/` (Express routes, controllers, models, middleware)
- **Frontend**: `app/` (pages) + `components/` (reusable UI)
- **Shared**: `lib/` (API client, utilities, contexts)
- **Config**: `config/` (article categories, database, security)
- **Tests**: `__tests__/` (Jest tests)
- **Docs**: `doc/` (comprehensive documentation)

---

## Where to Find It Live
**Production:** http://185.92.192.81
