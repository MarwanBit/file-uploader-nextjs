import { toast } from "sonner";
import React from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
    AlertDialogDescription
} from "@/components/ui/alert-dialog";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconTrash } from "@tabler/icons-react";
import { FolderApiService } from "@/api-services/folder-api.service";

// REFACTORED

export default function DeleteFolderButton({ readOnly }: { readOnly: boolean }) {
    const params = useParams();
    const folderId: string = params.folderId as string;

    const HandleDeleteFolder = async (folderId: string) => {
        try {
            await FolderApiService.deleteFolder(folderId);
            toast.success(`Successfully deleted the folder!`);
        } catch (error) {
            console.error(error);
            toast.error(`Problem occured when deleting folder, please try again!`);
        }
    }

    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"destructive"}
                    disabled={readOnly}
                    className="w-full justify-start hover:cursor-pointer">
                    <IconTrash />
                    Delete Folder
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete this Folder?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
                Are you sure you want to delete this folder?
            </AlertDialogDescription>
            <AlertDialogFooter>
                <AlertDialogCancel
                     className="hover:cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:cursor-pointer text-white"
                onClick={() => HandleDeleteFolder(folderId)}> 
                    <IconTrash/>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}

