/**
 * @fileoverview Button component for sharing folders with expiration.
 * 
 * This component provides a button that opens a dialog for generating a temporary
 * shareable link to a folder and all its contents. Users can select an expiration
 * duration and receive a public URL with a share token for read-only access.
 * 
 * @module components/features/share-folder-button
 */
import { toast } from "sonner";
import React from "react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";

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

/**
 * Button component for generating shareable folder links with expiration.
 * 
 * Opens a dialog allowing users to select an expiration duration and generate
 * a temporary public link for sharing the folder. The link grants read-only access
 * to the folder and all its contents (subfolders and files) without requiring
 * authentication. Link expires after the selected duration.
 * 
 * @param props - Component props
 * @param props.readOnly - If true, disables the share button
 * @returns Alert dialog button for folder sharing
 * 
 * @example
 * ```tsx
 * <ShareFolderButton readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // In a folder sidebar with share options
 * <FolderSidebar>
 *   <NewFolderButton readOnly={false} />
 *   <ShareFolderButton readOnly={false} />
 *   <DeleteFolderButton readOnly={false} />
 * </FolderSidebar>
 * ```
 * 
 * @remarks
 * - **Expiration Options**: 1 hour, 4 hours, 1 day, 3 days, 1 week
 * - Gets folder ID from URL params (useParams hook)
 * - Validates that duration is selected before generating link
 * - Shows toast error if duration not selected or folder ID missing
 * - Generated link appears in a read-only input field
 * - Disabled in read-only mode
 * - Link expires automatically after selected duration
 * - Uses FolderApiService.shareFolder for API calls
 * - Shared folder is read-only (no write operations allowed)
 * 
 * @see {@link FolderApiService.shareFolder} for the API implementation
 */
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