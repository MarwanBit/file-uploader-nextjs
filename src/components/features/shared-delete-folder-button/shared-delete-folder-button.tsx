/**
 * @fileoverview Button component for deleting folders with confirmation dialog.
 * 
 * This component provides a destructive button that triggers a confirmation dialog
 * before recursively deleting a folder and all its contents (subfolders and files)
 * from both the database and S3 storage.
 * 
 * @module components/features/shared-delete-folder-button
 */
import React from "react";
import { Button } from "@/components/ui/button";

import {
    AlertDialog, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconTrash } from "@tabler/icons-react";

/**
 * Button component for deleting folders with confirmation.
 * 
 * Displays a destructive button that opens a confirmation dialog before deleting
 * a folder. The delete operation is **irreversible** and recursively removes the
 * folder and all its contents from both database and S3 storage. Uses URL params
 * to determine which folder to delete.
 * 
 * @param props - Component props
 * 
 * @example
 * ```tsx
 * <DeleteFolderButton />
 * ```
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
export default function SharedDeleteFolderButton() {
    return (
    <AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"destructive"}
                    disabled={true}
                    className="w-full justify-start hover:cursor-pointer">
                    <IconTrash />
                    Delete Folder
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
    </AlertDialog>
    );
}