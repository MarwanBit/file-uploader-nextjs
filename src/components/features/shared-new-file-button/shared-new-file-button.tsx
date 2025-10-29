/**
 * @fileoverview Button component for uploading new files.
 * 
 * This component provides a button for creating a new-file
 * 
 * @module components/features/shared-new-file-button
 */
import React from 'react';

import {
    AlertDialog, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import { IconFolderPlus } from "@tabler/icons-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

/**
 * Button component for uploading new files.
 * 
 * 
 * 
 * @param props - Component props
 * 
 * @example
 * ```tsx
 * <NewFileButton/>
 * ```
 * @remarks
 * 
 * @see {@link FileApiService.uploadFile} for the API implementation
 */
export default function SharedNewFileButton() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <SidebarMenuButton asChild>
                    <Button 
                        variant={"outline"}
                        disabled={true}
                        className="w-full justify-start hover:cursor-pointer"
                        data-testid="new-file-button">
                        {React.createElement(IconFolderPlus)}
                        New File
                    </Button>
                </SidebarMenuButton>
            </AlertDialogTrigger>
        </AlertDialog>
        );
}