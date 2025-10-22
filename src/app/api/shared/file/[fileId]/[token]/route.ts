import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/services/folder-service";
import { FileService } from "@/services/file-service";
import { type File } from "@/types/types";

// REFACTORED

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