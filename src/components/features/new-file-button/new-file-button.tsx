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
import { useParams } from "next/navigation";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import { IconFolderPlus } from "@tabler/icons-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FileApiService } from '@/api-services/file-api.service';

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
export default function NewFileButton({ readOnly }: { readOnly: boolean }) {
    const [file, setFile] = useState<File | null>(null);
    const params = useParams();
    const folderId: string = params.folderId as string;

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file first!");
            return;
        }
         try {
            const formData = new FormData();
            formData.append("file", file);
            await FileApiService.uploadFile(folderId, formData)
            toast.success(`File ${file.name} created successfully!`);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while uploading!");
        }
    }
   

    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"outline"}
                    disabled={readOnly}
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