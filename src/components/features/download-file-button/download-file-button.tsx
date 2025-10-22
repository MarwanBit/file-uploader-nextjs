import { toast } from "sonner";
import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FileApiService } from "@/api-services/file-api.service";

// REFACTORED

export default function DownloadFileButton({ file, readOnly }: { file: File | null, readOnly: boolean }) {
    const downloadFileController = async () => {
        try {
            const data = await FileApiService.downloadFile(file?.id);
            window.open(data.url, "_blank");
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
