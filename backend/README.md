# Secure Notes REST API (Backend Service)

> Standalone Backend Service with RBAC, MongoDB Indexing & Aggregations, and Vercel Deployment.

---

## 1. Overview
This is the independent REST API backend for the **Secure Note-Taking Application**. It is designed to be completely decoupled from the frontend, capable of running independently and deploying to Vercel Serverless Functions with automated GitHub Actions CI/CD.

### Key Objectives
- **Secure Authentication & RBAC**: JWT Bearer token authentication with bcrypt password hashing; granular roles (`user` and `admin`).
- **Database Optimization**: Deliberate, minimal, and efficient MongoDB indexes using Mongoose `schema.index()` adhering strictly to ESR principles. Zero redundant indexes.
- **Aggregation Pipelines**:
  1. *Group by Interests*: Single-pipeline `$unwind` + `$group` aggregation with index support.
  2. *User Posts ($lookup)*: Single-pipeline `$lookup` relational aggregation.
- **Serverless-Ready Architecture**: Stateless Express application optimized for Vercel with Mongoose connection pooling and caching.
- **In-Memory Local Mode**: If no external MongoDB URI is provided, it automatically boots an in-memory MongoDB instance pre-seeded with sample user and admin accounts for immediate testing.

---

## 2. Environment Configuration
Create a `.env` file in the `backend/` root:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Optional: MongoDB Atlas Connection String
# If left empty or commented out, it automatically boots a local in-memory DB with demo data!
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/secure_notes?retryWrites=true&w=majority
```

---

## 3. Quick Start

### Installation
```bash
npm install
```

### Run Locally
```bash
npm run dev
# or
npm start
```
The server will start on `http://localhost:5000`.

### Pre-Seeded Demo Accounts (In-Memory Mode)
When running without external MongoDB, sample accounts are pre-seeded:
- **Standard User:** `user@example.com` / `password123`
- **Admin User:** `admin@example.com` / `adminpassword123`

---

## 4. Run Automated Test Suite
```bash
npm test
```
Executes all 13 unit, RBAC, indexing, and aggregation pipeline tests using Node's native test runner and an in-memory MongoDB instance.

---

## 5. API Endpoints

### Public & Health
- `GET /` - Service status & endpoint directory
- `GET /api/health` - API health check

### Authentication
- `POST /api/auth/register` - Register new user account (`name`, `email`, `password`, `interests`)
- `POST /api/auth/login` - Authenticate & obtain JWT
- `GET /api/auth/profile` - Current user profile (Protected)

### Notes Management
- `GET /api/notes?page=1&limit=10` - List user's notes (Paginated, ESR indexed)
- `POST /api/notes` - Create note (`title`, `content`)
- `GET /api/notes/:id` - Get specific note (Owner or Admin)
- `PUT /api/notes/:id` - Update note (Owner only)
- `DELETE /api/notes/:id` - Delete note (Owner only)

### Public Posts
- `GET /api/posts?page=1&limit=10` - List community posts (Paginated)
- `POST /api/posts` - Create post (Protected)

### Aggregations
- `GET /api/aggregations/users-by-interest` - Scenario 1: Group users by interests
- `GET /api/aggregations/users/:userId/posts` - Scenario 2: User posts via `$lookup`

### Admin Console (Admin Role Only)
- `GET /api/admin/users?page=1&limit=10` - List all users
- `POST /api/admin/users` - Provision user with role
- `PUT /api/admin/users/:id` - Update user or role
- `DELETE /api/admin/users/:id` - Delete user and cascade their notes
- `GET /api/admin/notes?page=1&limit=10` - View everyone's notes

---

## 6. Vercel Deployment
Deploy this backend service directly to Vercel:
```bash
vercel --prod
```
The included `vercel.json` and `api/index.js` route all incoming API requests to the serverless Express handler.
