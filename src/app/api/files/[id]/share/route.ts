import { NextResponse } from "next/server";
import { FileService } from "@/services/file-service";

/**
 * @fileoverview API route for sharing files.
 * 
 * This module provides an HTTP endpoint for generating shareable links to files
 * with custom expiration times.
 * 
 * @module api/files/[id]/share
 */

/**
 * Creates a shareable link for a file with a custom expiration time.
 * 
 * This endpoint generates a presigned URL that can be shared with others to provide
 * time-limited access to a file. The expiration time is specified in hours and the
 * file's database record is updated to reflect the expiration.
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
 * @param params - Route parameters
 * @param params.id - The unique identifier of the file to share
 * 
 * @returns A NextResponse object containing the share URL and expiration details
 * 
 * @throws Returns 400 if hours is invalid (missing or <= 0)
 * @throws Returns 500 if the file is not found or sharing fails
 * 
 * @example
 * ```typescript
 * // Share a file for 48 hours
 * const response = await fetch('/api/files/file-789/share', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ hours: 48 })
 * });
 * 
 * const shareInfo = await response.json();
 * console.log('Share URL:', shareInfo.url);
 * console.log('Expires:', shareInfo.expires_at);
 * console.log('Message:', shareInfo.message);
 * ```
 * 
 * @example
 * ```typescript
 * // Share for a short time (1 hour)
 * async function quickShare(fileId: string) {
 *   const response = await fetch(`/api/files/${fileId}/share`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ hours: 1 })
 *   });
 *   
 *   if (response.ok) {
 *     const { url, expires_at } = await response.json();
 *     return { url, expires_at };
 *   }
 *   throw new Error('Failed to share file');
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Handle validation errors
 * const response = await fetch('/api/files/file-123/share', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ hours: 0 }) // Invalid!
 * });
 * 
 * if (!response.ok) {
 *   const error = await response.json();
 *   console.error(error); // { error: "Invalid expiration time" }
 * }
 * ```
 * 
 * @remarks
 * - Requires `hours` to be a positive number
 * - Updates the file's expiration time in the database
 * - If file already has an expiration, takes the maximum of old vs new
 * - Uses {@link FileService.shareFile} internally
 * - The generated URL is a presigned S3 URL, not a share token
 * 
 * @see {@link FileService.shareFile} for the underlying implementation
 * @see GET /api/files/[id] for retrieving file URLs without expiration
 * 
 * @status 200 - Successfully created share link
 * @status 400 - Invalid hours parameter
 * @status 500 - File not found or internal error
 */
export async function POST(
    request: Request, 
    { params }: { params : Promise<{ id : string }>}) {
        try {
            const { id } = await params;
            const { hours } = await request.json();
            if (!hours || hours <= 0) {
                return NextResponse.json(
                    {error: "Invalid expiration time"},
                    {status: 400},
                );
            }

            const res = await FileService.shareFile(id, hours);
            return NextResponse.json(res);

        } catch (error) {
            console.error("Error sharing file: ", error);
            throw new Error(`Failed to share file:  ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
 }
