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
import { ApiError } from "@/lib/api-client";

import {
    AlertDialog, AlertDialogAction, 
    AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, 
    AlertDialogTitle, AlertDialogTrigger,
    AlertDialogDescription
} from "@/components/ui/alert-dialog";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { IconShare, IconCopy, IconCheck, IconClock } from "@tabler/icons-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";

import { FolderApiService } from "@/api-services/folder-api.service";
import { useAuthFolder } from "@/hooks/use-auth-folder";

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
export default function ShareFolderButton() {
    const [hours, setHours] = useState<string>("");
    const [link, setLink] = useState<string>("");
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const { currentFolderId } = useAuthFolder();

    const getDurationLabel = (hoursStr: string): string => {
        const h = parseInt(hoursStr);
        if (h === 1) return "1 hour";
        if (h === 4) return "4 hours";
        if (h === 24) return "1 day";
        if (h === 72) return "3 days";
        if (h === 168) return "1 week";
        return `${h} hours`;
    };

    const shareFolderController = async () => {
        if (!hours) {
            toast.error("Please select a share duration!");
            return;
        }

        if (!currentFolderId) {
            toast.error("Error, cannot find folder to share!");
            return;
        }

        setIsGenerating(true);
        
        await toast.promise(
            async () => {
                const data = await FolderApiService.shareFolder(currentFolderId, parseInt(hours));
                if (data instanceof ApiError) {
                    throw new Error("Failed to generate share link");
                }
                setLink(data.url);
                // Calculate expiration time
                const expiration = new Date();
                expiration.setHours(expiration.getHours() + parseInt(hours));
                setExpiresAt(expiration);
                return getDurationLabel(hours);
            },
            {
                loading: "Generating share link...",
                success: (duration) => `Share link created! Expires in ${duration}.`,
                error: "Failed to generate share link. Please try again.",
            }
        );
        
        setIsGenerating(false);
    };

    const copyToClipboard = async () => {
        if (!link) return;
        
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleDialogClose = () => {
        // Reset state when dialog closes
        setLink("");
        setHours("");
        setExpiresAt(null);
        setCopied(false);
    };
    
    return (
        <AlertDialog onOpenChange={(open) => !open && handleDialogClose()}>
            <AlertDialogTrigger asChild>
                <SidebarMenuButton asChild>
                    <Button 
                        variant={"outline"}
                        className="w-full justify-start hover:cursor-pointer"
                        data-testid="share-folder-button">
                        <IconShare />
                        Share Folder
                    </Button>
                </SidebarMenuButton>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <IconShare className="h-5 w-5" />
                        Share Folder
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Generate a public link to share the current folder and its contents.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Duration Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <IconClock className="h-4 w-4" />
                            Link Expiration
                        </label>
                        <ToggleGroup 
                            variant="outline" 
                            type="single" 
                            value={hours}
                            onValueChange={(value) => {
                                if (value) {
                                    setHours(value);
                                    setLink(""); // Reset link when duration changes
                                    setExpiresAt(null);
                                }
                            }}>
                            <ToggleGroupItem value="1" className="hover:cursor-pointer">
                                1 hour
                            </ToggleGroupItem>
                            <ToggleGroupItem value="4" className="hover:cursor-pointer">
                                4 hours
                            </ToggleGroupItem>
                            <ToggleGroupItem value="24" className="hover:cursor-pointer">
                                1 day
                            </ToggleGroupItem>
                            <ToggleGroupItem value="72" className="hover:cursor-pointer">
                                3 days
                            </ToggleGroupItem>
                            <ToggleGroupItem value="168" className="hover:cursor-pointer">
                                1 week
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    {/* Generated Link Display */}
                    {link && (
                        <div className="space-y-2 p-4 bg-muted rounded-lg border">
                            <label className="text-sm font-medium text-muted-foreground">
                                Share Link
                            </label>
                            <div className="flex gap-2">
                                <Input 
                                    type="text" 
                                    value={link}
                                    readOnly
                                    className="font-mono text-xs bg-background"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={copyToClipboard}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <IconCheck className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <IconCopy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {expiresAt && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <IconClock className="h-3 w-3" />
                                    Expires: {expiresAt.toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel className="hover:cursor-pointer">
                        {link ? "Close" : "Cancel"}
                    </AlertDialogCancel>
                    {!link && (
                        <AlertDialogAction
                            className="bg-black text-white hover:bg-black/90 hover:cursor-pointer"
                            disabled={!hours || isGenerating}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                shareFolderController();
                            }}> 
                            <IconShare className="h-4 w-4 mr-2" />
                            Generate Link
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}