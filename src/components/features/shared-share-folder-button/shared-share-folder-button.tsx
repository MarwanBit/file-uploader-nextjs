/**
 * @fileoverview Button component for sharing folders with expiration.
 * 
 * This component provides a button that opens a dialog for generating a temporary
 * shareable link to a folder and all its contents. Users can select an expiration
 * duration and receive a public URL with a share token for read-only access.
 * 
 * @module components/features/shared-share-folder-button
 */
import React from "react";
import { Button } from "@/components/ui/button";

import {
    AlertDialog, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconShare } from "@tabler/icons-react";

/**
 * Button component for generating shareable folder links with expiration.
 * 
 * Opens a dialog allowing users to select an expiration duration and generate
 * a temporary public link for sharing the folder. The link grants read-only access
 * to the folder and all its contents (subfolders and files) without requiring
 * authentication. Link expires after the selected duration.
 * 
 * @param props - Component props
 * 
 * @example
 * ```tsx
 * <ShareFolderButton />
 */
export default function SharedShareFolderButton() { 
    return (
    <AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"outline"}
                    disabled={true}
                    className="w-full justify-start hover:cursor-pointer"
                    data-testid="share-folder-button">
                    {React.createElement(IconShare)}
                    Share Folder
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>  
    </AlertDialog>
    );
}