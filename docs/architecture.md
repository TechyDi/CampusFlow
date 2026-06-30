# CampusFlow Architecture (Post Phase 2C)

## Overview
The application is currently transitioning from a monolithic MVC pattern to a modular, service-oriented architecture (n-tier architecture). We have successfully laid the foundation for isolated layers.

## Current Layers

### 1. Router Layer (`src/routes/`)
- Handles incoming HTTP requests and directs them to the appropriate controllers.
- Separated into `/api` (JSON responses) and `/views` (EJS pages) domains.
- Middleware (like `authMiddleware` and `requestLogger`) attaches at this level.

### 2. Controller Layer (`src/controllers/`)
- **Current State:** Fat controllers handling req/res mapping, business logic, and Prisma database queries.
- **Future State:** Will be strictly responsible for extracting data from `req` (body, params, query), passing it to the Service layer, and formatting the output into `res`.

### 3. Service Layer (`src/services/`)
- **Current State:** Architecture foundation built. Stubs exist for distinct domains (Auth, User, Complaint, etc.).
- **Responsibility:** The heart of the application. Enforces business rules, executes domain logic, and coordinates multiple Repository calls. 
- **Coordination:** It assumes data is already validated (via Joi), logs major business events (via Winston), and throws operational errors (`AppError`) to be caught globally.

### 4. Repository Layer (`src/repositories/`)
- **Current State:** Architecture foundation built. Stubs exist for distinct domains.
- **Responsibility:** Abstracts away Prisma queries. The Service layer calls methods like `UserRepository.findUserById()` without knowing if the data comes from SQLite, PostgreSQL, or a cache.

### 5. Database
- SQLite database using Prisma ORM. Will be migrated to PostgreSQL in Phase 4.

## Frontend
- Server-side rendered EJS templates combined with Tailwind CSS via CDN.
- Static assets and local file storage managed via Multer.