import { defineConfig } from "cypress";
import { execSync } from "child_process";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.cypress
config({ path: path.resolve(__dirname, '.env.cypress') });

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    env: {
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
      DATABASE_URL: process.env.DATABASE_URL,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    },
    setupNodeEvents(on, config) {
      on('task', {
        async 'db:clean'() {
          try {
            execSync('npx tsx cypress/scripts/cleanup-db.ts', { 
              stdio: 'inherit',
              env: { ...process.env }
            });
            return null;
          } catch (error) {
            console.log('Database cleanup error:', error);
            return null;
          }
        },

        async 'clerk:cleanupUsers'() {
          try {
            execSync('npx tsx cypress/scripts/cleanup-clerk.ts', { 
              stdio: 'inherit',
              env: { ...process.env }
            });
            return null;
          } catch (error) {
            console.log('Clerk cleanup error:', error);
            return null;
          }
        }
      });
    }
  }
});