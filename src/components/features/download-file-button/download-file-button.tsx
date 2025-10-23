/**
 * @fileoverview Button component for downloading files.
 * 
 * This component provides a button that generates a presigned S3 URL and opens
 * it in a new tab, allowing users to download the selected file directly from
 * S3 storage.
 * 
 * @module components/features/download-file-button
 */
import { toast } from "sonner";
import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FileApiService } from "@/api-services/file-api.service";
import { type File } from "@/types/types";
import { ApiError } from "@/lib/api-client";

/**
 * Button component for downloading files.
 * 
 * Fetches a presigned S3 URL for the file and opens it in a new tab for download.
 * The presigned URL is temporary and allows secure access without AWS credentials.
 * 
 * @param props - Component props
 * @param props.file - The file object to download (null if no file selected)
 * @param props.readOnly - Read-only flag (not currently used but present for consistency)
 * @returns Button that triggers file download
 * 
 * @example
 * ```tsx
 * <DownloadFileButton file={selectedFile} readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // Download button in file sidebar
 * <DownloadFileButton 
 *   file={currentFile} 
 *   readOnly={isSharedFolder} 
 * />
 * ```
 * 
 * @remarks
 * - Requires a valid file object with an id
 * - Opens download URL in new tab (window.open)
 * - Presigned URL expires after ~67 minutes
 * - Shows toast notification on error
 * - Uses FileApiService.downloadFile for API calls
 * - The readOnly prop doesn't disable the button (downloads are allowed in read-only mode)
 * 
 * @see {@link FileApiService.downloadFile} for the API implementation
 */
export default function DownloadFileButton({ file, readOnly }: { file: File | null, readOnly: boolean }) {
    const downloadFileController = async () => {
        try {
            const data = await FileApiService.downloadFile(file?.id ?? null);
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
            onClick={downloadFileController}>
            <IconDownload className="mr-2 h-4 w-4" />
            Download
        </Button>
        );
}
