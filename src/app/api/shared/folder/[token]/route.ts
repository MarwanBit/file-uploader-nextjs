import { Folder } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/services/folder-service";

/**
 * @fileoverview API route for accessing shared folders via share tokens.
 * 
 * This module provides a public HTTP endpoint for accessing folders that have been
 * shared via share tokens. No authentication is required, but a valid share token is needed.
 * 
 * @module api/shared/folder/[token]
 */

/**
 * Retrieves a shared folder's contents using a share token.
 * 
 * This endpoint allows unauthenticated access to folders that have been shared via
 * share tokens. It validates the token, checks expiration, and optionally returns
 * the complete folder hierarchy if the `recursive=all` query parameter is provided.
 * 
 * @async
 * @function GET
 * 
 * @param request - The incoming HTTP request object
 * @param request.url - May include `?recursive=all` query parameter for full tree
 * @param params - Route parameters
 * @param params.token - The share token for the folder
 * 
 * @returns A NextResponse object containing the folder data
 * 
 * @throws Returns 403 if the share link has expired or is invalid
 * @throws Returns 500 for internal server errors
 * 
 * @example
 * ```typescript
 * // Access a shared folder
 * const response = await fetch('/api/shared/folder/share-token-abc123');
 * const folder = await response.json();
 * 
 * console.log('Folder name:', folder.folder_name);
 * console.log('Files:', folder.files);
 * console.log('Subfolders:', folder.subfolders);
 * console.log('Expires:', folder.expires_at);
 * ```
 * 
 * @example
 * ```typescript
 * // Get complete folder tree
 * const response = await fetch('/api/shared/folder/share-token-abc123?recursive=all');
 * const folderTree = await response.json();
 * 
 * // folderTree includes all nested subfolders and files
 * function displayTree(folder: Folder, depth: number = 0) {
 *   console.log('  '.repeat(depth) + folder.folder_name);
 *   folder.files?.forEach(file => {
 *     console.log('  '.repeat(depth + 1) + '📄 ' + file.file_name);
 *   });
 *   folder.subfolders?.forEach(sub => displayTree(sub, depth + 1));
 * }
 * displayTree(folderTree);
 * ```
 * 
 * @example
 * ```typescript
 * // Check if share link is valid
 * async function validateShareLink(token: string) {
 *   try {
 *     const response = await fetch(`/api/shared/folder/${token}`);
 *     
 *     if (response.status === 403) {
 *       const error = await response.json();
 *       return { valid: false, reason: error.error };
 *     }
 *     
 *     const folder = await response.json();
 *     const isExpired = new Date(folder.expires_at) < new Date();
 *     
 *     return { 
 *       valid: !isExpired, 
 *       folder,
 *       expiresAt: folder.expires_at 
 *     };
 *   } catch (error) {
 *     return { valid: false, reason: 'Network error' };
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Display shared folder contents in UI
 * async function loadSharedFolder(token: string) {
 *   const response = await fetch(`/api/shared/folder/${token}?recursive=all`);
 *   
 *   if (!response.ok) {
 *     throw new Error('Share link expired or invalid');
 *   }
 *   
 *   const folder = await response.json();
 *   
 *   // Render folder structure
 *   return {
 *     name: folder.folder_name,
 *     fileCount: folder.files?.length || 0,
 *     folderCount: folder.subfolders?.length || 0,
 *     expiresAt: new Date(folder.expires_at)
 *   };
 * }
 * ```
 * 
 * @remarks
 * - **No authentication required** - public endpoint
 * - Validates share token and expiration time
 * - Without `recursive=all`: Returns folder with immediate children only
 * - With `recursive=all`: Returns complete nested folder/file hierarchy
 * - Share token must not be expired (checked against folder's expires_at)
 * - Uses {@link FolderService.getFolderByShareToken} for token lookup
 * - Uses {@link FolderService.getFolderRecursively} when recursive flag is set
 * 
 * @see {@link FolderService.getFolderByShareToken} for share token validation
 * @see {@link FolderService.getFolderRecursively} for recursive folder fetching
 * @see POST /api/folders/[folderId]/share for creating folder share links
 * @see GET /api/shared/file/[fileId]/[token] for accessing files in shared folders
 * 
 * @status 200 - Successfully retrieved shared folder
 * @status 403 - Share link expired or invalid
 * @status 500 - Internal server error
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }>}
) {
        const { token } = await params;

        // let's get the url and the searchParams
        const searchParams = request.nextUrl.searchParams;
        const recursive = searchParams.get("recursive");

        // get the folder
        let folder: Folder | null = await FolderService.getFolderByShareToken(token);
        // if we set the recursive flag, make sure to get the root folder recursively!
        if (recursive && recursive === "all") {
            folder = await FolderService.getFolderRecursively(folder?.id as string) as Folder;
        }

        if (!folder || folder.expires_at! < new Date()) {
            return NextResponse.json(
                { error: "Link expired or invalid" },
                { status: 403 },
            );
        }
        return NextResponse.json(folder);
    }