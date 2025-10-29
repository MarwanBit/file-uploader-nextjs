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
import { useState } from "react";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconClipboardPlus } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { FolderApiService } from "@/api-services/folder-api.service";
import { useAuthFolder } from "@/hooks/use-auth-folder";

/**
 * Button component for creating new folders.
 * 
 * Opens a dialog prompting the user to enter a folder name, then creates
 * a new subfolder in the current directory. Refreshes the page after creation
 * to show the new folder.
 * 
 * @param props - Component props
 * @param props.readOnly - If true, disables the create folder button
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
export default function NewFolderButton() {
    const [folderName, setFolderName] = useState<string>("");
    const { currentFolderId, fetchFolderContents, refetchFolderTree, subFolders } = useAuthFolder();

    const handleCreateFolder = async () => {
        if (!folderName.trim()) {return};

        const existingFolder = subFolders?.find(folder => 
            folder.folder_name.toLowerCase() === folderName.trim().toLowerCase()
        );

        if (existingFolder) {
            toast.error(`A folder name "${folderName.trim()}" already exists in this location!`);
            return;
        }
        
        // Use toast.promise for loading/success/error states
        await toast.promise(
            async () => {
                await FolderApiService.createFolder(folderName, currentFolderId);
                await fetchFolderContents();
                refetchFolderTree(); // Refresh the folder tree
                return folderName; // Return value for success message
            },
            {
                loading: `Creating folder "${folderName}"...`,
                success: (name) => `Folder "${name}" created!`,
                error: "Something went wrong while creating the folder.",
            }
        );
        
        // Reset the foldername after successful creation
        setFolderName("");
    }

    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"outline"}
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
                <AlertDialogDescription>
                    Enter a name for the new folder. The folder will be created in the current directory.
                </AlertDialogDescription>
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

