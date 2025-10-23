/**
 * @fileoverview Button component for deleting folders with confirmation dialog.
 * 
 * This component provides a destructive button that triggers a confirmation dialog
 * before recursively deleting a folder and all its contents (subfolders and files)
 * from both the database and S3 storage.
 * 
 * @module components/features/delete-folder-button
 */
import { toast } from "sonner";
import React from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
    AlertDialogDescription
} from "@/components/ui/alert-dialog";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconTrash } from "@tabler/icons-react";
import { FolderApiService } from "@/api-services/folder-api.service";

/**
 * Button component for deleting folders with confirmation.
 * 
 * Displays a destructive button that opens a confirmation dialog before deleting
 * a folder. The delete operation is **irreversible** and recursively removes the
 * folder and all its contents from both database and S3 storage. Uses URL params
 * to determine which folder to delete.
 * 
 * @param props - Component props
 * @param props.readOnly - If true, disables the delete button
 * @returns Alert dialog button for folder deletion
 * 
 * @example
 * ```tsx
 * <DeleteFolderButton readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // In read-only mode (shared folders)
 * <DeleteFolderButton readOnly={true} />
 * ```
 * 
 * @remarks
 * - **DESTRUCTIVE OPERATION**: Deletes all subfolders and files recursively
 * - Gets folder ID from URL params (useParams hook)
 * - Shows confirmation dialog before deletion
 * - Disabled in read-only mode
 * - Displays toast notifications for user feedback
 * - Uses FolderApiService.deleteFolder for API calls
 * 
 * @see {@link FolderApiService.deleteFolder} for the API implementation
 */
export default function DeleteFolderButton({ readOnly }: { readOnly: boolean }) {
    const params = useParams();
    const folderId: string = params.folderId as string;

    const HandleDeleteFolder = async (folderId: string) => {
        try {
            await FolderApiService.deleteFolder(folderId);
            toast.success(`Successfully deleted the folder!`);
        } catch (error) {
            console.error(error);
            toast.error(`Problem occured when deleting folder, please try again!`);
        }
    }

    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"destructive"}
                    disabled={readOnly}
                    className="w-full justify-start hover:cursor-pointer">
                    <IconTrash />
                    Delete Folder
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete this Folder?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
                Are you sure you want to delete this folder?
            </AlertDialogDescription>
            <AlertDialogFooter>
                <AlertDialogCancel
                     className="hover:cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:cursor-pointer text-white"
                onClick={() => HandleDeleteFolder(folderId)}> 
                    <IconTrash/>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}

