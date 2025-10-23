/**
 * @fileoverview Button component for creating new folders.
 * 
 * This component provides a button that opens a dialog for creating new subfolders
 * within the current folder or root folder. Validates folder names and handles
 * folder creation with API calls.
 * 
 * @module components/features/new-folder-button
 */
import { toast } from "sonner";
import React from "react";
import { useParams } from "next/navigation";
import { useState } from "react";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconClipboardPlus } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { FolderApiService } from "@/api-services/folder-api.service";

/**
 * Button component for creating new folders.
 * 
 * Opens a dialog prompting the user to enter a folder name, then creates
 * a new subfolder in the current directory. Refreshes the page after creation
 * to show the new folder.
 * 
 * @param props - Component props
 * @param props.readOnly - If true, disables the create folder button
 * @param props.folderId - Optional folder ID to create subfolder in (uses URL param if not provided)
 * @returns Alert dialog button for folder creation
 * 
 * @example
 * ```tsx
 * <NewFolderButton readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // Create folder in specific location
 * <NewFolderButton readOnly={false} folderId="folder-123" />
 * ```
 * 
 * @remarks
 * - Uses URL params for folder ID if not explicitly provided
 * - Validates folder name (must not be empty)
 * - Reloads page after successful creation
 * - Disabled in read-only mode
 * - Shows toast notifications for feedback
 */
export default function NewFolderButton({ readOnly, folderId }: { readOnly: boolean; folderId?: string | null }) {
    const [folderName, setFolderName] = useState<string>("");
    const params = useParams();
    const currentFolderId: string = folderId || params.folderId as string;

    const handleCreateFolder = async () => {
        if (!folderName.trim()) {return};
        try {
            await FolderApiService.createFolder(folderName, currentFolderId);
            toast.success(`Folder "${folderName}" created!`);
            // Reset the foldername
            setFolderName("");
            // now we want to refresh the current page
            window.location.reload();
        } catch (err) {
            toast.error("Something went wrong while creating the folder.");
        }
    }

    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"outline"}
                    disabled={readOnly}
                    className="w-full justify-start hover:cursor-pointer"
                    data-testid="new-folder-button">
                   
                    {React.createElement(IconClipboardPlus)}
                    New Folder
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>New Folder</AlertDialogTitle>
            </AlertDialogHeader>
            <Input 
                type="text" 
                placeholder="Enter your folder name..."
                onChange={(e) => setFolderName(e.target.value)}/>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateFolder}>
                    Create Folder
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}
