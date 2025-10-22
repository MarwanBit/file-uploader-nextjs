import { NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';
import { FolderService } from "@/services/folder-service";

// REFACTORED

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