// Test setup file
import { vi } from 'vitest';

// Mock Clerk's hooks
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    isSignedIn: true,
    userId: 'test-user-id',
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: {
        root_folder: 'test-root-folder-id'
      }
    }
  })),
  useUser: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: {
        root_folder: 'test-root-folder-id'
      }
    },
    isLoaded: true,
    isSignedIn: true
  })),
  UserButton: vi.fn(() => null),
  SignOutButton: vi.fn(() => null),
  SignInButton: vi.fn(() => null),
  SignUpButton: vi.fn(() => null),
  SignedIn: vi.fn(({ children }) => children),
  SignedOut: vi.fn(({ children }) => children),
  ClerkProvider: vi.fn(({ children }) => children),
  useClerk: vi.fn(() => ({})),
  useSession: vi.fn(() => ({}))
}));
