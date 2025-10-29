import { auth, clerkClient } from '@clerk/nextjs/server';
import { FolderService } from '@/services/folder-service';

/**
 * @fileoverview API routes for folder management operations.
 * 
 * This module provides HTTP endpoints for creating and retrieving user folders.
 * All endpoints require authentication via Clerk and automatically manage user root folders.
 * 
 * @module api/folders
 */

/**
 * Retrieves the user's root folder or recursively fetches the entire folder tree.
 * 
 * This endpoint automatically creates a root folder for the user if one doesn't exist.
 * It supports two modes of operation controlled by the `recursive` query parameter:
 * - Without parameter: Returns only the root folder metadata
 * - With `recursive=all`: Returns the complete folder tree including all subfolders and files
 * 
 * @async
 * @function GET
 * 
 * @param request - The incoming HTTP request object
 * @param request.url - Must include the base URL; may include `?recursive=all` query parameter
 * 
 * @returns A Response object containing the folder data as JSON
 * 
 * @throws Returns 401 if the user is not authenticated
 * @throws Returns 500 if the root folder cannot be found or created
 * @throws Returns 500 for any internal server errors
 * 
 * @example
 * ```typescript
 * // Get root folder only
 * const response = await fetch('/api/folders');
 * const rootFolder = await response.json();
 * // { id: "...", folder_name: "JohnDoe", owner: "...", ... }
 * ```
 * 
 * @example
 * ```typescript
 * // Get complete folder tree recursively
 * const response = await fetch('/api/folders?recursive=all');
 * const folderTree = await response.json();
 * // {
 * //   id: "...",
 * //   folder_name: "JohnDoe",
 * //   subfolders: [
 * //     { folder_name: "Documents", files: [...], subfolders: [...] },
 * //     { folder_name: "Images", files: [...], subfolders: [...] }
 * //   ],
 * //   files: [...]
 * // }
 * ```
 * 
 * @remarks
 * - Requires valid Clerk authentication session
 * - Root folder is automatically created on first access
 * - The recursive mode uses {@link FolderService.getFolderRecursively} which performs nested queries
 * - Root folder ID is stored in Clerk's user public metadata
 * 
 * @see {@link FolderService.createRootFolder} for root folder creation logic
 * @see {@link FolderService.getFolderRecursively} for recursive folder fetching
 * 
 * @status 200 - Successfully retrieved folder data
 * @status 401 - User not authenticated
 * @status 500 - Internal server error or root folder not found
 */
export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized'}), {
                status: 401,
                headers: {"Content-Type": "application/json"},
            });
        }

        const client = await clerkClient();
        let user = await client.users.getUser(userId);

        const root_folder = await FolderService.createRootFolder(user, userId);
        
        // Get the updated user with the root folder ID
        user = await client.users.getUser(userId);

        const url = new URL(request.url);
        const recursive = url.searchParams.get('recursive');

        if (recursive === "all") {
            const root_folder_id = user.publicMetadata.root_folder as string || root_folder.id;
            if (!root_folder_id) {
                return new Response(JSON.stringify({ error: 'Root folder not found' }), {
                    status: 500,
                    headers: {"Content-Type": "application/json"},
                });
            }
            const root_folder_data = await FolderService.getFolderRecursively(root_folder_id);
            return new Response(JSON.stringify(root_folder_data), {
                headers: {"Content-Type": "application/json"},
            });
        }

        return new Response(JSON.stringify(root_folder), {
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
 * Creates a new subfolder in the user's root folder.
 * 
 * This endpoint creates a subfolder within the user's root directory. It automatically
 * ensures the root folder exists before creating the subfolder. The new folder is
 * created both in the database and as a placeholder object in S3 storage.
 * 
 * @async
 * @function POST
 * 
 * @param request - The incoming HTTP request object containing the folder details
 * @param request.body - JSON body with the following structure:
 * ```json
 * {
 *   "folder_name": "My New Folder"
 * }
 * ```
 * 
 * @returns A Response object containing the newly created folder data as JSON
 * 
 * @throws Returns 401 if the user is not authenticated
 * @throws Returns 500 if the root folder cannot be found or created
 * @throws Returns 500 for any internal server errors (e.g., duplicate folder name)
 * 
 * @example
 * ```typescript
 * // Create a new folder
 * const response = await fetch('/api/folders', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ folder_name: 'My Documents' })
 * });
 * 
 * const newFolder = await response.json();
 * console.log('Created folder:', newFolder);
 * // {
 * //   id: "folder-123",
 * //   folder_name: "My Documents",
 * //   owner: "user-456",
 * //   parent_folder: "root-folder-id",
 * //   s3_key: "user-folder/My Documents/",
 * //   created_at: "2024-01-01T00:00:00.000Z",
 * //   files: [],
 * //   subfolders: []
 * // }
 * ```
 * 
 * @example
 * ```typescript
 * // Handle errors
 * const response = await fetch('/api/folders', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ folder_name: 'Documents' })
 * });
 * 
 * if (!response.ok) {
 *   const error = await response.json();
 *   console.error('Failed to create folder:', error);
 *   // Might be duplicate folder name or other error
 * }
 * ```
 * 
 * @remarks
 * - Requires valid Clerk authentication session
 * - Root folder is automatically created if it doesn't exist
 * - Folder names must be unique within the same parent folder (enforced by database constraints)
 * - Creates a placeholder `.folderinfo` file in S3 for the new folder
 * - The folder is created as a direct child of the root folder
 * 
 * @see {@link FolderService.createRootFolder} for root folder creation
 * @see {@link FolderService.createSubfolder} for subfolder creation logic
 * @see {@link FolderService.getFolder} for folder retrieval
 * 
 * @status 200 - Successfully created folder
 * @status 401 - User not authenticated
 * @status 500 - Internal server error, root folder issues, or duplicate folder name
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized '}), {
                status: 401,
                headers: {"Content-Type": "application/json"},
            });
        }

        const client = await clerkClient();
        let user = await client.users.getUser(userId);
        
        // User metadata retrieved successfully

        const body = await request.json();
        const { folder_name } = body;

        // Ensure root folder exists first
        const root_folder = await FolderService.createRootFolder(user, userId);
        
        // Get updated user metadata
        user = await client.users.getUser(userId);
        
        // Use the root folder ID from metadata or fallback to the created folder
        const root_folder_id = user.publicMetadata.root_folder as string || root_folder.id;
        
        if (!root_folder_id) {
            return new Response(JSON.stringify({
                message: "ERROR, ROOT FOLDER ID IS NULL!",
            }), {
                headers: {"Content-Type": "application/json"},
                status: 500,
            });
        }
        
        const final_root_folder = await FolderService.getFolder(root_folder_id);

        if (!final_root_folder) {
            return new Response(JSON.stringify({
                message: "ERROR, ROOT FOLDER IS NULL!",
            }), {
                headers: {"Content-Type": "application/json"},
                status: 500,
            });
        }

        // create the subfolder
        const new_folder = await FolderService.createSubfolder(final_root_folder, folder_name, final_root_folder, userId);

        return new Response(JSON.stringify(new_folder), {
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