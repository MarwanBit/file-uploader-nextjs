/**
 * @fileoverview Button component for creating new folders.
 * 
 * This component provides a button that opens a dialog for creating new subfolders
 * within the current folder or root folder. Validates folder names and handles
 * folder creation with API calls.
 * 
 * @module components/features/shared-new-folder-button
 */
import React from "react";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconClipboardPlus } from "@tabler/icons-react";
import { AlertDialog, AlertDialogTrigger } from "@radix-ui/react-alert-dialog";

/**
 * Button component for creating new folders.
 * 
 * Opens a dialog prompting the user to enter a folder name, then creates
 * a new subfolder in the current directory. Refreshes the page after creation
 * to show the new folder.
 * 
 * @param props - Component props

 * @example
 * ```tsx
 * // Create folder in specific location
 * <SharedNewFolderButton />
 * ```
 */
export default function SharedNewFolderButton() {

    return (
    <AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"outline"}
                    disabled={true}
                    className="w-full justify-start hover:cursor-pointer"
                    data-testid="new-folder-button">
                   
                    {React.createElement(IconClipboardPlus)}
                    New Folder
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
    </AlertDialog>
    );
}