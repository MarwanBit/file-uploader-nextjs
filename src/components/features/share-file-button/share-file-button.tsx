import { useState } from "react";
import { toast } from "sonner";
import { type File } from "@/types/types";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconShare } from "@tabler/icons-react";

import { FileApiService } from "@/api-services/file-api.service";

// REFACTORED


export default function ShareFileButton({ file, readOnly } : { 
    file : File | null,
    readOnly: boolean,
 }) {
    const [hours, setHours] = useState<string>("");
    const [link, setLink] = useState<string>("");

    const shareFileController = async (fileId: string | null) => {
        if (!hours) {
            toast.error("Please select a share duration!");
        }

        if (!file || !file?.id) {
            toast.error("Error, cannot find file to share!");
        }

        try {
            const data = await FileApiService.shareFile(file?.id, parseInt(hours));
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
                    className="w-full justify-start hover:cursor-pointer"
                    disabled={readOnly}>
                    <IconShare className="mr-2 h-4 w-4" />
                    Share
                </Button>
            </SidebarMenuButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Share File</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="flex flex-col justify-center items-center">
                <AlertDialogDescription>
                    Generate a public link to share the current file and its contents.
                </AlertDialogDescription>
                <ToggleGroup 
                    variant="outline" 
                    type="single"
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
                        shareFileController(file?.id || null);
                     }}> 
                    Generate Link
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}
