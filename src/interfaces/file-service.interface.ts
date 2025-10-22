import { Folder } from "@/types/types";

export interface IFileService {
    getFileUrl(fileId: string): Promise<{ url: string }>;
    deleteFile(fileId: string): Promise<{ message: string }>;
    shareFile(fileId: string, hours: number): Promise<{
        url: string,
        expires_at: Date,
        message: string
    }>;
    getFile(fileId: string) : Promise<File>;
    fileInRootFolder(rootFolderId: string, fileId: string): Promise<boolean>;
    getFileFromShareToken(root_folder: Folder, file: File): Promise<{
        url: string,
        expires_at: Date
    }>;
}