/**
 * Mock for sonner toast library
 * Provides all the methods used in the application
 */

export const toast = {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn(async (promise, options) => {
        // Mock implementation of toast.promise
        // In tests, we'll just execute the promise and return the result
        try {
            const result = await promise;
            if (options?.success) {
                options.success(result);
            }
            return result;
        } catch (error) {
            if (options?.error) {
                options.error(error);
            }
            throw error;
        }
    }),
    loading: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
};
