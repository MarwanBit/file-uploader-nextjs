/**
 * @fileoverview Button component for uploading new files.
 * 
 * This component provides a button that opens a dialog for selecting and uploading
 * files to the current folder. Handles file selection, validation, and upload to
 * S3 storage with metadata stored in the database.
 * 
 * @module components/features/new-file-button
 */
import React, { useState } from 'react';
import { toast } from "sonner";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import { IconFolderPlus } from "@tabler/icons-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FileApiService } from '@/api-services/file-api.service';
import { useAuthFolder } from '@/hooks/use-auth-folder';

/**
 * Button component for uploading new files.
 * 
 * Opens a dialog with a file input that allows users to select and upload files
 * to the current folder. Validates that a file is selected before uploading.
 * Uses FormData for multipart upload to the API.
 * 
 * @param props - Component props
 * @param props.readOnly - If true, disables the upload button
 * @returns Alert dialog button for file upload
 * 
 * @example
 * ```tsx
 * <NewFileButton readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // In a sidebar with read-only mode
 * <NewFileButton readOnly={isSharedFolder} />
 * ```
 * 
 * @example
 * ```tsx
 * // In a folder operations menu
 * <SidebarMenu>
 *   <NewFolderButton readOnly={false} />
 *   <NewFileButton readOnly={false} />
 * </SidebarMenu>
 * ```
 * 
 * @remarks
 * - Gets folder ID from URL params (useParams hook)
 * - Validates that a file is selected before upload
 * - Uses FormData for multipart/form-data upload
 * - Disabled in read-only mode
 * - Shows toast notifications for success/error
 * - Uses FileApiService.uploadFile for API calls
 * - Accepts any file type (no restrictions)
 * 
 * @see {@link FileApiService.uploadFile} for the API implementation
 */
export default function NewFileButton() {
    const [file, setFile] = useState<File | null>(null);
    const { currentFolderId, fetchFolderContents, refetchFolderTree, files } = useAuthFolder();

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file first!");
            return;
        }

        if (!currentFolderId) {
            toast.error("No folder selected for upload!");
            return;
        }
        
        const formData = new FormData();
        formData.append("file", file);

        const existingFile = files?.find(targ_file => 
            targ_file.file_name === file.name
        );

        if (existingFile) {
            toast.error(`A file name "${file.name}" already exists in this location!`);
            return;
        }
       
        try {
            // Use toast.promise for loading/success/error states
            await toast.promise(
                async () => {
                    await FileApiService.uploadFile(currentFolderId, formData);
                    await fetchFolderContents();
                    await refetchFolderTree();
                    return file.name; // Return value for success message
                },
                {
                    loading: `Uploading ${file.name}...`,
                    success: (fileName) => `File ${fileName} uploaded successfully!`,
                    error: (err) => {
                        // Handle different error types
                        if (err instanceof Error) {
                            return err.message || "Something went wrong while uploading!";
                        }
                        return "Something went wrong while uploading!";
                    },
                }
            );
            
            // Reset file input only after successful upload
            setFile(null);
        } catch (error) {
            // Additional error handling if needed
            console.error("Upload error:", error);
            // Don't reset file state on error so user can retry
        }
    }
   

    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"outline"}
                    className="w-full justify-start hover:cursor-pointer"
                    data-testid="new-file-button">
                    {React.createElement(IconFolderPlus)}
                    New File
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>New File</AlertDialogTitle>
                <AlertDialogDescription>
                    Select a file to upload to the current folder. The file will be stored securely and accessible from your file manager.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <Label htmlFor="file">Choose File</Label>
            <Input 
                id="file" 
                type="file"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                        setFile(f);
                    }
                }}/>
            <AlertDialogFooter>
                <AlertDialogCancel
                    className="hover:cursor-pointer">
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                    className="hover:cursor-pointer"
                    onClick={handleUpload}>
                        Upload File
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}