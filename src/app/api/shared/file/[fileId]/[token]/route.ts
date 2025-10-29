import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/services/folder-service";
import { FileService } from "@/services/file-service";
import { type File } from "@/types/types";

/**
 * @fileoverview API route for accessing shared files via share tokens.
 * 
 * This module provides a public HTTP endpoint for accessing files that have been
 * shared via folder share tokens. No authentication is required, but a valid
 * share token and file ID are needed.
 * 
 * @module api/shared/file/[fileId]/[token]
 */

/**
 * Retrieves a presigned URL for a file using a folder share token.
 * 
 * This endpoint allows unauthenticated access to files within a shared folder.
 * It validates the share token, checks expiration, verifies the file exists within
 * the shared folder hierarchy, and generates a presigned URL for download.
 * 
 * @async
 * @function GET
 * 
 * @param request - The incoming HTTP request object
 * @param params - Route parameters
 * @param params.fileId - The unique identifier of the file to access
 * @param params.token - The share token for the folder containing the file
 * 
 * @returns A NextResponse object containing the file access URL and metadata
 * 
 * @throws Returns 403 if the share link has expired
 * @throws Returns 403 if the file is not accessible through the share link
 * @throws Returns 404 if the share token is invalid or file not found
 * @throws Returns 500 for internal server errors
 * 
 * @example
 * ```typescript
 * // Access a shared file
 * const response = await fetch('/api/shared/file/file-123/share-token-abc');
 * const data = await response.json();
 * 
 * console.log('File URL:', data.url);
 * console.log('File name:', data.file_name);
 * console.log('Expires at:', data.expires_at);
 * console.log('Message:', data.message); // "File access granted"
 * ```
 * 
 * @example
 * ```typescript
 * // Download a shared file
 * async function downloadSharedFile(fileId: string, token: string) {
 *   try {
 *     const response = await fetch(`/api/shared/file/${fileId}/${token}`);
 *     
 *     if (!response.ok) {
 *       const error = await response.json();
 *       throw new Error(error.error);
 *     }
 *     
 *     const { url, file_name } = await response.json();
 *     
 *     // Download the file
 *     const fileResponse = await fetch(url);
 *     const blob = await fileResponse.blob();
 *     
 *     // Trigger download
 *     const a = document.createElement('a');
 *     a.href = URL.createObjectURL(blob);
 *     a.download = file_name;
 *     a.click();
 *   } catch (error) {
 *     console.error('Download failed:', error);
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Check if shared link is still valid
 * const response = await fetch(`/api/shared/file/${fileId}/${token}`);
 * 
 * if (response.status === 403) {
 *   const error = await response.json();
 *   if (error.error.includes('expired')) {
 *     console.log('This share link has expired');
 *   } else {
 *     console.log('File not accessible through this share link');
 *   }
 * }
 * ```
 * 
 * @remarks
 * - **No authentication required** - public endpoint
 * - Validates share token and expiration time
 * - Verifies file is within the shared folder's hierarchy
 * - Returns presigned S3 URL valid for temporary access
 * - Uses {@link FolderService.getFolderByShareToken} to retrieve the shared folder
 * - Uses {@link FileService.getFileFromShareToken} to validate and generate URL
 * - The share token belongs to the folder, not the individual file
 * 
 * @see {@link FolderService.getFolderByShareToken} for share token validation
 * @see {@link FileService.getFileFromShareToken} for file access validation
 * @see POST /api/folders/[folderId]/share for creating folder share links
 * 
 * @status 200 - Successfully retrieved file URL
 * @status 403 - Share link expired or file not accessible
 * @status 404 - Invalid share token or file not found
 * @status 500 - Internal server error
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string,  token: string }>}
) {
    try {
        const { fileId, token } = await params;
        const rootFolder = await FolderService.getFolderByShareToken(token);
        const file: File | null = await FileService.getFile(fileId);

        if (!rootFolder) { 
            return NextResponse.json(
                { error: "Invalid share token" },
                { status: 404 }
            );
        }

        if (rootFolder.expires_at && rootFolder.expires_at < new Date()) {
            return NextResponse.json(
                { error: "Share link has expired "},
                { status: 403 }
            );
        }

        if (!file) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        const result = await FileService.getFileFromShareToken(rootFolder, file);

        if (result && result.url && result.expires_at) {
            return NextResponse.json({
                message: "File access granted",
                url: result.url,
                file_name: file.file_name,
                expires_at: result.expires_at,
            });
        } else {
            return NextResponse.json(
                { error: "File not accesible through this share link" },
                { status: 403 }    
            );
        }   
    } catch (error) {
        console.error("Error sharing file: ", error);
        throw new Error(`Failed to share file:  ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}