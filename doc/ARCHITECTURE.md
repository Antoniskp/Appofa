# Application Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│  (Web Browser / Mobile App / Postman / curl)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS Requests
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     API Gateway Layer                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Express.js Application                      │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │         Middleware Stack                         │  │   │
│  │  │  • CORS Handler                                  │  │   │
│  │  │  • Body Parser (JSON/URL-encoded)               │  │   │
│  │  │  • Rate Limiter (express-rate-limit)            │  │   │
│  │  │    - Auth: 5 req/15min                          │  │   │
│  │  │    - Create: 20 req/15min                       │  │   │
│  │  │    - API: 100 req/15min                         │  │   │
│  │  │  • Optional Auth Middleware                      │  │   │
│  │  │  • Auth Middleware (JWT verification)           │  │   │
│  │  │  • Role Check Middleware                        │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │              Route Handlers                      │  │   │
│  │  │                                                   │  │   │
│  │  │  /api/auth/*                                     │  │   │
│  │  │  ├─ POST /register  (Rate Limited)              │  │   │
│  │  │  ├─ POST /login     (Rate Limited)              │  │   │
│  │  │  └─ GET  /profile   (Protected)                 │  │   │
│  │  │                                                   │  │   │
│  │  │  /api/articles/*                                 │  │   │
│  │  │  ├─ GET    /         (Public, Optional Auth)    │  │   │
│  │  │  ├─ GET    /:id      (Public, Optional Auth)    │  │   │
│  │  │  ├─ POST   /         (Protected, Rate Limited)  │  │   │
│  │  │  ├─ PUT    /:id      (Protected, Role-Based)    │  │   │
│  │  │  └─ DELETE /:id      (Protected, Role-Based)    │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Controller Layer
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   Business Logic Layer                           │
│                                                                   │
│  ┌────────────────────────┐    ┌─────────────────────────────┐ │
│  │  Auth Controller       │    │  Article Controller         │ │
│  │  ├─ register()        │    │  ├─ createArticle()        │ │
│  │  ├─ login()           │    │  ├─ getAllArticles()       │ │
│  │  └─ getProfile()      │    │  ├─ getArticleById()       │ │
│  │                        │    │  ├─ updateArticle()        │ │
│  │  Security:             │    │  └─ deleteArticle()        │ │
│  │  • Password hashing    │    │                             │ │
│  │  • JWT generation      │    │  Authorization:             │ │
│  │  • Input validation    │    │  • Admin: All operations    │ │
│  └────────────────────────┘    │  • Editor: Create/Edit all  │ │
│                                 │  • Viewer: Create/Edit own  │ │
│                                 └─────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ ORM Layer (Sequelize)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Data Models Layer                           │
│                                                                   │
│  ┌────────────────────┐          ┌──────────────────────────┐  │
│  │    User Model      │          │    Article Model         │  │
│  │                    │          │                          │  │
│  │  Fields:           │          │  Fields:                 │  │
│  │  • id              │◄─────────┤  • id                    │  │
│  │  • username        │  1:N     │  • title                 │  │
│  │  • email           │  Author  │  • content               │  │
│  │  • password        │          │  • summary               │  │
│  │  • role            │          │  • authorId (FK)         │  │
│  │  • firstName       │          │  • status                │  │
│  │  • lastName        │          │  • publishedAt           │  │
│  │  • createdAt       │          │  • category              │  │
│  │  • updatedAt       │          │  • createdAt             │  │
│  │                    │          │  • updatedAt             │  │
│  │  Hooks:            │          │                          │  │
│  │  • beforeCreate    │          │  Validations:            │  │
│  │  • beforeUpdate    │          │  • Title length: 5-200   │  │
│  │  (Hash password)   │          │  • Content: 10-50000     │  │
│  └────────────────────┘          └──────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Database Driver (pg)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   PostgreSQL Database                            │
│                                                                   │
│  Tables:                                                         │
│  • Users                                                         │
│  • Articles                                                      │
│                                                                   │
│  Features:                                                       │
│  • ACID Compliance                                              │
│  • Referential Integrity                                        │
│  • Connection Pooling (5 connections)                           │
│  • Transaction Support                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Registration Flow
```
Client Request
    │
    ├─> Rate Limiter (5 req/15min)
    │
    ├─> Auth Controller.register()
    │   ├─> Validate input
    │   ├─> Check for existing user
    │   ├─> User Model (bcrypt hash password)
    │   ├─> Save to database
    │   └─> Generate JWT token
    │
    └─> Response with token + user data
```

### 2. Article Creation Flow (Authenticated)
```
Client Request + JWT Token
    │
    ├─> Rate Limiter (20 req/15min for create)
    │
    ├─> Auth Middleware
    │   ├─> Verify JWT token
    │   └─> Attach user to request
    │
    ├─> Article Controller.createArticle()
    │   ├─> Validate input
    │   ├─> Create article with authorId
    │   └─> Save to database
    │
    └─> Response with article data + author info
```

### 3. Article Update Flow (Role-Based)
```
Client Request + JWT Token
    │
    ├─> Rate Limiter (100 req/15min)
    │
    ├─> Auth Middleware
    │   ├─> Verify JWT token
    │   └─> Attach user to request
    │
    ├─> Article Controller.updateArticle()
    │   ├─> Find article by ID
    │   ├─> Check permissions:
    │   │   • Author can edit own
    │   │   • Admin/Editor can edit all
    │   ├─> Update article
    │   └─> Save changes
    │
    └─> Response with updated article
```

## Security Layers

```
┌─────────────────────────────────────────────────┐
│         Layer 1: Network Security               │
│  • CORS Configuration                           │
│  • HTTPS (in production)                        │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Layer 2: Rate Limiting                  │
│  • IP-based request throttling                  │
│  • Different limits per endpoint type           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Layer 3: Authentication                 │
│  • JWT token verification                       │
│  • Token expiration (24h)                       │
│  • Secure password hashing (bcrypt)            │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Layer 4: Authorization                  │
│  • Role-based access control                    │
│  • Resource ownership verification              │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Layer 5: Input Validation               │
│  • Sequelize model validation                   │
│  • Type checking                                │
│  • Length constraints                           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Layer 6: Database Security              │
│  • SQL injection prevention (ORM)               │
│  • Parameterized queries                        │
│  • Connection pooling                           │
└─────────────────────────────────────────────────┘
```

## Deployment Architecture

### Docker Deployment
```
┌────────────────────────────────────────────────┐
│              Docker Host                        │
│                                                 │
│  ┌──────────────────┐   ┌──────────────────┐  │
│  │  newsapp-api     │   │  newsapp-db      │  │
│  │  (Node.js App)   │   │  (PostgreSQL)    │  │
│  │                  │   │                  │  │
│  │  Port: 3000     │◄──┤  Port: 5432     │  │
│  │                  │   │                  │  │
│  │  Environment:    │   │  Volume:         │  │
│  │  • DB_HOST       │   │  • postgres_data │  │
│  │  • JWT_SECRET    │   │                  │  │
│  └──────────────────┘   └──────────────────┘  │
│         │                                       │
│         │ docker network                        │
└─────────┼───────────────────────────────────────┘
          │
          │ Port Mapping (3000:3000)
          │
     ┌────▼────┐
     │  Client │
     └─────────┘
```

## Technology Stack Map

```
┌─────────────────────────────────────────────────┐
│            Frontend (Not Included)              │
│  Suggested: React/Vue/Angular                   │
└────────────────┬────────────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────────────┐
│              Backend (Node.js)                  │
│                                                 │
│  Runtime:      Express Framework                │
│  • express         Web framework                │
│  • cors            CORS handling                │
│  • dotenv          Environment config           │
│                                                 │
│  Security:     Authentication & Protection      │
│  • jsonwebtoken    JWT handling                 │
│  • bcryptjs        Password hashing             │
│  • express-rate-   Request throttling           │
│    limit                                        │
│                                                 │
│  Database:     PostgreSQL Integration           │
│  • sequelize       ORM                          │
│  • pg              PostgreSQL driver            │
│  • pg-hstore       PostgreSQL data types        │
│                                                 │
│  Testing:      Test Framework                   │
│  • jest            Test runner                  │
│  • supertest       HTTP testing                 │
│                                                 │
│  Development:  Dev Tools                        │
│  • nodemon         Auto-restart                 │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           Database (PostgreSQL)                 │
│  • Version: 15+                                 │
│  • Connection Pool: 5 connections               │
│  • Features: ACID, Foreign Keys, Indexes        │
└─────────────────────────────────────────────────┘
```

## File Structure

```
appofasiv8/
│
├── src/                          # Source code
│   ├── config/                   # Configuration files
│   │   └── database.js          # Database connection
│   │
│   ├── models/                   # Data models
│   │   ├── User.js              # User model with password hashing
│   │   ├── Article.js           # Article model
│   │   └── index.js             # Model associations
│   │
│   ├── controllers/              # Business logic
│   │   ├── authController.js    # Auth operations
│   │   └── articleController.js # Article operations
│   │
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js              # JWT authentication
│   │   ├── optionalAuth.js      # Optional authentication
│   │   ├── checkRole.js         # Role verification
│   │   └── rateLimiter.js       # Rate limiting configs
│   │
│   ├── routes/                   # Route definitions
│   │   ├── authRoutes.js        # Auth endpoints
│   │   └── articleRoutes.js     # Article endpoints
│   │
│   └── index.js                  # App entry point
│
├── __tests__/                    # Test files
│   └── app.test.js              # Integration tests
│
├── doc/                         # Project docs
│   ├── API_TESTING.md           # API testing guide
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── SECURITY.md              # Security documentation
│   ├── PROJECT_SUMMARY.md       # Project overview
│   ├── VPS_DEPLOYMENT.md        # VPS deployment guide
│   └── ARCHITECTURE.md          # This file
│
├── Configuration/                # Config files
│   ├── .env.example             # Environment template
│   ├── .gitignore               # Git ignore rules
│   ├── .dockerignore            # Docker ignore rules
│   ├── package.json             # Dependencies
│   ├── jest.config.js           # Test configuration
│   ├── Dockerfile               # Docker image
│   └── docker-compose.yml       # Docker compose
│
├── Scripts/                      # Helper scripts
│   ├── setup-db.sh              # Database setup
│   └── test-api.sh              # API testing
│
└── Tools/                        # Development tools
    └── postman_collection.json  # Postman API collection
```

---

**Note**: This architecture is designed to be:
- **Scalable**: Easy to add new features or scale horizontally
- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple security layers
- **Testable**: Comprehensive test coverage
- **Deployable**: Docker support and deployment guides
