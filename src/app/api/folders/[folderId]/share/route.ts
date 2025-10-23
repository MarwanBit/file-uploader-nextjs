import { NextResponse } from "next/server";
import { FolderService } from "@/services/folder-service";

/**
 * @fileoverview API route for sharing folders.
 * 
 * This module provides an HTTP endpoint for generating shareable links to folders
 * with custom expiration times. The share link provides access to the folder and all its contents.
 * 
 * @module api/folders/[folderId]/share
 */

/**
 * Creates a shareable link for a folder with a custom expiration time.
 * 
 * This endpoint generates a unique share token that allows temporary access to a folder
 * and all its contents (files and subfolders). The share link includes the application's
 * origin URL for easy sharing.
 * 
 * @async
 * @function POST
 * 
 * @param request - The incoming HTTP request object
 * @param request.body - JSON body with the following structure:
 * ```json
 * {
 *   "hours": 24
 * }
 * ```
 * @param request.headers - Must include "origin" header for constructing the share URL
 * @param params - Route parameters
 * @param params.folderId - The unique identifier of the folder to share
 * 
 * @returns A NextResponse object containing the share URL, expiration time, and success message
 * 
 * @throws Returns 400 if hours is invalid (missing or <= 0)
 * @throws Returns 500 if the folder is not found or sharing fails
 * 
 * @example
 * ```typescript
 * // Share a folder for 48 hours
 * const response = await fetch('/api/folders/folder-123/share', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ hours: 48 })
 * });
 * 
 * const shareInfo = await response.json();
 * console.log('Share URL:', shareInfo.url);
 * // "https://yourapp.com/shared/folder/abc123token"
 * console.log('Expires:', shareInfo.expires_at);
 * console.log('Message:', shareInfo.message); // "Successful"
 * ```
 * 
 * @example
 * ```typescript
 * // Quick share for 24 hours
 * async function shareFolder(folderId: string, hours: number = 24) {
 *   try {
 *     const response = await fetch(`/api/folders/${folderId}/share`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ hours })
 *     });
 *     
 *     if (!response.ok) {
 *       const error = await response.json();
 *       throw new Error(error.error || 'Failed to share folder');
 *     }
 *     
 *     const { url, expires_at } = await response.json();
 *     return { url, expires_at };
 *   } catch (error) {
 *     console.error('Share error:', error);
 *     throw error;
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Share with validation
 * const response = await fetch('/api/folders/folder-456/share', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ hours: 0 }) // Invalid!
 * });
 * 
 * if (response.status === 400) {
 *   const error = await response.json();
 *   console.error(error.error); // "Invalid expiration time"
 * }
 * ```
 * 
 * @remarks
 * - Does not require authentication (folder ID serves as authorization)
 * - Generates a unique share token stored in the database
 * - The share URL format: `{origin}/shared/folder/{token}`
 * - Grants access to folder and ALL nested content (files and subfolders)
 * - Share token is stored with the folder's expiration time
 * - Uses {@link FolderService.shareFolder} internally
 * - Falls back to "http://localhost:3000" if origin header is missing
 * 
 * @see {@link FolderService.shareFolder} for the underlying implementation
 * @see GET /api/shared/folder/[token] for accessing shared folders
 * @see POST /api/files/[id]/share for sharing individual files
 * 
 * @status 200 - Successfully created share link
 * @status 400 - Invalid hours parameter
 * @status 500 - Folder not found or internal error
 */
export async function POST(
    request: Request,
    { params } : { params: Promise<{ folderId : string }>}) {
        try {
            const { folderId } = await params;
            const { hours } = await request.json();
            if (!hours || hours <= 0) {
                return NextResponse.json(
                    {error: "Invalid expiration time"},
                    {status: 400},
                );
            }
            const origin = request.headers.get("origin") || "http://localhost:3000";
            const res = await FolderService.shareFolder(folderId, hours, origin);
            return NextResponse.json({
                message: "Successful",
                url: res["url"],
                expires_at: res["expires_at"],
            });
        } catch (error) {
            console.error("Error creating folder info file: ", error);
            throw new Error(`Failed to delete folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
}