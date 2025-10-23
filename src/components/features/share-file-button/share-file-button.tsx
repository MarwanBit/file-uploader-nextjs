/**
 * @fileoverview Button component for sharing files with expiration.
 * 
 * This component provides a button that opens a dialog for generating a temporary
 * shareable link to a file. Users can select an expiration duration (1 hour to 1 week)
 * and receive a public URL that grants access to the file without authentication.
 * 
 * @module components/features/share-file-button
 */
import { useState } from "react";
import { toast } from "sonner";
import { type File } from "@/types/types";
import { ApiError } from "@/lib/api-client";

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

/**
 * Button component for generating shareable file links with expiration.
 * 
 * Opens a dialog allowing users to select an expiration duration and generate
 * a temporary public link for sharing the file. The link grants download access
 * without requiring authentication and expires after the selected duration.
 * 
 * @param props - Component props
 * @param props.file - The file to share (null if no file selected)
 * @param props.readOnly - If true, disables the share button
 * @returns Alert dialog button for file sharing
 * 
 * @example
 * ```tsx
 * <ShareFileButton file={selectedFile} readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // In a file sidebar with share options
 * <FileSidebar>
 *   <DownloadFileButton file={file} />
 *   <ShareFileButton file={file} readOnly={false} />
 *   <DeleteFileButton file={file} />
 * </FileSidebar>
 * ```
 * 
 * @remarks
 * - **Expiration Options**: 1 hour, 4 hours, 1 day, 3 days, 1 week
 * - Requires a valid file object with an id
 * - Validates that duration is selected before generating link
 * - Shows toast error if duration not selected or file missing
 * - Generated link appears in a read-only input field
 * - Disabled in read-only mode
 * - Link expires automatically after selected duration
 * - Uses FileApiService.shareFile for API calls
 * 
 * @see {@link FileApiService.shareFile} for the API implementation
 */
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
            const data = await FileApiService.shareFile(file?.id ?? null, parseInt(hours));
            if (!(data instanceof ApiError)) {
                setLink(data.url);
            }
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
