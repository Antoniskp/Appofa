# News Application

A professional news application with JWT authentication, PostgreSQL database, role-based access control, and a modern Next.js frontend.

## Features

- **Professional Authentication**: JWT-based authentication system with secure password hashing
- **User Roles**: Four-tier role system (Admin, Moderator, Editor, Viewer)
- **PostgreSQL Database**: Robust data persistence with Sequelize ORM
- **News Management**: Complete CRUD operations for news articles
- **News Submission & Moderation Workflow**: Users can flag articles as news; moderators/admins approve them for publication
- **Role-Based Access Control**: Different permissions based on user roles
- **Modern Frontend**: Next.js 13+ with App Router, React, and Tailwind CSS

## User Roles

1. **Admin**: Full access - can create, read, update, and delete all articles; can approve news submissions
2. **Moderator**: Can approve news submissions and manage content - similar to admin for news moderation
3. **Editor**: Can create articles and edit/update all articles
4. **Viewer**: Can only read published articles and create their own articles

## News Submission and Moderation Workflow

The application includes a comprehensive news workflow that allows users to submit articles as news and moderators/admins to approve them:

### For Article Authors
1. **Create/Edit Articles**: Any authenticated user can create articles
2. **Flag as News**: When creating or editing an article, check the "Flag as news" checkbox to submit it for news consideration
3. **Ownership**: Users can only edit or delete their own articles (admins can edit/delete all)

### For Moderators/Admins
1. **Review Pending News**: Access the Admin Dashboard to see articles flagged as news with "Pending" status
2. **Approve News**: Click the "Approve" button to approve a news submission
3. **Automatic Publication**: Upon approval, the article is automatically published with `newsApprovedAt` timestamp and status set to "published"

### Technical Details
- **isNews**: Boolean flag that users set on their articles
- **newsApprovedAt**: Timestamp set when a moderator/admin approves the news
- **newsApprovedBy**: ID of the moderator/admin who approved the news
- Articles flagged as news but not yet approved show as "Pending News" in the dashboard
- Only moderators and admins can approve news submissions via the `/api/articles/:id/approve-news` endpoint

## Technology Stack

### Backend
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs for password hashing
- **CORS**: Enabled for cross-origin requests

### Frontend
- **Framework**: Next.js 13+ with App Router
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **API Communication**: Fetch API with custom client

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Antoniskp/appofasiv8.git
cd appofasiv8
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```bash
# Create a new database
createdb newsapp
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newsapp
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3000
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

5. Start the backend server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend API server will start on `http://localhost:3000`

6. Start the frontend (in a separate terminal):
```bash
# Development mode
npm run frontend

# Production build
npm run frontend:build
npm run frontend:start
```

The frontend application will start on `http://localhost:3001`

## Frontend Structure

The Next.js frontend is organized using the App Router structure:

```
app/
├── layout.js              # Root layout with navigation
├── page.js                # Home page with latest news
├── articles/
│   ├── page.js            # Articles list page
│   └── [id]/
│       └── page.js        # Article detail page
├── login/
│   └── page.js            # Login page
├── register/
│   └── page.js            # Registration page
├── admin/
│   └── page.js            # Admin dashboard (protected)
└── editor/
    └── page.js            # Editor dashboard (protected)

components/
├── TopNav.js              # Top navigation menu
├── Footer.js              # Footer menu
└── ProtectedRoute.js      # Route protection wrapper

lib/
├── api.js                 # API client and utilities
└── auth-context.js        # Authentication context provider
```

## Frontend Pages

### Public Pages
- **Home (/)**: Landing page with hero section and latest news articles
- **Articles (/articles)**: Browse all published articles with filters and pagination
- **Article Detail (/articles/[id])**: View full article with author info
- **Login (/login)**: User authentication page
- **Register (/register)**: New user registration

### Protected Pages (Require Authentication)
- **Admin Dashboard (/admin)**: Admin/Moderator dashboard with full article management and news approval
- **Editor Dashboard (/editor)**: Editor/Admin dashboard for creating and managing articles with news flagging

## Role-Based Access

The frontend implements client-side route protection:

- **Public Routes**: /, /articles, /articles/[id], /login, /register
- **Editor Routes**: /editor (requires editor or admin role)
- **Admin Routes**: /admin (requires admin or moderator role)

Unauthorized users are automatically redirected to the login page.

## Environment Variables

### Frontend Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000)

The `NEXT_PUBLIC_` prefix makes the variable accessible in the browser.

## API Documentation

### Authentication Endpoints

#### Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "viewer",  // Optional: admin, editor, or viewer (default: viewer)
  "firstName": "John",  // Optional
  "lastName": "Doe"     // Optional
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "viewer",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "viewer"
    }
  }
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer jwt_token_here
```

### Article Endpoints

#### Create Article (Authenticated)
```http
POST /api/articles
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Breaking News Title",
  "content": "Full article content goes here...",
  "summary": "Brief summary of the article",  // Optional
  "category": "Technology",  // Optional
  "status": "published",  // Optional: draft, published, or archived (default: draft)
  "isNews": true  // Optional: flag article as news submission (default: false)
}
```

#### Get All Articles
```http
GET /api/articles?status=published&category=Technology&page=1&limit=10
```

Query Parameters:
- `status`: Filter by status (draft, published, archived)
- `category`: Filter by category
- `page`: Page number for pagination (default: 1)
- `limit`: Items per page (default: 10)

#### Get Single Article
```http
GET /api/articles/:id
```

#### Update Article (Authenticated)
```http
PUT /api/articles/:id
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "status": "published",
  "isNews": true  // Optional: flag/unflag as news
}
```

**Permissions**: Author can update their own articles; admin and editor can update all articles.

#### Delete Article (Authenticated)
```http
DELETE /api/articles/:id
Authorization: Bearer jwt_token_here
```

**Permissions**: Author can delete their own articles; admin can delete all articles.

#### Approve News (Moderator/Admin only)
```http
POST /api/articles/:id/approve-news
Authorization: Bearer jwt_token_here
```

**Description**: Approves an article flagged as news, sets newsApprovedAt and newsApprovedBy, and publishes the article.

**Permissions**: Only moderators and admins can approve news submissions.

**Requirements**: Article must have isNews set to true.

## Database Schema

### Users Table
- `id`: Integer, Primary Key, Auto Increment
- `username`: String, Unique, Required
- `email`: String, Unique, Required
- `password`: String, Hashed, Required
- `role`: Enum (admin, moderator, editor, viewer), Default: viewer
- `firstName`: String, Optional
- `lastName`: String, Optional
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Articles Table
- `id`: Integer, Primary Key, Auto Increment
- `title`: String, Required
- `content`: Text, Required
- `summary`: String, Optional
- `authorId`: Integer, Foreign Key to Users
- `status`: Enum (draft, published, archived), Default: draft
- `publishedAt`: Date, Optional
- `category`: String, Optional
- `isNews`: Boolean, Default: false (user-set flag for news submissions)
- `newsApprovedAt`: Date, Optional (set when moderator/admin approves)
- `newsApprovedBy`: Integer, Foreign Key to Users (moderator/admin who approved)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Authorization**: Access control based on user roles
4. **SQL Injection Protection**: Sequelize ORM provides parameterized queries
5. **Input Validation**: Server-side validation for all user inputs

## Project Structure

```
appofasiv8/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── articleController.js # Article CRUD operations
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── checkRole.js         # Role-based authorization
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Article.js           # Article model
│   │   └── index.js             # Model associations
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   └── articleRoutes.js     # Article routes
│   └── index.js                 # Application entry point
├── .env.example                 # Environment variables template
├── .gitignore
├── doc/                         # Additional documentation
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Run API tests (uses in-memory SQLite in test mode)
NODE_ENV=test npm test

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## License

ISC

## Author

Antoniskp
