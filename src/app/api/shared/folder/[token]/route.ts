import { Folder } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/services/folder-service";

// REFACTORED

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