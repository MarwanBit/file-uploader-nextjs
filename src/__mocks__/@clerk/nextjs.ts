/**
 * Mock for @clerk/nextjs
 * Provides all the Clerk hooks and components used in the application
 */

export const useAuth = vi.fn(() => ({
  isSignedIn: true,
  userId: 'test-user-id',
  user: {
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: {
      root_folder: 'test-root-folder-id'
    }
  }
}));

export const useUser = vi.fn(() => ({
  user: {
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: {
      root_folder: 'test-root-folder-id'
    }
  },
  isLoaded: true,
  isSignedIn: true
}));

export const UserButton = vi.fn(() => <div data-testid="user-button">User Button</div>);

export const SignOutButton = vi.fn(() => <button data-testid="sign-out-button">Sign Out</button>);

export const SignInButton = vi.fn(() => <button data-testid="sign-in-button">Sign In</button>);

export const SignUpButton = vi.fn(() => <button data-testid="sign-up-button">Sign Up</button>);

export const SignedIn = vi.fn(({ children }) => <div data-testid="signed-in">{children}</div>);

export const SignedOut = vi.fn(({ children }) => <div data-testid="signed-out">{children}</div>);

export const ClerkProvider = vi.fn(({ children }) => <div data-testid="clerk-provider">{children}</div>);

export const useClerk = vi.fn(() => ({
  user: {
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: {
      root_folder: 'test-root-folder-id'
    }
  }
}));

export const useSession = vi.fn(() => ({
  session: {
    id: 'test-session-id',
    userId: 'test-user-id'
  },
  isLoaded: true,
  isSignedIn: true
}));
