# CampusFlow

CampusFlow is a comprehensive, multi-module college campus management platform designed to streamline student services, from complaint resolution and lost & found management, to digital marketplaces and geofenced attendance.

## Features Currently Implemented
- **AI Complaint System**: Students can log complaints which are automatically categorized (Plumbing, Electrical, IT, etc.) using Google Gemini AI.
- **Lost & Found**: A campus-wide bulletin board to report lost items or post found items, complete with image galleries.
- **Campus Marketplace**: A digital marketplace for students to buy, sell, and negotiate items securely within the campus. Includes built-in messaging logic.
- **Service Queues**: Virtual queues (e.g., "Dean's Office", "Financial Aid") where students can join a digital line and receive estimated wait times.
- **Smart Attendance**: Geofenced check-in system that requires students to be physically within a specified radius of a classroom (or scan a QR code) to log their attendance.

## Technology Stack
- **Backend:** Node.js, Express.js (Clustered for high concurrency)
- **Database:** SQLite via Prisma ORM
- **Frontend:** Server-Side Rendered EJS templates with TailwindCSS
- **AI Integration:** Google Gemini AI SDK

## Quick Start
1. Ensure Node.js is installed.
2. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
3. Set up the local database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. Seed the database with test data:
   ```bash
   npm run seed
   ```
5. Create a `.env` file in the root directory:
   ```env
   JWT_SECRET="your_secret_key"
   GEMINI_API_KEY="your_optional_ai_key"
   ```
6. Run the server in development mode:
   ```bash
   npm run dev
   ```

## License
This project is licensed under the MIT License - see the LICENSE file for details.
