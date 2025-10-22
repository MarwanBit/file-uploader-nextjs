import { toast } from "sonner";
import { type File } from "@/types/types";
import React from "react";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconTrash } from "@tabler/icons-react";
import { FileApiService } from "@/api-services/file-api.service";

// REFACTORED

export default function DeleteFileButton({ file, readOnly } : { 
    file : File | null,
    readOnly : boolean,
 }) {

    const deleteFileController = async (fileId: string | null) => {
        // now I want to delete this file
        if (!fileId) {
            toast.error("Please delete a valid file!");
        }
        try {
            await FileApiService.deleteFile(fileId as string);
            toast.success(`File ${file?.file_name} deleted successfully!`);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while deleting! try again!");
        }
    }

    return (<AlertDialog>
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
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete this File?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
                Are you sure you want to delete this file?
            </AlertDialogDescription>
            <AlertDialogFooter>
                <AlertDialogCancel
                     className="hover:cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                    className="bg-destructive text-destructive-foreground hober:bg-destructive/90 text-white"
                    onClick={() => {deleteFileController(file?.id as string)}}> 
                    {React.createElement(IconTrash)}
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}
