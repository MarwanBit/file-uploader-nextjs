# Architecture Overview

Below describes the system architecture of the application, you will notice that the application utilizes **Docker, Github, Vercel, Github Actions, NextJS, Amazon S3, and Clerk** for authentication. The rest of the document describes the project's structure, alongside the system design of the application.

## 1. Project Structure

Below is a visualization of the project's folder structure. The project is a NextJS application, so it inherits NextJS's folder/ file organization convention, particularly having all app routing, both frontend and backend under the **src/app/** directory. The functionality for connecting to external services is handled in the **src/lib/** folder which contains S3 and prisma clients to connect to Amazon S3, and the PostgresSQL database respectively. Additionally, the **src/services/** folder contains services which abstract away file and folder operations, connecting to **S3** and **Prisma** as needed in the corresponding functions. The core of the project is under the **src/** directory, with end2end testing handled in the **cypress/** directory.

📂 file-uploader-nextjs

├── 📄 README.md						# Project explanation for the user.

└── 📂 cypress/							# root folder containing all end2end testing functionality.

│  └── 📂 e2e/							# end2end tests that test common user flows such as file upload, file download, folder deletion, share, etc.

│  └── 📂 fixtures/						# reusable data for setting up tests.

│  └── 📂 scripts/						# scripts used for cleanup tasks, such as reseting Clerk, S3, and postgres Databases for a clean testing environment.

│  └── 📂 support/						# commands for common test tasks such as database cleaning, user creation and login, etc.

├── 📄 docker-compose.yml				# docker compose file for creating a containerized version of the application.

└── 📂 docs/							# documentation for key features, system design, application components, etc.

└── 📂 prisma/							# contains all generated prismaORM code and migrations.

│  ├── 📄 schema.prisma					# Schema file which describes the postgresSQL tables structure.

└── 📂 src/								# Directory containing all application critical code.

│  └── 📂 api-services/					# services which the frontend uses to facilitate file and folder operations.

│  └── 📂 app/							# NextJS app directory containing the route and page structure for the application.

│    └── 📂 (frontend)						# Contains the frontend directory structure and pages.

│    └── 📂 api/							# Contains all backend API routes and route handlers.

│  └── 📂 components/					# React UI components used within the application, alonside unit tests for each component.

│    ├── 📄 app-sidebar.tsx					# React component that generates the sidebar containing file and folder action buttons, alongside the file-tree.

│    └── 📂 features/						# React components developed in the project that are tied key features (file upload, download, etc).

│    └── 📂 pages/						# React components that render entire pages.

│    ├── 📄 shared-app-sidebar.tsx			# the sidebar/navbar in the shared folder view.

│    └── 📂 ui/							# ShadCNUI and MagicUI components.

│  └── 📂 contexts/						# contexts used by components.

│    ├── 📄 folder-context.tsx				# folder context used in shared folder view.

│  └── 📂 hooks/							# Custom React hooks for accessing folder context.

│    ├── 📄 use-folder.ts					# Custom hook for accessing the folder context for the shared file/folder view.

│  └── 📂 interfaces/						# Interfaces describing what the clients.

│  └── 📂 lib/							# Contains singletons for API setup, S3 clients, etc.

│  ├── 📄 middleware.ts					# middleware functions for clerk authentication.

│  └── 📂 services/						# Backend services which abstract away file and folder creation, share, deletion, etc from business logic.

│  └── 📂 types/							# Global types for the folder and file objects.

## 2. High-Level System Diagram

Below we can see a diagram highlighting the applications high-level architecture. There a three main components of the application: **A Local Dockerized Version of the Application**, **the Remote Application located on Github, and the Vercel Deployment of the Application**. For local development, the user uses the Local Dockerized Application, where local development occurs, and testing occurs using the test PostgresSQL, Amazon S3 Bucket, and Clerk Authentication Service.

Upon pushing and merging to the main branch on the Remote Application located on Github, Github Actions runs actions that run the entire end2end and unit testing suites. While running the end2end tests, the remote deployment of the project uses the test PostgresSQL Instance, Test Amazon S3 Bucket, and Test Clerk Authentication Service. Upon successful completion of the end2end test and unit test suite, a successful merge onto main deploys the productionized version of the application to Vercel, which uses a seperate production PostgresSQL Database, production Amazon S3 Bucket, and Production Clerk Authentication Service.

![img](api/assets/File-Uploader%20Architecture%20Diagram.png "High Level Architecture Design")

## 3. Core Components

The core components of the application are the following:

* **Local Git Repository/ Local NextJS Application**
* **(TEST) PostgresSQL Instance**
* **(TEST) Amazon S3 Bucket**
* **(TEST) Clerk Authentication Service**
* **Remote Git Repository/ Remote NextJS Application/ Github Actions**
* **Vercel Deployment [NextJS Application]**
* **(PROD) PostgresSQL Instance**
* **(PROD) Amazon S3 Bucket**
* **(PROD) Clerk Authentication Service**

### 3.1. Frontend

**Name:** File Uploader Web Application

**Description:** The frontend is a modern, responsive web application built with Next.js that provides users with an intuitive interface for managing their cloud storage. Users can upload, download, share, and organize files and folders through a familiar file-system interface. The application features a sidebar with a hierarchical folder tree, a main content area displaying folder contents in a table format, and action buttons for all file operations. Real-time feedback is provided through toast notifications, and file operations are handled asynchronously. The interface includes authentication pages (login/signup), a protected main folders view, and a public shared folder/file viewing interface accessible via share tokens.

**Technologies:**

- React 19.1.0
- Next.js 15.5.4 (App Router)
- TypeScript 5
- TailwindCSS 4 (for styling)
- ShadcnUI (component library based on Radix UI)
- Framer Motion (animations)
- Lucide React & Tabler Icons (iconography)
- Sonner (toast notifications)

**Deployment:** Vercel (Production), Docker (Local Development)

### 3.2. Backend Services

The backend is built using Next.js API Routes, providing a serverless REST API architecture. All backend logic is co-located with the frontend in the Next.js application.

#### 3.2.1. File Management API

**Name:** File Operations Service

**Description:** Handles all file-related operations including file uploads, downloads, deletions, and sharing. This service generates presigned URLs for secure S3 access, manages file metadata in PostgreSQL via Prisma ORM, and enforces user ownership and permissions. Key endpoints include:

- `POST /api/files` - Upload new files
- `GET /api/files/:id` - Get file metadata and presigned download URL
- `DELETE /api/files/:id` - Delete files from S3 and database
- `POST /api/files/:id/share` - Generate shareable links with expiration

**Technologies:**

- Node.js (Next.js API Routes)
- TypeScript
- AWS SDK v3 (S3 operations)
- Prisma ORM (database operations)

**Deployment:** Vercel

#### 3.2.3. Authentication Middleware

**Name:** Clerk Authentication Middleware

**Description:** Middleware that protects routes and validates user sessions using Clerk. Intercepts all requests to protected routes (/folders/*) and API endpoints, verifying JWT tokens and redirecting unauthenticated users to login. Extracts user identity (clerk_id) for authorization checks in backend services.

**Technologies:**

- Clerk Next.js SDK
- Next.js Middleware
- JWT validation

## 4. Data Stores

The application uses two primary data stores: PostgreSQL for relational metadata and AWS S3 for binary file storage. Both have separate instances for testing and production environments.

### 4.1. PostgreSQL Database

**Type:** PostgreSQL (via Prisma ORM)

**Purpose:** Stores all structured metadata about files, folders, user relationships, and sharing permissions. The database maintains referential integrity through foreign keys and supports complex hierarchical queries for folder structures.

**Environments:**

- **Test Database:** Used during local development and Cypress E2E testing. Cleaned before/after each test run.
- **Production Database:** Hosted on cloud provider (e.g., Neon, Supabase, or AWS RDS), used by the Vercel deployment.

**Key Tables:**

- **Folder:** Stores folder metadata including id, folder_name, created_at, updated_at, is_root, s3_link, shared status, expires_at, parent_folder_id, owner_clerk_id, s3_key, and shareToken. Supports self-referential relationships for hierarchical folder structures.
- **File:** Stores file metadata including id, file_name, size, created_at, shared status, s3_link, expires_at, parent_folder_id, owner_clerk_id, and s3_key. Links to parent folder via foreign key.

**Access Pattern:** All database access goes through Prisma ORM using generated type-safe client. Services in `src/services/` abstract database operations.

### 4.2. Amazon S3 Bucket

**Type:** Object Storage (AWS S3)

**Purpose:** Stores the actual binary file content. Files are uploaded directly to S3 using presigned URLs for security. Each file is stored with a unique S3 key that is also tracked in the PostgreSQL database. S3 provides durable, scalable, and cost-effective storage for files of any size.

**Environments:**

- **Test Bucket:** Used during local development and automated testing. Cleaned before/after each test run.
- **Production Bucket:** Dedicated S3 bucket for production file storage with appropriate access policies.

**Access Method:**

- Files are accessed via presigned URLs generated by the backend (expiration time: ~67 minutes for downloads)
- Upload operations use presigned POST URLs
- All S3 operations use AWS SDK v3
- S3 client singleton managed in `src/lib/s3-client.ts`

**Security:** Bucket policies restrict direct public access. All file access is mediated through the application backend, which generates time-limited presigned URLs.

## 5. External Integrations / APIs

The application integrates with three primary external services for authentication, storage, and database management.

### 5.1. Clerk Authentication Service

**Purpose:** Provides complete authentication and user management solution including sign-up, sign-in, session management, and user profile management. Clerk handles password security, email verification, and JWT token generation/validation.

**Integration Method:**

- Clerk Next.js SDK (@clerk/nextjs)
- Middleware integration for route protection
- React components for authentication UI
- Server-side auth() helper for user identity extraction

**Key Features Used:**

- Username-based authentication
- Session management with JWT
- Automatic redirect flows
- Protected route handling

**Environments:** Separate Clerk projects for test and production

## 6. Deployment & Infrastructure

**Cloud Providers:** Multi-cloud architecture using Vercel (application hosting), AWS (file storage), and flexible database provider options

**Key Services Used:**

- **Vercel:** Serverless function deployment, edge functions, automatic scaling, CDN distribution
- **AWS S3:** Object storage for files
- **PostgreSQL:** Managed database service (Neon, Supabase, AWS RDS, or similar)
- **Docker:** Local development containerization (docker-compose.yml)
- **GitHub:** Version control and CI/CD trigger

**CI/CD Pipeline:**

The project implements a comprehensive CI/CD workflow using GitHub Actions and Vercel:

1. **Development Phase (Local):**

   - Developers work locally using Docker Compose
   - Local environment uses test database, test S3 bucket, and test Clerk instance
   - Unit tests run via Vitest (`npm test`)
   - E2E tests run via Cypress (`npx cypress run`)
2. **Continuous Integration (GitHub Actions):**

   - Triggered on push/PR to main branch
   - Runs complete test suite (Vitest unit tests + Cypress E2E tests)
   - Uses test environment variables (configured as GitHub Secrets)
   - Cleans test database and S3 bucket before/after test runs
   - Fails merge if any tests fail
3. **Continuous Deployment (Vercel):**

   - Triggered automatically after successful merge to main
   - Vercel builds Next.js application (`npm run build`)
   - Runs Prisma migrations (`prisma migrate deploy`)
   - Generates Prisma client (`prisma generate`)
   - Deploys to production using production environment variables
   - Production uses separate database, S3 bucket, and Clerk instance
   - Automatic rollback on build failures

**Infrastructure Diagram:** See Section 2 (High-Level System Diagram)

**Configuration Management:**

- Environment variables managed separately for local/test/production
- GitHub Secrets store test environment variables
- Vercel Environment Variables store production credentials
- `.env` files for local development (not committed to version control)

## 7. Security Considerations

The application implements multiple layers of security to protect user data and ensure secure file operations.

**Authentication:**

- **Clerk JWT-based Authentication:** All users must authenticate via Clerk before accessing protected resources
- **Session Management:** Secure session handling with automatic token refresh
- **Middleware Protection:** Next.js middleware intercepts all requests to protected routes and validates JWT tokens
- **Redirect Flow:** Unauthenticated users are automatically redirected to login page

**Authorization:**

- **Owner-Based Access Control:** All file and folder operations verify that the requesting user (via clerk_id) is the owner of the resource
- **Share Token System:** Files and folders can be shared via unique, cryptographically random share tokens
- **Time-Limited Sharing:** Shared resources include expiration timestamps (expires_at) for automatic access revocation
- **Public vs Private Routes:** Clear separation between authenticated routes (/folders/*) and public shared routes (/folders/shared/*)

**Key Security Practices:**

- Separation of test and production environments
- TypeScript for compile-time type safety
- ESLint for code quality and security linting
- Automated testing including security-focused E2E tests
- Environment-specific credentials (test vs. production)

## 8. Development & Testing Environment

**Local Setup Instructions:**

See README.md Quick Start section for detailed setup instructions. High-level steps:

1. Clone the repository from GitHub
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` and `.env.cypress` files:
   - `DATABASE_URL` - PostgreSQL connection string
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `APPLICATION_BUCKET_NAME` - AWS S3 credentials
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` - Clerk authentication keys
   - Other configuration variables as specified in README
4. Run Prisma migrations: `npx prisma generate && npx prisma migrate deploy`
5. Start development server: `npm run dev`
6. Access application at http://localhost:3000

**Alternative: Docker Setup**

- Use `docker-compose.yml` for containerized development
- Provides consistent development environment across machines

**Testing Frameworks:**

1. **Vitest** - Unit and Integration Testing

   - Tests React components using React Testing Library
   - Coverage reporting with @vitest/coverage-v8
   - Fast, Vite-native test runner
   - Configuration: `vitest.config.ts`
   - Run tests: `npm test`
   - Features: Component testing, hooks testing, snapshot testing
2. **Cypress** - End-to-End Testing

   - Tests complete user workflows (file upload, download, share, delete, folder operations)
   - Uses real test database, S3 bucket, and Clerk instance
   - Custom commands for common operations (user creation, login, database cleanup)
   - Test fixtures for reusable test data
   - Configuration: `cypress.config.ts`
   - Run tests: `npx cypress run` (headless) or `npx cypress open` (interactive)
   - Cleanup scripts in `cypress/scripts/` ensure isolated test state

**Code Quality Tools:**

- **ESLint** - JavaScript/TypeScript linting

  - Configuration: `eslint.config.mjs`
  - Integrated with Next.js rules
  - Run: `npm run lint`
- **TypeScript** - Static type checking

  - Configuration: `tsconfig.json`
  - Strict mode enabled for maximum type safety
  - Compile-time error detection
- **Prettier** (implied) - Code formatting

  - Consistent code style across the project
- **TypeDoc** - API documentation generation

  - Generates comprehensive API documentation from TypeScript comments
  - Configuration: `typedoc.json`, `tsconfig.typedoc.json`
  - Run: `npm run docs` (generate) or `npm run docs:open` (view)
  - Output: `docs/api/` directory

**Development Tools:**

- **Prisma Studio** - Database GUI for development (`npx prisma studio`)
- **React DevTools** - Browser extension for React debugging
- **Next.js Dev Tools** - Built-in development features (hot reload, error overlay)

**Testing Strategy:**

- Unit tests focus on individual components and utilities
- E2E tests cover complete user workflows and integration scenarios
- Test coverage reporting for visibility into tested code paths
- Automated cleanup ensures test isolation
- Separate test environments prevent production data contamination

## 9. Future Considerations / Roadmap

The following items represent potential architectural improvements, feature additions, and technical debt that may be addressed in future iterations:

**Enhanced Error Handling & User Experience:**

- Implement comprehensive error boundary components for graceful error recovery
- Create custom error classes for more granular error handling (NotFoundError, UnauthorizedError, S3Error, DatabaseError)
- Add loading skeletons and optimistic UI updates for better perceived performance
- Implement retry logic for failed operations
- Enhanced error logging and monitoring integration (e.g., Sentry)
- Concurrency handling of possible race conditions when modifying or deleting files and folders.

**Performance Optimizations:**

- Implement caching layer (Redis) for frequently accessed folder structures
- Add pagination for folders with large numbers of files
- Optimize database queries with proper indexing strategies
- Implement lazy loading for folder tree navigation
- Consider using Prisma Accelerate for connection pooling and global caching

**Feature Enhancements:**

- **Collaborative Features:** Real-time collaboration indicators, file versioning, conflict resolution
- **Advanced Sharing:** Password-protected shares, view-only vs. download permissions, share analytics
- **File Management:** Bulk operations (multi-select delete/move), drag-and-drop file organization, favorites/starred files
- **Search & Discovery:** Full-text search across file names and metadata, advanced filtering options
- **Storage Management:** User storage quotas, storage usage analytics, automated cleanup of expired shares

**Architecture Improvements:**

- **Event-Driven Architecture:** Implement event bus (e.g., using AWS EventBridge) for decoupled file operation events
- **Microservices Consideration:** Evaluate splitting file operations and folder operations into separate services as scale demands
- **CDN Integration:** Add CloudFront or similar CDN for faster file downloads globally
- **Background Jobs:** Implement job queue (e.g., BullMQ) for handling long-running operations like recursive folder deletion
- **WebSocket Support:** Add real-time updates for collaborative features

**Security Enhancements:**

- Implement file type validation and virus scanning
- Add audit logging for all file operations
- Enhanced RBAC with team/organization support
- Two-factor authentication integration via Clerk
- Data residency controls for compliance requirements

**DevOps & Monitoring:**

- Add comprehensive application monitoring (APM)
- Implement log aggregation and analysis
- Set up alerting for critical errors
- Performance monitoring and optimization tools
- Automated backup and disaster recovery procedures

**Known Technical Debt:**

- Complete implementation of GitHub Actions CI/CD workflow (configuration exists but may need enhancement)
- Increase unit test coverage for API routes and frontend components
- Standardize error responses across all API endpoints
- Document API endpoints with OpenAPI/Swagger specification
- Refactor large components for better maintainability

## 10. Project Identification

**Project Name:** File Uploader Next.js

**Repository URL:** https://github.com/marwanbit/file-uploader-nextjs

**Description:** A full-stack cloud file storage application enabling users to upload, organize, share, and manage files and folders with secure authentication and cloud storage integration.

**Tech Stack Summary:**

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS, ShadcnUI
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL
- **Storage:** AWS S3
- **Authentication:** Clerk
- **Testing:** Vitest, Cypress, React Testing Library
- **Deployment:** Vercel
- **Documentation:** TypeDoc

**Primary Contact/Team:** marwainbit12@gmail.com/Marwan Bit

**Date of Last Update:** 2025-10-25

**Documentation Files:**

- `README.md` - Project overview, quick start, and usage instructions
- `docs/ARCHITECTURE.md` - System architecture (this document)
- `docs/API.md` - API endpoint documentation
- `docs/DATABASE.md` - Database schema and design
- `docs/DEPLOYMENT.md` - Deployment and CI/CD setup
- `docs/DEVELOPMENT.md` - Development guidelines and contribution guide
- `docs/api/` - Auto-generated TypeDoc API documentation

**Related Links:**

- Live Production URL: [https://file-uploader-nextjs.vercel.app/](File Uploader)
