# Development Setup Guide

## Prerequisites

- Node.js installation
- AWS Account
- Clerk Account
- PostgreSQL database access

## Clerk Configuration

### Creating Test and Production Projects

Both the Clerk Test and Production Projects are quite similar, as they both require sign-up by username to be enabled, alongside requiring first and last name (this is how unique root folders are created for each user). For both projects, make sure they are "development" instances, as this circumvents the need to buy a custom domain for the production environment (this can be revisited and is advised by Clerk for security). For both projects copy the same settings unders Configure >> User & Authentication.

![img](api/assets/clerk_username.jpeg)
![img](api/assets/clerk_user_model.jpeg)


##### Test Clerk Configuration

The Test Clerk Project differs in one way, that is we don't want to verify signing in or signing up with email, this allows the end2end tests to easily create test users without having to fill out captchas (a cheat for easy testing). **It is crucial to disable this setting for the test clerk project, as without it, all end2end tests will fail, make sure to do so**.

![img](api/assets/clerk_email_configuration.jpeg)

##### Production Clerk Configuration

For the Production Clerk Project, make sure to enable verification at sign-up and sign-in to guarantee real emails are used in production.

![img](api/assets/clerk_prod_email_settings.jpeg)

### Environment Variables

After creating both Test and Production Clerk projects, you'll need to gather the following environment variables from each project's dashboard:

**For Both Projects:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Found in the Clerk dashboard under API Keys
- `CLERK_SECRET_KEY` - Found in the Clerk dashboard under API Keys (keep this secret!)

These values will be different for your test and production environments. Use the test project keys in your local `.env` and `.env.cypress` files, and the production project keys in your Vercel deployment settings.

## AWS S3 Configuration

### Overview

You'll need to create **two separate S3 buckets**: one for testing/development and one for production. This ensures that your test data doesn't interfere with production data, and allows the Cypress test suite to safely clean up test files without affecting real user data.

### Test Bucket Setup

1. Log into your AWS Console and navigate to S3
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `your-app-name-test`)
4. Select your preferred AWS region
5. **Important:** Under "Block Public Access settings", keep all public access blocked for security
6. Leave other settings as default and click "Create bucket"

### Production Bucket Setup

Follow the same steps as the test bucket, but use a different name (e.g., `your-app-name-production`). This bucket will store real user data, so ensure:
- Public access is blocked
- Versioning is enabled (recommended for data recovery)
- Consider enabling encryption at rest for additional security

### IAM Permissions

To allow your application to interact with S3, you'll need to create an IAM user with appropriate permissions:

1. Navigate to IAM in the AWS Console
2. Create a new IAM user (e.g., `file-uploader-service`)
3. Attach a policy with the following permissions for your buckets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

4. Generate access keys for this user - you'll receive:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

**Important:** Use the same IAM user for both test and production buckets, but specify different bucket names via the `APPLICATION_BUCKET_NAME` environment variable in each environment.

## Database Setup

### Overview

You'll need **two separate PostgreSQL databases**: one for testing/development and one for production. The test database will be cleaned and reset by the Cypress test suite, so it must be completely separate from production data.

### Creating Test and Production Databases

You can use any PostgreSQL provider (AWS RDS, Heroku, Railway, Supabase, local PostgreSQL, etc.). The setup is standard:

1. **Test Database:**
   - Create a new PostgreSQL database instance
   - Note the connection string (e.g., `postgresql://user:password@host:5432/test_db`)
   - This database will be used for local development and Cypress tests

2. **Production Database:**
   - Create a separate PostgreSQL database instance
   - Note the connection string (e.g., `postgresql://user:password@host:5432/prod_db`)
   - This database will store real user data

### Prisma Setup

After obtaining your database connection strings:

1. Add the test database URL to your local `.env` and `.env.cypress`:
```
DATABASE_URL=postgresql://user:password@host:5432/test_db
```

2. Run Prisma migrations to set up the schema:
```bash
npx prisma generate
npx prisma migrate deploy
```

3. For production, add the production database URL to your Vercel environment variables (see DEPLOYMENT.md)

**Note:** The Prisma schema is defined in `prisma/schema.prisma`. Any changes to the schema require running `npx prisma migrate dev` to generate new migration files.

## Running Tests

For detailed information on running unit tests and end-to-end tests, please refer to the **Testing** section in the [README.md](../README.md#testing).

**Quick Reference:**

**Unit Tests:**
```bash
npm test
```

**End-to-End Tests:**
```bash
# In terminal 1:
npm run dev

# In terminal 2:
npx cypress run
# or for interactive mode:
npx cypress open
```

**Important:** Make sure all test environment variables (test Clerk, test S3 bucket, test database) are properly configured in both `.env` and `.env.cypress` before running Cypress tests. The tests will clean up data after each run, so never point them to production resources.

## Environment Variables Summary

Here's a complete reference of all required environment variables:

**Local Development (.env and .env.cypress):**
```
# Test Database
DATABASE_URL=postgresql://user:password@host:5432/test_db

# Test AWS S3 Bucket
AWS_ACCESS_KEY_ID=your_test_access_key
AWS_SECRET_ACCESS_KEY=your_test_secret_key
AWS_REGION=us-east-1
APPLICATION_BUCKET_NAME=your-app-name-test

# Application Configuration
PORT=3000

# Test Clerk Project
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/folders
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/folders
NEXT_PUBLIC_API_URL=/api

# Cypress
CYPRESS_BASE_URL=http://localhost:3000
```

**Production (Vercel Environment Variables):**
- Same variables as above, but with production values for:
  - `DATABASE_URL` (production database)
  - `APPLICATION_BUCKET_NAME` (production S3 bucket)
  - Clerk keys from production Clerk project
  - Same `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (IAM user has access to both buckets)

## Troubleshooting

**Clerk Issues:**
- If sign-up/sign-in isn't working in tests, verify email verification is disabled in the test Clerk project
- Check that both test and production Clerk projects have username sign-up enabled

**S3 Issues:**
- Verify your IAM user has the correct permissions for both buckets
- Ensure the bucket names in your environment variables match the actual bucket names
- Check that the AWS region matches where your buckets are located

**Database Issues:**
- Run `npx prisma generate` after any schema changes
- Use `npx prisma studio` to visually inspect your database
- Ensure your database connection string is correct and the database is accessible
