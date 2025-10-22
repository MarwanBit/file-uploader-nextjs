import { toast } from "sonner";
import React from "react";
import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";
import { useFolder } from "@/hooks/use-folder";
import { type File } from '@/types/types';
import { ApiError } from "@/lib/api-client";

import { FileApiService } from "@/api-services/file-api.service";

// REFACTORED

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
