import { FileService } from "@/services/file-service";

/**
 * @fileoverview API routes for individual file operations.
 * 
 * This module provides HTTP endpoints for retrieving file URLs and deleting files.
 * These endpoints operate on individual files identified by their unique ID.
 * 
 * @module api/files/[id]
 */

/**
 * Retrieves a presigned URL for accessing a specific file.
 * 
 * This endpoint generates a temporary presigned URL that allows direct access to a file
 * stored in S3. The URL is valid for approximately 67 minutes (4000 seconds) and does
 * not require authentication to use once generated.
 * 
 * @async
 * @function GET
 * 
 * @param request - The incoming HTTP request object
 * @param params - Route parameters
 * @param params.id - The unique identifier of the file
 * 
 * @returns A Response object containing the presigned URL
 * 
 * @throws Returns 500 if the file is not found or URL generation fails
 * 
 * @example
 * ```typescript
 * // Get a presigned URL for a file
 * const response = await fetch('/api/files/file-123');
 * const data = await response.json();
 * console.log('Download URL:', data.url);
 * 
 * // The URL can now be used to download the file
 * window.location.href = data.url;
 * ```
 * 
 * @example
 * ```typescript
 * // Using with error handling
 * try {
 *   const response = await fetch('/api/files/abc-def-123');
 *   if (!response.ok) throw new Error('File not found');
 *   
 *   const { url } = await response.json();
 *   // Open file in new tab
 *   window.open(url, '_blank');
 * } catch (error) {
 *   console.error('Failed to get file URL:', error);
 * }
 * ```
 * 
 * @remarks
 * - Does not require authentication (use with caution)
 * - The presigned URL expires after ~67 minutes
 * - File must exist in both database and S3 storage
 * - Uses {@link FileService.getFileUrl} internally
 * 
 * @see {@link FileService.getFileUrl} for the underlying implementation
 * @see {@link DELETE} for deleting files
 * 
 * @status 200 - Successfully generated presigned URL
 * @status 500 - File not found or internal error
 */
export async function GET(
    request: Request,
    { params }: { params : Promise<{ id: string }> }) {
        try {
            const { id } = await params;
            const message = await FileService.getFileUrl(id);
            return new Response(JSON.stringify(message), {
                headers: {"Content-Type": "application/json"},
            });
        } catch (error) {
            console.error("Error creating folder info file:", error);
            throw new Error(`Failed to create folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
}

/**
 * Permanently deletes a file from both S3 storage and the database.
 * 
 * This endpoint performs a complete deletion of a file, removing it from both
 * S3 storage and the database. This operation is irreversible.
 * 
 * @async
 * @function DELETE
 * 
 * @param request - The incoming HTTP request object
 * @param params - Route parameters
 * @param params.id - The unique identifier of the file to delete
 * 
 * @returns A Response object containing a success message
 * 
 * @throws Returns 500 if the file is not found or deletion fails
 * 
 * @example
 * ```typescript
 * // Delete a file
 * const response = await fetch('/api/files/file-456', {
 *   method: 'DELETE'
 * });
 * 
 * const result = await response.json();
 * console.log(result.message); // "deletion successful!"
 * ```
 * 
 * @example
 * ```typescript
 * // With error handling
 * async function deleteFile(fileId: string) {
 *   try {
 *     const response = await fetch(`/api/files/${fileId}`, {
 *       method: 'DELETE'
 *     });
 *     
 *     if (!response.ok) {
 *       throw new Error('Failed to delete file');
 *     }
 *     
 *     const result = await response.json();
 *     console.log('File deleted successfully:', result);
 *   } catch (error) {
 *     console.error('Error deleting file:', error);
 *   }
 * }
 * ```
 * 
 * @remarks
 * - This operation is irreversible
 * - Deletes from both S3 and database
 * - Does not require authentication (consider adding auth in production)
 * - Uses {@link FileService.deleteFile} internally
 * 
 * @see {@link FileService.deleteFile} for the underlying implementation
 * @see {@link GET} for retrieving file URLs
 * 
 * @status 200 - Successfully deleted file
 * @status 500 - File not found or deletion error
 */
export async function DELETE(
    request: Request,
    { params }: { params : Promise<{ id : string}> }) {
        try {
            const { id } = await params;
            const message = await FileService.deleteFile(id);
            return new Response(JSON.stringify(message), {
                headers: {"Content-Type": "application/json"},
            });
        } catch (error) {
            console.error("Error deleting file: ", error);
            throw new Error(`Failed to delete file:  ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
}