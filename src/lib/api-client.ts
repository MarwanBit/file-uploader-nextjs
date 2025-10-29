import { IApiClient } from "@/interfaces/api-client.interface";

/**
 * @fileoverview HTTP client for making API requests with error handling.
 * 
 * This module provides a centralized API client for making HTTP requests to the
 * application's backend API. It includes automatic error handling, JSON serialization,
 * and support for both JSON and FormData payloads.
 * 
 * @module lib/api-client
 */

/**
 * HTTP client for making API requests with built-in error handling.
 * 
 * This class provides a clean interface for making HTTP requests to the application's
 * API endpoints. It automatically handles JSON serialization/deserialization, error
 * responses, and network failures. The base URL is configured from environment variables.
 * 
 * @implements {IApiClient}
 * 
 * @example
 * ```typescript
 * import { apiClient } from '@/lib/api-client';
 * 
 * // GET request
 * const folders = await apiClient.get('/folders');
 * 
 * // POST request with JSON
 * const newFolder = await apiClient.post('/folders', { 
 *   folder_name: 'Documents' 
 * });
 * 
 * // POST request with FormData
 * const formData = new FormData();
 * formData.append('file', fileObject);
 * const result = await apiClient.postFormData('/folders/123/files', formData);
 * 
 * // DELETE request
 * await apiClient.delete('/files/456');
 * ```
 * 
 * @remarks
 * - Uses NEXT_PUBLIC_API_URL environment variable or defaults to '/api'
 * - Automatically adds Content-Type: application/json for JSON requests
 * - Throws ApiError with status codes for failed requests
 * - All methods are type-safe with TypeScript generics
 */
class ApiClient implements IApiClient{
    /**
     * The base URL for all API requests.
     * Configured from NEXT_PUBLIC_API_URL environment variable or defaults to '/api'.
     * @private
     */
    private baseUrl: string;

    /**
     * Creates a new ApiClient instance with the configured base URL.
     */
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    }

    /**
     * Internal method for making HTTP requests with error handling.
     * 
     * This method handles the low-level HTTP communication, including:
     * - URL construction
     * - Header management
     * - Error handling and transformation
     * - JSON parsing
     * 
     * @private
     * @template T - The expected response type
     * @param endpoint - The API endpoint path (e.g., '/folders/123')
     * @param options - Fetch API request options
     * @returns A promise resolving to the parsed response data
     * @throws {ApiError} When the request fails or returns an error status
     */
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(
                    errorData.message || `HTTP ${response.status}`,
                    response.status,
                    errorData
                );
            }

            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(`Network error occured`, 0);
        }
    }

    /**
     * Makes a GET request to the specified endpoint.
     * 
     * @template T - The expected response type
     * @param endpoint - The API endpoint path
     * @returns A promise resolving to the response data
     * @throws {ApiError} When the request fails
     * 
     * @example
     * ```typescript
     * // Get user's folders
     * const folders = await apiClient.get<Folder[]>('/folders');
     * 
     * // Get specific file
     * const file = await apiClient.get<File>('/files/123');
     * ```
     */
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * Makes a POST request with JSON data to the specified endpoint.
     * 
     * @template T - The expected response type
     * @param endpoint - The API endpoint path
     * @param data - Optional data to send in the request body (will be JSON-stringified)
     * @returns A promise resolving to the response data
     * @throws {ApiError} When the request fails
     * 
     * @example
     * ```typescript
     * // Create a new folder
     * const newFolder = await apiClient.post<Folder>('/folders', {
     *   folder_name: 'My Documents'
     * });
     * 
     * // Share a file
     * const shareInfo = await apiClient.post('/files/123/share', {
     *   hours: 24
     * });
     * ```
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * Makes a POST request with FormData (typically for file uploads).
     * 
     * Unlike the regular post method, this allows the browser to automatically
     * set the correct Content-Type header including the boundary parameter
     * required for multipart/form-data.
     * 
     * @template T - The expected response type
     * @param endpoint - The API endpoint path
     * @param formData - FormData object containing the data to upload
     * @returns A promise resolving to the response data
     * @throws {ApiError} When the request fails
     * 
     * @example
     * ```typescript
     * // Upload a file
     * const formData = new FormData();
     * formData.append('file', fileObject);
     * 
     * const result = await apiClient.postFormData('/folders/123/files', formData);
     * console.log('File uploaded:', result);
     * ```
     * 
     * @remarks
     * The Content-Type header is intentionally left empty to allow the browser
     * to set it automatically with the correct boundary for multipart data.
     */
    async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: formData,
            headers: {}, //Let's browser set Content-Type for FormData
        });
    }

    /**
     * Makes a DELETE request to the specified endpoint.
     * 
     * @template T - The expected response type
     * @param endpoint - The API endpoint path
     * @returns A promise resolving to the response data
     * @throws {ApiError} When the request fails
     * 
     * @example
     * ```typescript
     * // Delete a file
     * const result = await apiClient.delete<{ message: string }>('/files/123');
     * console.log(result.message); // "deletion successful!"
     * 
     * // Delete a folder
     * await apiClient.delete('/folders/456');
     * ```
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

/**
 * Custom error class for API-related errors.
 * 
 * This error class extends the standard Error to include HTTP status codes
 * and optional response data. It provides more context about API failures
 * than a standard Error object.
 * 
 * @extends Error
 * 
 * @example
 * ```typescript
 * try {
 *   await apiClient.get('/folders/invalid-id');
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error('API Error:', error.message);
 *     console.error('Status:', error.status);
 *     console.error('Data:', error.data);
 *     
 *     if (error.status === 404) {
 *       console.log('Resource not found');
 *     } else if (error.status === 401) {
 *       console.log('Unauthorized - redirect to login');
 *     }
 *   }
 * }
 * ```
 * 
 * @remarks
 * - Status code 0 indicates a network error
 * - The data property may contain additional error details from the server
 */
class ApiError extends Error {
    /**
     * Creates a new ApiError instance.
     * 
     * @param message - Human-readable error message
     * @param status - HTTP status code (0 for network errors)
     * @param data - Optional additional error data from the server
     */
    constructor(
        message: string,
        public status: number,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Singleton instance of the ApiClient.
 * 
 * This is the main export for making API requests throughout the application.
 * Import and use this instance rather than creating new ApiClient instances.
 * 
 * @example
 * ```typescript
 * import { apiClient } from '@/lib/api-client';
 * 
 * // Use in components
 * const folders = await apiClient.get('/folders');
 * ```
 */
export const apiClient = new ApiClient();

/**
 * Export the ApiError class for error handling in consuming code.
 */
export { ApiError };