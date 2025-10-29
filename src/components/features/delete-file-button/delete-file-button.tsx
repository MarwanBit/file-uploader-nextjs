/**
 * @fileoverview Button component for deleting files with confirmation dialog.
 * 
 * This component provides a destructive button that triggers a confirmation dialog
 * before permanently deleting a file from both the database and S3 storage.
 * 
 * @module components/features/delete-file-button
 */
import { toast } from "sonner";
import { type File } from "@/types/types";
import { useState } from "react";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";
import { FileApiService } from "@/api-services/file-api.service";
import { useAuthFolder } from "@/hooks/use-auth-folder";

/**
 * Button component for deleting files with confirmation.
 * 
 * Displays a destructive button that opens a confirmation dialog before deleting
 * a file. The delete operation is irreversible and removes the file from both
 * the database and S3 storage. Shows toast notifications for success/failure.
 * 
 * @param props - Component props
 * @param props.file - The file object to delete (null if no file selected)
 * @param props.readOnly - If true, disables the delete button
 * @returns Alert dialog button for file deletion
 * 
 * @example
 * ```tsx
 * <DeleteFileButton file={selectedFile} readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // In read-only mode (shared folders)
 * <DeleteFileButton file={file} readOnly={true} />
 * ```
 * 
 * @remarks
 * - Requires a valid file object with an id
 * - Shows confirmation dialog before deletion
 * - Disabled in read-only mode
 * - Displays toast notifications for user feedback
 * - Uses FileApiService for API calls
 */
export default function DeleteFileButton({ file, readOnly, onClose } : { 
    file : File | null,
    readOnly : boolean,
    onClose?: () => void,
}) {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { fetchFolderContents, refetchFolderTree } = useAuthFolder();

    const deleteFileController = async () => {
        if (!file?.id) {
            toast.error("Please select a valid file!");
            return;
        }

        setIsDeleting(true);
        
        await toast.promise(
            async () => {
                await FileApiService.deleteFile(file.id);
                await fetchFolderContents();
                refetchFolderTree();
                setIsOpen(false); // Close dialog after successful deletion
                onClose?.(); // Close file sidebar after successful deletion
                return file.file_name;
            },
            {
                loading: `Deleting "${file.file_name}"...`,
                success: (fileName) => `File "${fileName}" deleted successfully!`,
                error: "Failed to delete file. Please try again.",
            }
        );
        
        setIsDeleting(false);
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <SidebarMenuButton asChild>
                    <Button 
                        variant={"destructive"}
                        disabled={readOnly}
                        className="w-full justify-start hover:cursor-pointer">
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </SidebarMenuButton>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <IconAlertTriangle className="h-5 w-5" />
                        Delete File?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <span className="font-semibold">{file?.file_name}</span>? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="hover:cursor-pointer">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        className="bg-destructive text-white hover:bg-destructive/90 hover:cursor-pointer"
                        disabled={isDeleting}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteFileController();
                        }}> 
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete File
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
