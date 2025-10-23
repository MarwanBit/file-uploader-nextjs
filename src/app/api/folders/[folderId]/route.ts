import { auth, clerkClient } from '@clerk/nextjs/server';
import { FolderService } from "@/services/folder-service";

/**
 * @fileoverview API routes for individual folder operations.
 * 
 * This module provides HTTP endpoints for retrieving, creating subfolders within,
 * and deleting specific folders by their ID.
 * 
 * @module api/folders/[folderId]
 */

/**
 * Retrieves a specific folder by ID, optionally with its complete subfolder tree.
 * 
 * This endpoint fetches folder metadata and can optionally return the entire folder
 * hierarchy recursively. It supports two modes controlled by the `recursive` query parameter.
 * 
 * @async
 * @function GET
 * 
 * @param request - The incoming HTTP request object
 * @param request.url - May include `?recursive=all` query parameter for recursive fetching
 * @param params - Route parameters
 * @param params.folderId - The unique identifier of the folder to retrieve
 * 
 * @returns A Response object containing the folder data as JSON
 * 
 * @throws Returns 500 for internal server errors
 * 
 * @example
 * ```typescript
 * // Get folder metadata only
 * const response = await fetch('/api/folders/folder-123');
 * const folder = await response.json();
 * console.log('Folder:', folder.folder_name);
 * console.log('Files:', folder.files.length);
 * console.log('Subfolders:', folder.subfolders.length);
 * ```
 * 
 * @example
 * ```typescript
 * // Get complete folder tree recursively
 * const response = await fetch('/api/folders/folder-456?recursive=all');
 * const folderTree = await response.json();
 * // Returns nested structure with all subfolders and files
 * ```
 * 
 * @remarks
 * - Does not require authentication
 * - Without `recursive=all`: Returns folder with immediate children only
 * - With `recursive=all`: Returns complete nested folder/file hierarchy
 * - Uses {@link FolderService.getFolder} or {@link FolderService.getFolderRecursively}
 * 
 * @see {@link FolderService.getFolder} for non-recursive retrieval
 * @see {@link FolderService.getFolderRecursively} for recursive retrieval
 * @see {@link DELETE} for deleting folders
 * @see {@link POST} for creating subfolders
 * 
 * @status 200 - Successfully retrieved folder
 * @status 500 - Internal server error
 */
export async function GET(
    request: Request,
    { params }: { params : Promise<{ folderId: string }> }) {
        try {
            const { folderId } = await params;
            const folder = await FolderService.getFolder(folderId);
            const url = new URL(request.url);
            const recursive = url.searchParams.get('recursive');

            if (recursive === "all") {
                const res_folder = await FolderService.getFolderRecursively(folder?.id as string);
                return new Response(JSON.stringify(res_folder), {
                    headers: {"Content-Type": "application/json"},
                });
            }
        
           return new Response(JSON.stringify(folder), {
                headers: {"Content-Type": "application/json"},
           });

        } catch (error) {
            console.error("Error: ", error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: {"Content-Type": "application/json"},
            });
        }
}

/**
 * Recursively deletes a folder and all its contents from both S3 and the database.
 * 
 * This endpoint performs a complete recursive deletion of a folder, including all
 * subfolders and files. The operation removes data from both S3 storage and the database.
 * 
 * @async
 * @function DELETE
 * 
 * @param req - The incoming HTTP request object
 * @param params - Route parameters
 * @param params.folderId - The unique identifier of the folder to delete
 * 
 * @returns A Response object containing a success message
 * 
 * @throws Returns 500 for internal server errors
 * 
 * @example
 * ```typescript
 * // Delete a folder and all its contents
 * const response = await fetch('/api/folders/folder-789', {
 *   method: 'DELETE'
 * });
 * 
 * const result = await response.json();
 * console.log(result.message);
 * ```
 * 
 * @example
 * ```typescript
 * // With error handling
 * async function deleteFolder(folderId: string) {
 *   try {
 *     const response = await fetch(`/api/folders/${folderId}`, {
 *       method: 'DELETE'
 *     });
 *     
 *     if (response.ok) {
 *       console.log('Folder and all contents deleted successfully');
 *     }
 *   } catch (error) {
 *     console.error('Failed to delete folder:', error);
 *   }
 * }
 * ```
 * 
 * @remarks
 * - **IRREVERSIBLE OPERATION** - deletes all subfolders and files recursively
 * - Does not require authentication (consider adding in production)
 * - Removes data from both S3 and database
 * - Uses {@link FolderService.deleteFolderRecursively} internally
 * - Be cautious when using this endpoint
 * 
 * @see {@link FolderService.deleteFolderRecursively} for the underlying implementation
 * @see {@link GET} for retrieving folder data
 * 
 * @status 200 - Successfully deleted folder
 * @status 500 - Internal server error
 */
export async function DELETE(
    req: Request,
    { params }: { params : Promise<{ folderId: string }> }) {
        try {
            const { folderId } = await params;
            await FolderService.deleteFolderRecursively(folderId);
            const message = {
                message : "ENDPOINT DELETE /api/folders/:folderId not implemented yet :(",
            };
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

/**
 * Creates a new subfolder within an existing folder.
 * 
 * This endpoint creates a subfolder within the specified parent folder. The new folder
 * is created in both the database and S3 storage (as a placeholder object).
 * 
 * @async
 * @function POST
 * 
 * @param request - The incoming HTTP request object
 * @param request.body - JSON body with the following structure:
 * ```json
 * {
 *   "folder_name": "New Subfolder Name"
 * }
 * ```
 * @param params - Route parameters
 * @param params.folderId - The unique identifier of the parent folder
 * 
 * @returns A Response object containing a success message
 * 
 * @throws Returns 401 if the user is not authenticated
 * @throws Returns 500 if parent/root folder not found or creation fails
 * 
 * @example
 * ```typescript
 * // Create a subfolder inside an existing folder
 * const response = await fetch('/api/folders/parent-folder-123', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ folder_name: 'Reports' })
 * });
 * 
 * const result = await response.json();
 * console.log(result.message);
 * ```
 * 
 * @example
 * ```typescript
 * // Create nested folder structure
 * async function createNestedFolder(parentId: string, folderName: string) {
 *   try {
 *     const response = await fetch(`/api/folders/${parentId}`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ folder_name: folderName })
 *     });
 *     
 *     if (!response.ok) throw new Error('Failed to create folder');
 *     
 *     const result = await response.json();
 *     return result;
 *   } catch (error) {
 *     console.error('Error creating subfolder:', error);
 *   }
 * }
 * ```
 * 
 * @remarks
 * - Requires valid Clerk authentication
 * - Folder names must be unique within the same parent folder
 * - Creates a placeholder `.folderinfo` file in S3
 * - Both parent folder and root folder must exist
 * - Uses {@link FolderService.createSubfolder} internally
 * 
 * @see {@link FolderService.createSubfolder} for the underlying implementation
 * @see {@link FolderService.getFolder} for retrieving folder data
 * @see POST /api/folders for creating folders in root directory
 * 
 * @status 200 - Successfully created subfolder
 * @status 401 - User not authenticated
 * @status 500 - Parent/root folder not found or internal error
 */
export async function POST(
    request: Request,
    { params }: { params : Promise<{ folderId : string}> }) {
        try {
            const { userId } = await auth();
            const { folderId } = await params;

            if (!userId) {
                return new Response(JSON.stringify({ error: 'Unauthorized '}), {
                    status: 401,
                    headers: {"Content-Type": "application/json"},
                });
            }

            const client = await clerkClient();
            const user = await client.users.getUser(userId);

            const body = await request.json();
            const { folder_name } = body;

            // now let's get the folders
            const parent_folder = await FolderService.getFolder(folderId);
            const root_folder = await FolderService.getFolder(user.publicMetadata.root_folder as string);

            if (!parent_folder || !root_folder) {
                return new Response(JSON.stringify({
                    message: "ERROR, ROOT FOLDER IS NULL or PARENT FOLDER IS NULL!",
                }), {
                    headers: {"Content-Type": "application/json"},
                    status: 500,
                });
            }

            // now let's create this new folder
            await FolderService.createSubfolder(parent_folder, folder_name, root_folder, userId);

            const message = {
                message : "ENDPOINT POST /api/folders not implemented yet :(",
            };
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