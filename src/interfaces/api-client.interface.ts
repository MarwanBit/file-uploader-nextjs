/**
 * Interface defining the contract for HTTP API client operations.
 * 
 * This interface provides a standardized API for making HTTP requests to the backend.
 * It supports common HTTP methods (GET, POST, DELETE) and handles both JSON and
 * FormData payloads. All methods return typed promises for type-safe responses.
 * 
 * @interface IApiClient
 * 
 * @example
 * ```typescript
 * // Basic usage with the ApiClient implementation
 * const client: IApiClient = new ApiClient();
 * 
 * // GET request
 * const user = await client.get<User>('/api/users/123');
 * 
 * // POST request with JSON
 * const created = await client.post<Folder>('/api/folders', { 
 *   name: 'My Folder' 
 * });
 * 
 * // POST with FormData (file upload)
 * const formData = new FormData();
 * formData.append('file', fileBlob);
 * const uploaded = await client.postFormData<File>('/api/files', formData);
 * 
 * // DELETE request
 * await client.delete<void>('/api/files/123');
 * ```
 * 
 * @remarks
 * - All methods throw {@link ApiError} on non-2xx responses
 * - Generic type parameter `T` ensures type-safe responses
 * - Automatically handles JSON serialization/deserialization
 * - Supports FormData for file uploads
 * - No authentication needed (handled at middleware level)
 * 
 * @see {@link ApiClient} for the concrete implementation
 * @see {@link ApiError} for error handling
 */
export interface IApiClient {
    /**
     * Performs a GET request to the specified endpoint.
     * 
     * @template T - The expected response type
     * @param endpoint - The API endpoint path (e.g., '/api/folders')
     * @returns Promise resolving to the typed response
     * 
     * @throws {@link ApiError} If the response status is not in the 2xx range
     * 
     * @example
     * ```typescript
     * // Fetch a single resource
     * const folder = await client.get<Folder>('/api/folders/123');
     * 
     * // Fetch a list
     * const files = await client.get<File[]>('/api/files?folderId=123');
     * 
     * // With query parameters
     * const data = await client.get<FolderTree>('/api/folders?recursive=all');
     * ```
     */
    get<T>(endpoint: string): Promise<T>;

    /**
     * Performs a POST request with JSON data to the specified endpoint.
     * 
     * @template T - The expected response type
     * @param endpoint - The API endpoint path (e.g., '/api/folders')
     * @param data - Optional request body (will be JSON-stringified)
     * @returns Promise resolving to the typed response
     * 
     * @throws {@link ApiError} If the response status is not in the 2xx range
     * 
     * @example
     * ```typescript
     * // Create a resource
     * const folder = await client.post<Folder>('/api/folders', {
     *   folder_name: 'Documents',
     *   parent_id: null
     * });
     * 
     * // Share a file with expiration
     * const shareInfo = await client.post<ShareResponse>('/api/files/123/share', {
     *   hours: 24
     * });
     * 
     * // POST without body
     * await client.post<void>('/api/process');
     * ```
     */
    post<T>(endpoint: string, data?: any): Promise<T>;

    /**
     * Performs a POST request with FormData to the specified endpoint.
     * 
     * Use this method for file uploads or multipart/form-data requests.
     * The FormData is sent as-is without JSON serialization.
     * 
     * @template T - The expected response type
     * @param endpoint - The API endpoint path (e.g., '/api/files')
     * @param formData - FormData object containing the payload
     * @returns Promise resolving to the typed response
     * 
     * @throws {@link ApiError} If the response status is not in the 2xx range
     * 
     * @example
     * ```typescript
     * // Upload a file
     * const formData = new FormData();
     * formData.append('file', fileBlob, 'document.pdf');
     * const uploaded = await client.postFormData<File>('/api/folders/123/files', formData);
     * 
     * // Upload multiple files
     * const formData = new FormData();
     * formData.append('file1', blob1);
     * formData.append('file2', blob2);
     * const result = await client.postFormData<UploadResult>('/api/upload', formData);
     * ```
     */
    postFormData<T>(endpoint: string, formData: FormData): Promise<T>;

    /**
     * Performs a DELETE request to the specified endpoint.
     * 
     * @template T - The expected response type (often void)
     * @param endpoint - The API endpoint path (e.g., '/api/files/123')
     * @returns Promise resolving to the typed response
     * 
     * @throws {@link ApiError} If the response status is not in the 2xx range
     * 
     * @example
     * ```typescript
     * // Delete a file
     * await client.delete<void>('/api/files/123');
     * 
     * // Delete a folder (recursive)
     * await client.delete<void>('/api/folders/456');
     * 
     * // Delete with response data
     * const result = await client.delete<DeleteResult>('/api/resource/789');
     * console.log(`Deleted ${result.count} items`);
     * ```
     */
    delete<T>(endpoint: string): Promise<T>;
}