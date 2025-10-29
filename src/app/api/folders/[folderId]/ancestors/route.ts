import { NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';
import { FolderService } from "@/services/folder-service";

/**
 * @fileoverview API route for retrieving folder breadcrumb/ancestry.
 * 
 * This module provides an HTTP endpoint for getting the complete ancestor chain
 * of a folder, useful for building breadcrumb navigation.
 * 
 * @module api/folders/[folderId]/ancestors
 */

/**
 * Retrieves the complete ancestor chain for a folder (breadcrumb trail).
 * 
 * This endpoint returns an array of folders representing the path from the root folder
 * to the specified folder. This is commonly used to build breadcrumb navigation UI.
 * 
 * @async
 * @function GET
 * 
 * @param request - The incoming HTTP request object
 * @param params - Route parameters
 * @param params.folderId - The unique identifier of the folder whose ancestors to retrieve
 * 
 * @returns A NextResponse object containing the ancestor array and success message
 * 
 * @throws Returns 401 if the user is not authenticated
 * @throws Returns 500 for internal server errors
 * 
 * @example
 * ```typescript
 * // Get breadcrumb trail for a folder
 * const response = await fetch('/api/folders/deep-folder-id/ancestors');
 * const data = await response.json();
 * 
 * console.log(data.message); // "Everything is working!"
 * console.log(data.ancestors);
 * // [
 * //   { id: "root-id", folder_name: "JohnDoe", parent_folder: null },
 * //   { id: "docs-id", folder_name: "Documents", parent_folder: "root-id" },
 * //   { id: "work-id", folder_name: "Work", parent_folder: "docs-id" },
 * //   { id: "deep-folder-id", folder_name: "Projects", parent_folder: "work-id" }
 * // ]
 * ```
 * 
 * @example
 * ```typescript
 * // Build breadcrumb UI
 * async function buildBreadcrumb(folderId: string) {
 *   const response = await fetch(`/api/folders/${folderId}/ancestors`);
 *   const { ancestors } = await response.json();
 *   
 *   return ancestors.map((folder, index) => ({
 *     label: folder.folder_name,
 *     href: `/folders/${folder.id}`,
 *     isLast: index === ancestors.length - 1
 *   }));
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Check folder depth
 * const response = await fetch(`/api/folders/${folderId}/ancestors`);
 * const { ancestors } = await response.json();
 * const depth = ancestors.length - 1; // Subtract 1 for root
 * console.log(`Folder is ${depth} levels deep`);
 * ```
 * 
 * @remarks
 * - Requires valid Clerk authentication
 * - Returns ancestors in order from root to current folder
 * - Always includes the root folder as the first element
 * - The last element in the array is the requested folder itself
 * - Uses {@link FolderService.getAncestors} internally
 * - Useful for breadcrumb navigation and folder path display
 * 
 * @see {@link FolderService.getAncestors} for the underlying implementation
 * @see GET /api/folders/[folderId] for retrieving folder details
 * 
 * @status 200 - Successfully retrieved ancestors
 * @status 401 - User not authenticated
 * @status 500 - Internal server error
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ folderId: string }> }
) {
    try {
        const folderId = (await params).folderId;
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        const ancestors = await FolderService.getAncestors(folderId, user);

        return NextResponse.json({
            message: "Everything is working!",
            ancestors,
        });


    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json(
            {message: "Internal Server error"},
            {status: 500},
        );
    }
}