import { NextResponse } from "next/server";
import { FolderService } from "@/services/folder-service";

// REFACTORED

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