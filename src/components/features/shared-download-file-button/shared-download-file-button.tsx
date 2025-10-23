/**
 * @fileoverview Button for downloading files from shared folders.
 * 
 * This component provides a download button specifically for files within shared
 * folders. It uses the share token from the FolderContext to authenticate the
 * download request, allowing users without authentication to download files
 * from shared folders.
 * 
 * @module components/features/shared-download-file-button
 */
import { toast } from "sonner";
import React from "react";
import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";
import { useFolder } from "@/hooks/use-folder";
import { type File } from '@/types/types';
import { ApiError } from "@/lib/api-client";

import { FileApiService } from "@/api-services/file-api.service";

/**
 * Button component for downloading files from shared folders.
 * 
 * Fetches a presigned S3 URL using the share token and opens it in a new tab
 * for download. This allows users to download files from shared folders without
 * authentication, as long as they have a valid share token.
 * 
 * @param props - Component props
 * @param props.file - The file to download (null if no file selected)
 * @returns Button that triggers file download with share token
 * 
 * @example
 * ```tsx
 * <SharedDownloadFileButton file={selectedFile} />
 * ```
 * 
 * @example
 * ```tsx
 * // In shared file sidebar
 * <SharedFileSidebar>
 *   <SharedDownloadFileButton file={currentFile} />
 * </SharedFileSidebar>
 * ```
 * 
 * @remarks
 * - Uses share token from FolderContext (useFolder hook)
 * - Requires a valid file object with an id
 * - Opens download URL in new tab (window.open)
 * - Shows toast notification on error
 * - Uses FileApiService.downloadFileFromShareToken for API calls
 * - Does not require user authentication (token-based)
 * - Presigned URL expires after ~67 minutes
 * 
 * @see {@link FileApiService.downloadFileFromShareToken} for the API implementation
 * @see {@link useFolder} for accessing the share token
 */
export default function SharedDownloadFileButton({ file }: { file: File | null }) {
    const { shareToken } = useFolder();

    const SharedDownloadFileController = async () => {
        try {
            const data = await FileApiService.downloadFileFromShareToken(file?.id, shareToken);
            if (!(data instanceof ApiError)) {
                window.open(data.url, "_blank");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong when downloading! Try again!");
        }
    };

    return (
        <Button 
            variant="outline" 
            className="w-full justify-start hover:cursor-pointer"
            onClick={SharedDownloadFileController}>
            <IconDownload className="mr-2 h-4 w-4" />
            Download
        </Button>
        );
}
