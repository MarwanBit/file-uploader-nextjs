<!-- a6d014e8-d3df-4f20-9d29-16e5ab4d9072 321de022-fabc-4bd0-b79c-1e6a7dcc94cf -->
# Testing, Error Handling & Deployment Plan

## Day 1: Testing Foundation & Setup (8 hours)

### Morning Session (4 hours): Testing Infrastructure & Unit Tests

**1. Testing Setup & Configuration (1 hour)**

- Install testing dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest`, `jest-environment-jsdom`, `@types/jest`
- Create `jest.config.js` and `jest.setup.js` for Next.js 15
- Configure test scripts in `package.json`
- Set up MSW (Mock Service Worker) for API mocking
- Create test utilities in `src/__tests__/utils/`

**2. Service Layer Unit Tests (2 hours)**
Focus on `src/services/folder-service.ts` and `src/services/file-service.ts`:

- Mock Prisma client and S3 client
- Test `FolderService.createRootFolder()` - success and failure cases
- Test `FolderService.deleteFolderRecursively()` - cascade deletion logic
- Test `FileService.shareFile()` - URL generation and expiry
- Test `FileService.deleteFile()` - S3 and DB deletion
- Aim for 80%+ coverage on service layer

**3. Component Unit Tests (1 hour)**
Update existing empty test files with real tests:

- `folder-table.test.tsx` - rendering files/folders, click handlers
- `new-folder-button.test.tsx` - dialog open/close, form submission
- `delete-file-button.test.tsx` - confirmation dialog, delete action
- Use React Testing Library queries and user events

### Afternoon Session (4 hours): Integration Tests & API Testing

**4. API Route Integration Tests (2.5 hours)**
Create `src/app/api/__tests__/` directory:

- Test `POST /api/folders` - folder creation with auth
- Test `GET /api/folders` - root folder retrieval
- Test `DELETE /api/folders/[folderId]` - recursive deletion
- Test `POST /api/folders/[folderId]/share` - share token generation
- Test `GET/DELETE /api/files/[id]` - file operations
- Mock Clerk authentication using `@clerk/testing`
- Mock S3 operations to avoid actual AWS calls

**5. Frontend Integration Tests (1.5 hours)**
Test component integration with API:

- `folder-page.tsx` - full page rendering with data fetching
- Test folder navigation flow
- Test file upload with mock FormData
- Test error states when API fails
- Use MSW to mock API responses

---

## Day 2: Error Handling, Loading States & Deployment (8 hours)

### Morning Session (4 hours): Error Handling & Loading States

**6. Backend Error Handling (1.5 hours)**
Enhance error handling in:

- Create `src/lib/errors.ts` with custom error classes (`NotFoundError`, `UnauthorizedError`, `S3Error`, `DatabaseError`)
- Add error middleware/wrapper for API routes
- Update all API routes to return proper HTTP status codes (400, 401, 403, 404, 500)
- Add error logging with context
- Example: `src/app/api/folders/route.ts` should catch specific errors

**7. Frontend Error Handling (1 hour)**

- Create `src/components/ui/error-boundary.tsx` using React Error Boundary
- Add `src/hooks/use-error-toast.ts` for consistent error messages
- Update API service classes (`folder-api.service.ts`, `file-api.service.ts`) with try-catch and user-friendly messages
- Add error states to `folder-page.tsx` with retry functionality

**8. Loading States & Skeletons (1.5 hours)**

- Create `src/components/ui/folder-table-skeleton.tsx`
- Create `src/components/ui/folder-tree-skeleton.tsx`
- Add loading states to `folder-page.tsx` with Suspense
- Add optimistic updates for folder/file operations
- Add skeleton screens for breadcrumb, sidebar
- Use `sonner` toast for operation feedback (already installed)

### Afternoon Session (4 hours): E2E Tests & Deployment

**9. Cypress E2E Tests (2 hours)**

- Install Cypress: `npm install -D cypress @cypress/react`
- Configure `cypress.config.ts` for Next.js
- Create test fixtures in `cypress/fixtures/`
- Write critical user flows:
- `cypress/e2e/auth.cy.ts` - login/signup with Clerk
- `cypress/e2e/folder-operations.cy.ts` - create, navigate, delete folders
- `cypress/e2e/file-operations.cy.ts` - upload, download, share, delete files
- `cypress/e2e/sharing.cy.ts` - folder sharing flow end-to-end
- Use Cypress commands for common operations

**10. Vercel Deployment Setup (1.5 hours)**

- Create `vercel.json` configuration
- Set up environment variables in Vercel dashboard:
- `DATABASE_URL` for staging/production (separate databases)
- `DIRECT_URL` for Prisma migrations
- AWS credentials, Clerk keys
- Configure Prisma for Vercel (connection pooling)
- Set up preview deployments for PRs
- Configure build settings and output directory

**11. GitHub Actions CI/CD (0.5 hours)**
Create `.github/workflows/ci.yml`:

- Run linting on PRs
- Run unit and integration tests
- Run Cypress e2e tests (on staging environment)
- Automated deployment to Vercel on main branch merge
- Add status badges to README

---

## Key Files to Create/Modify

**New Files:**

- `jest.config.js`, `jest.setup.js`
- `src/__tests__/utils/test-helpers.ts`
- `src/services/__tests__/folder-service.test.ts`
- `src/services/__tests__/file-service.test.ts`
- `src/app/api/__tests__/folders.test.ts`
- `src/lib/errors.ts`
- `src/components/ui/error-boundary.tsx`
- `src/components/ui/folder-table-skeleton.tsx`
- `src/hooks/use-error-toast.ts`
- `cypress.config.ts`
- `cypress/e2e/*.cy.ts`
- `.github/workflows/ci.yml`
- `vercel.json`

**Modified Files:**

- All API routes - add error handling
- `folder-page.tsx` - loading & error states
- `folder-api.service.ts`, `file-api.service.ts` - error handling
- All empty `.test.tsx` files - add real tests
- `package.json` - add test scripts

---

## Learning Resources

### Testing Fundamentals

1. **React Testing Library**

- Official docs: https://testing-library.com/docs/react-testing-library/intro/
- Common mistakes: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- Testing Playground: https://testing-playground.com/

2. **Jest with Next.js**

- Next.js testing docs: https://nextjs.org/docs/app/building-your-application/testing/jest
- Jest matchers: https://jestjs.io/docs/expect
- Mock functions: https://jestjs.io/docs/mock-functions

3. **Cypress E2E**

- Best practices: https://docs.cypress.io/guides/references/best-practices
- Next.js guide: https://nextjs.org/docs/app/building-your-application/testing/cypress

### Books (Key Sections)

4. **Next.js Testing Patterns**

- Focus on: API route testing, Server Components testing, Client Components with hooks
- MSW for API mocking: https://mswjs.io/docs/getting-started

5. **Integration Testing**

- Testing strategy: https://kentcdodds.com/blog/write-tests
- The Testing Trophy: https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications

### Deployment

6. **Vercel Deployment**

- Vercel docs: https://vercel.com/docs/deployments/overview
- Environment variables: https://vercel.com/docs/projects/environment-variables
- Preview deployments: https://vercel.com/docs/deployments/preview-deployments

7. **GitHub Actions**

- Next.js CI: https://github.com/vercel/next.js/tree/canary/examples/with-jest
- Cypress CI: https://docs.cypress.io/guides/continuous-integration/github-actions

---

## Success Metrics

- 80%+ test coverage on services
- All critical user flows have e2e tests
- Every API route has proper error handling
- All components show loading states
- CI/CD pipeline runs successfully
- Application deployed to Vercel with staging/production environments

### To-dos

- [ ] Install testing dependencies and configure Jest, RTL, MSW
- [ ] Write unit tests for FolderService and FileService with mocks
- [ ] Update empty test files with real component tests
- [ ] Create integration tests for API routes with Clerk and S3 mocks
- [ ] Test full page components with API integration using MSW
- [ ] Create custom error classes and add error handling to all API routes
- [ ] Add error boundaries, error toasts, and retry logic
- [ ] Create skeleton components and add loading states throughout the app
- [ ] Install Cypress and write e2e tests for critical user flows
- [ ] Configure Vercel with environment variables and separate databases
- [ ] Create CI/CD pipeline with testing and automated deployment