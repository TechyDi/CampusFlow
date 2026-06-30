# CampusFlow Architecture (Post Phase 1B)

## Overview
The application is currently transitioning from a monolithic MVC pattern to a modular, service-oriented architecture. 

## Current State
- **Router**: Monolithic src/routes/index.js handling both API and View routes.
- **Controllers**: Fat controllers handling req/res mapping, business logic, and Prisma database queries.
- **Database**: SQLite database using Prisma ORM.
- **Frontend**: Server-side rendered EJS templates combined with Tailwind CSS via CDN.
- **Uploads**: Local file storage via Multer.

## Future State
The architecture is being prepared to support a Service Layer (src/services/), isolated API/View routing (src/routes/), and cloud-ready infrastructure (src/config/).