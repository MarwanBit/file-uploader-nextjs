import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/__mocks__/sonner.ts', './src/test-setup.ts'],
        mockReset: true,
        clearMocks: true,
        environmentOptions: {
            customExportConditions: ['node', 'node-addons'],
        },
        reporters: ['default', 'hanging-process'],
        testTimeout: 10000, // 10 seconds per test
        hookTimeout: 10000, // 10 seconds for hooks
        teardownTimeout: 10000, // 10 seconds for teardown
        forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**', '**/vite.config.*/**'],
        isolate: true, // Isolate each test file
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
        ],
        // Pass with no tests
        passWithNoTests: true,
        //Coverage configuration
        coverage: {
            provider: 'v8', // or 'istanbul'
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            clean: true, // Clean coverage directory before running
            cleanOnRerun: true, // Clean on rerun
            include: ['src/**/*.{js,ts,jsx,tsx}'],
            exclude: [
            // Test files
            'src/**/*.test.{js,ts,jsx,tsx}',
            'src/**/*.spec.{js,ts,jsx,tsx}',
            'src/**/__tests__/**',
            'src/**/__mocks__/**',
            
            // Type definitions
            'src/**/types/**',
            'src/**/interfaces/**',
            'src/**/*.d.ts',
            'src/**/index.ts',
            
            // Prisma generated files
            'prisma/generated/**',
            'prisma/migrations/**',
            'src/lib/db-client.ts', // If it's just Prisma client setup
            
            // Configuration files
            'src/lib/config.ts',
            'src/middleware.ts',
            
            // Third-party integrations
            'src/lib/s3-client.ts', // AWS SDK setup
            'src/lib/api-client.ts', // If it's just HTTP wrapper
            
            // Build/generated files
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/coverage/**',
            
            // Storybook files
            'src/**/*.stories.{js,ts,jsx,tsx}',
            
            // Environment files
            '**/.env*',
            '**/next.config.*',
            '**/tailwind.config.*',
            '**/postcss.config.*',
            
            // Documentation
            '**/*.md',
            '**/README*',
            
            // IDE files
            '**/.DS_Store',
            '**/.vscode/**',
            '**/.idea/**'
        ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})