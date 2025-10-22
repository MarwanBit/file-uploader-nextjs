import { auth, clerkClient } from '@clerk/nextjs/server';
import { FolderService } from "@/services/folder-service";

// REFACTORED

export async function POST(
    request: Request,
    { params }: { params : Promise<{ folderId: string }> }) {
        try {
            const { folderId } = await params;
            const { userId } = await auth();
            
            if (!userId) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: {"Content-Type": "application/json"},
                });
            }
            
            const client = await clerkClient();
            const user = await client.users.getUser(userId);

            const curr_folder = await FolderService.getFolder(folderId);
            const root_folder = await FolderService.getFolder(user.publicMetadata.root_folder as string);

            const formData = await request.formData();
            const file = formData.get("file") as File;
            const buffer = Buffer.from(await file.arrayBuffer());

            const res = await FolderService.uploadFileToFolder(root_folder, curr_folder, file, buffer, user);

            const message = {
                message: "Worked as expected!"
            }
            // now return if everything is successful
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