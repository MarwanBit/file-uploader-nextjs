import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from "@/lib/db-client";
import { FolderService } from "@/services/folder-service";


// REFACTORED

export async function GET(
    request: Request,
    { params }: { params : Promise<{ folderId: string }> }) {
        try {
            const { folderId } = await params;
            const folder = await FolderService.getFolder(folderId);
            const url = new URL(request.url);
            const recursive = url.searchParams.get('recursive');

            if (recursive === "all") {
                const res_folder = await FolderService.getFolderRecursively(folder?.id as string);
                return new Response(JSON.stringify(res_folder), {
                    headers: {"Content-Type": "application/json"},
                });
            }
        
           return new Response(JSON.stringify(folder), {
                headers: {"Content-Type": "application/json"},
           });

        } catch (error) {
            console.error("Error: ", error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: {"Content-Type": "application/json"},
            });
        }
}

export async function DELETE(
    req: Request,
    { params }: { params : Promise<{ folderId: string }> }) {
        try {
            const { folderId } = await params;
            await FolderService.deleteFolderRecursively(folderId);
            const message = {
                message : "ENDPOINT DELETE /api/folders/:folderId not implemented yet :(",
            };
            return new Response(JSON.stringify(message), {
                headers: {"Content-Type": "application/json"},
            });
        } catch (error) {
            console.error("Error: ", error);
            return new Response(JSON.stringify({ error: 'Internal server error '}), {
                status: 500,
                headers: {"Content-Type": "application/json"},
            });
        }
}

export async function POST(
    request: Request,
    { params }: { params : Promise<{ folderId : string}> }) {
        try {
            const { userId } = await auth();
            const { folderId } = await params;

            if (!userId) {
                return new Response(JSON.stringify({ error: 'Unauthorized '}), {
                    status: 401,
                    headers: {"Content-Type": "application/json"},
                });
            }

            const client = await clerkClient();
            const user = await client.users.getUser(userId);

            const body = await request.json();
            const { folder_name } = body;

            // now let's get the folders
            const parent_folder = await FolderService.getFolder(folderId);
            const root_folder = await FolderService.getFolder(user.publicMetadata.root_folder as string);

            if (!parent_folder || !root_folder) {
                return new Response(JSON.stringify({
                    message: "ERROR, ROOT FOLDER IS NULL or PARENT FOLDER IS NULL!",
                }), {
                    headers: {"Content-Type": "application/json"},
                    status: 500,
                });
            }

            // now let's create this new folder
            await FolderService.createSubfolder(parent_folder, folder_name, root_folder, userId);

            const message = {
                message : "ENDPOINT POST /api/folders not implemented yet :(",
            };
            return new Response(JSON.stringify(message), {
                headers: {"Content-Type": "application/json"},
            });
        } catch (error) {
            console.error("Error: ", error);
            return new Response(JSON.stringify({ error: 'Internal server error '}), {
                status: 500,
                headers: {"Content-Type": "application/json"},
            });
        }
}