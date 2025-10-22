import { auth, clerkClient } from '@clerk/nextjs/server';
import { FolderService } from '@/services/folder-service';


// REFACTORED!!


export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized'}), {
                status: 401,
                headers: {"Content-Type": "application/json"},
            });
        }

        const client = await clerkClient();
        let user = await client.users.getUser(userId);

        const root_folder = await FolderService.createRootFolder(user, userId);
        
        // Get the updated user with the root folder ID
        user = await client.users.getUser(userId);

        const url = new URL(request.url);
        const recursive = url.searchParams.get('recursive');

        if (recursive === "all") {
            const root_folder_id = user.publicMetadata.root_folder as string || root_folder.id;
            if (!root_folder_id) {
                return new Response(JSON.stringify({ error: 'Root folder not found' }), {
                    status: 500,
                    headers: {"Content-Type": "application/json"},
                });
            }
            const root_folder_data = await FolderService.getFolderRecursively(root_folder_id);
            return new Response(JSON.stringify(root_folder_data), {
                headers: {"Content-Type": "application/json"},
            });
        }

        return new Response(JSON.stringify(root_folder), {
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

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized '}), {
                status: 401,
                headers: {"Content-Type": "application/json"},
            });
        }

        const client = await clerkClient();
        let user = await client.users.getUser(userId);
        
        console.log('User metadata:', user.publicMetadata);

        const body = await request.json();
        const { folder_name } = body;

        // Ensure root folder exists first
        const root_folder = await FolderService.createRootFolder(user, userId);
        
        // Get updated user metadata
        user = await client.users.getUser(userId);
        
        // Use the root folder ID from metadata or fallback to the created folder
        const root_folder_id = user.publicMetadata.root_folder as string || root_folder.id;
        
        if (!root_folder_id) {
            return new Response(JSON.stringify({
                message: "ERROR, ROOT FOLDER ID IS NULL!",
            }), {
                headers: {"Content-Type": "application/json"},
                status: 500,
            });
        }
        
        const final_root_folder = await FolderService.getFolder(root_folder_id);

        if (!final_root_folder) {
            return new Response(JSON.stringify({
                message: "ERROR, ROOT FOLDER IS NULL!",
            }), {
                headers: {"Content-Type": "application/json"},
                status: 500,
            });
        }

        // create the subfolder
        const new_folder = await FolderService.createSubfolder(final_root_folder, folder_name, final_root_folder, userId);

        return new Response(JSON.stringify(new_folder), {
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