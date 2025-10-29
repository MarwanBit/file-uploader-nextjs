import { auth, clerkClient } from '@clerk/nextjs/server';
import { FolderService } from "@/services/folder-service";

/**
 * @fileoverview API route for uploading files to folders.
 * 
 * This module provides an HTTP endpoint for uploading files to specific folders.
 * Files are stored in S3 and their metadata is saved in the database.
 * 
 * @module api/folders/[folderId]/files
 */

/**
 * Uploads a file to a specific folder.
 * 
 * This endpoint handles file uploads to a designated folder. The file is uploaded to
 * S3 storage and its metadata is saved in the database. The file is associated with
 * both the target folder and the user's root folder.
 * 
 * @async
 * @function POST
 * 
 * @param request - The incoming HTTP request object
 * @param request.body - FormData containing the file to upload
 * ```typescript
 * // FormData structure:
 * formData.append('file', fileObject);
 * ```
 * @param params - Route parameters
 * @param params.folderId - The unique identifier of the target folder
 * 
 * @returns A Response object containing a success message
 * 
 * @throws Returns 401 if the user is not authenticated
 * @throws Returns 500 if root/current folder not found or upload fails
 * 
 * @example
 * ```typescript
 * // Upload a file to a folder
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * 
 * const response = await fetch('/api/folders/folder-123/files', {
 *   method: 'POST',
 *   body: formData
 * });
 * 
 * const result = await response.json();
 * console.log(result.message); // "Worked as expected!"
 * ```
 * 
 * @example
 * ```typescript
 * // Complete upload handler with progress
 * async function uploadFile(folderId: string, file: File) {
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   
 *   try {
 *     const response = await fetch(`/api/folders/${folderId}/files`, {
 *       method: 'POST',
 *       body: formData
 *     });
 *     
 *     if (!response.ok) {
 *       throw new Error('Upload failed');
 *     }
 *     
 *     const result = await response.json();
 *     console.log('Upload successful:', result);
 *     return result;
 *   } catch (error) {
 *     console.error('Upload error:', error);
 *     throw error;
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Multiple file upload
 * const files = Array.from(fileInput.files);
 * for (const file of files) {
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   
 *   await fetch(`/api/folders/${folderId}/files`, {
 *     method: 'POST',
 *     body: formData
 *   });
 * }
 * ```
 * 
 * @remarks
 * - Requires valid Clerk authentication
 * - Accepts multipart/form-data with a 'file' field
 * - File is stored in S3 with a structured key path
 * - Creates database record with file metadata
 * - Uses {@link FolderService.uploadFileToFolder} internally
 * - The file buffer is read into memory before upload
 * 
 * @see {@link FolderService.uploadFileToFolder} for the underlying implementation
 * @see {@link FolderService.getFolder} for folder retrieval
 * @see DELETE /api/files/[id] for deleting uploaded files
 * 
 * @status 200 - Successfully uploaded file
 * @status 401 - User not authenticated
 * @status 500 - Folder not found or upload error
 */
export async function POST(
    request: Request,
    { params }: { params : Promise<{ folderId: string }> }) {
        try {
            const { folderId } = await params;
            const { userId } = await auth();
            
            if (!userId) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: {"Content-Type": "application/json"},
                });
            }
            
            const client = await clerkClient();
            const user = await client.users.getUser(userId);

            const curr_folder = await FolderService.getFolder(folderId);
            const root_folder = await FolderService.getFolder(user.publicMetadata.root_folder as string);

            const formData = await request.formData();
            const file = formData.get("file") as File;
            const buffer = Buffer.from(await file.arrayBuffer());

            const res = await FolderService.uploadFileToFolder(root_folder, curr_folder, file, buffer, user);

            const message = {
                message: "Worked as expected!"
            }
            // now return if everything is successful
            return new Response(JSON.stringify(message), {
                headers: {"Content-Type": "application/json"},
            });
        } catch (error) {
            console.error("Error: ", error);
            return new Response(JSON.stringify({ error: 'Internal server error '}), {
                status: 500,
                headers: {"Content-Type": "application/json"},
            });
        }
}