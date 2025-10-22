import { FileService } from "@/services/file-service";

// REFACTORED

export async function GET(
    request: Request,
    { params }: { params : Promise<{ id: string }> }) {
        try {
            const { id } = await params;
            const message = await FileService.getFileUrl(id);
            return new Response(JSON.stringify(message), {
                headers: {"Content-Type": "application/json"},
            });
        } catch (error) {
            console.error("Error creating folder info file:", error);
            throw new Error(`Failed to create folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
}

export async function DELETE(
    request: Request,
    { params }: { params : Promise<{ id : string}> }) {
        try {
            const { id } = await params;
            const message = await FileService.deleteFile(id);
            return new Response(JSON.stringify(message), {
                headers: {"Content-Type": "application/json"},
            });
        } catch (error) {
            console.error("Error deleting file: ", error);
            throw new Error(`Failed to delete file:  ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
}