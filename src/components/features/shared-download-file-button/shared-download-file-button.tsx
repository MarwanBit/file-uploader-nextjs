/**
 * @fileoverview Button component for downloading files from shared folders.
 * 
 * This component provides a button that generates a presigned S3 URL using a share token
 * and opens it in a new tab, allowing users to download files from shared folders.
 * 
 * @module components/features/shared-download-file-button
 */
import { useState } from "react";
import { toast } from "sonner";
import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { FileApiService } from "@/api-services/file-api.service";
import { type File } from "@/types/types";
import { ApiError } from "@/lib/api-client";

/**
 * Button component for downloading files from shared folders.
 * 
 * Fetches a presigned S3 URL for the file using a share token and opens it in a new tab for download.
 * The presigned URL is temporary and allows secure access without AWS credentials.
 * 
 * @param props - Component props
 * @param props.file - The file object to download (null if no file selected)
 * @param props.shareToken - The share token for accessing the shared folder
 * @param props.readOnly - Read-only flag (not currently used but present for consistency)
 * @returns Button that triggers file download
 * 
 * @example
 * ```tsx
 * <SharedDownloadFileButton file={selectedFile} shareToken="abc123" readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // Download button in shared file sidebar
 * <SharedDownloadFileButton 
 *   file={currentFile} 
 *   shareToken={shareToken}
 *   readOnly={isSharedFolder} 
 * />
 * ```
 * 
 * @remarks
 * - Requires a valid file object with an id and a share token
 * - Opens download URL in new tab (window.open)
 * - Presigned URL expires after ~67 minutes
 * - Shows toast notification on error
 * - Uses FileApiService.downloadFileFromShareToken for API calls
 * - The readOnly prop doesn't disable the button (downloads are allowed in read-only mode)
 * 
 * @see {@link FileApiService.downloadFileFromShareToken} for the API implementation
 */
export default function SharedDownloadFileButton({ 
    file, 
    shareToken, 
    readOnly 
}: { 
    file: File | null;
    shareToken: string | null;
    readOnly: boolean;
}) {
    const [isDownloading, setIsDownloading] = useState<boolean>(false);

    const downloadFileController = async () => {
        if (!file?.id) {
            toast.error("Please select a valid file!");
            return;
        }

        if (!shareToken) {
            toast.error("Invalid share token!");
            return;
        }

        setIsDownloading(true);
        
        await toast.promise(
            async () => {
                const data = await FileApiService.downloadFileFromShareToken(file.id, shareToken);
                if (data instanceof ApiError) {
                    throw new Error("Failed to generate download link");
                }
                window.open(data.url, "_blank");
                return file.file_name;
            },
            {
                loading: `Preparing "${file.file_name}" for download...`,
                success: (fileName) => `"${fileName}" download started!`,
                error: "Failed to download file. Please try again.",
            }
        );
        
        setIsDownloading(false);
    };

    return (
        <SidebarMenuButton asChild>
            <Button 
                variant="outline" 
                className="w-full justify-start hover:cursor-pointer"
                disabled={isDownloading || readOnly}
                onClick={downloadFileController}
                data-testid="download-button">
                <IconDownload className="mr-2 h-4 w-4" />
                Download
            </Button>
        </SidebarMenuButton>
    );
}
