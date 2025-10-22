import { toast } from "sonner";
import React from "react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams } from "next/navigation";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
    AlertDialogDescription
} from "@/components/ui/alert-dialog";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconShare } from "@tabler/icons-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";

import { FolderApiService } from "@/api-services/folder-api.service";

// REFACTORED

export default function ShareFolderButton({ readOnly }: { readOnly: boolean }) {
    const [hours, setHours] = useState<string>("");
    const [link, setLink] = useState<string>("");
    const { folderId } = useParams();

    const shareFolderController = async (folderId: string | null) => {
        if (!hours) {
            toast.error("Please select a share duration!");
        }

        if (!folderId) {
            toast.error("Error, cannot find file to share!");
        }

        try {
            const data = await FolderApiService.shareFolder(folderId, parseInt(hours));
            setLink(data.url);
        } catch (error) {
            console.error(error);
        }
    };
    
    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <SidebarMenuButton asChild>
                <Button 
                    variant={"outline"}
                    disabled={readOnly}
                    className="w-full justify-start hover:cursor-pointer"
                    data-testid="share-folder-button">
                    {React.createElement(IconShare)}
                    Share Folder
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Share Folder</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="flex flex-col justify-center items-center hover-pointer">
                <AlertDialogDescription>
                    Generate a public link to share the current folder and its contents.
                </AlertDialogDescription>
                <ToggleGroup 
                    variant="outline" 
                    type="single" 
                    className="hover:cursor-pointer"
                    value={hours}
                    onValueChange={(value) => {
                        if (value) {
                            setHours(value);
                        }
                    }}>
                    <ToggleGroupItem variant="outline" value="1" className="hover:cursor-pointer">
                        1 hour
                    </ToggleGroupItem>
                    <ToggleGroupItem variant="outline" value="4" className="hover:cursor-pointer">
                        4 hours
                    </ToggleGroupItem>
                    <ToggleGroupItem variant="outline" value="24" className="hover:cursor-pointer">
                        1 day
                    </ToggleGroupItem>
                    <ToggleGroupItem variant="outline" value="72" className="hover:cursor-pointer">
                        3 days
                    </ToggleGroupItem>
                    <ToggleGroupItem variant="outline" value="168" className="hover:cursor-pointer">
                        1 week
                    </ToggleGroupItem>
                </ToggleGroup>
                <AlertDialogDescription>
                    Link will expire after the selected duration
                </AlertDialogDescription>
                <Input 
                    type="text" 
                    placeholder="..."
                    value={link}
                    readOnly/>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel
                     className="hover:cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction
                     className="hover:cursor-pointer"
                     onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        shareFolderController(folderId as string);
                     }}> 
                    Generate Link
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}