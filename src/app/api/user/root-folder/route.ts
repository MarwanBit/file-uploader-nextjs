import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { FolderService } from "@/services/folder-service";

/**
 * @fileoverview API route for getting user's root folder ID.
 * 
 * This module provides an authenticated HTTP endpoint for retrieving the user's
 * root folder ID. If the root folder doesn't exist, it will be created automatically
 * using the new unique folder ID system with display names.
 * 
 * @module api/user/root-folder
 */

/**
 * Retrieves the user's root folder ID, creating it if it doesn't exist.
 * 
 * This endpoint ensures that every authenticated user has a root folder.
 * If the root folder doesn't exist, it will be created automatically.
 * 
 * @async
 * @function GET
 * 
 * @returns A NextResponse object containing the rootFolderId
 * @remarks
 * - **authentication required**
 * - Automatically creates root folder if it doesn't exist
 * - Uses the new unique folder ID system with display names
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();
        let user = await client.users.getUser(userId);
        
        // Ensure root folder exists (creates it if it doesn't)
        const rootFolder = await FolderService.createRootFolder(user, userId);
        
        // Get updated user metadata with root folder ID
        user = await client.users.getUser(userId);
        const rootFolderId = user.publicMetadata?.root_folder as string || rootFolder.id;

        if (!rootFolderId) {
            return NextResponse.json({ error: "Failed to create or retrieve root folder" }, { status: 500 });
        }

        return NextResponse.json({ rootFolderId });
    } catch (error) {
        console.error("Error fetching root folder:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}