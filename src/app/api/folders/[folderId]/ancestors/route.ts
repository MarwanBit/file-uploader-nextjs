import { NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';
import { FolderService } from "@/services/folder-service";

// REFACTORED

export async function GET(
    request: Request,
    { params }: { params: { folderId: string } }
) {
    try {
        const folderId = (await params).folderId;
        const { userId } = await auth();
        const client = await clerkClient();
        const user = await client.users.getUser(userId as string);

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