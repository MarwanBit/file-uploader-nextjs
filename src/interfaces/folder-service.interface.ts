import { User } from "@clerk/nextjs/server";
import { Folder, type File as CustomFile } from "@/types/types";

export interface IFolderService {
    createRootFolder(user: User, userId: string): Promise<Folder>;
    getFolder(folderId: string) : Promise<Folder>;
    createSubfolder(parent_folder: Folder, folderName: string, root_folder: Folder, userId: string): Promise<Folder>;
    getFolderRecursively(folderId: string) : Promise<unknown>;
    deleteFolderRecursively(folderId: string) : Promise<void>;
    shareFolder(folderId: string, hours: number, origin: string): Promise<{ url: string, expires_at: Date }>;
    uploadFileToFolder(root_folder: Folder, curr_folder: Folder, file: File, Buffer: Buffer, user: User): Promise<CustomFile | null>;
    getAncestors(folderId: string | null, user: User) : Promise<{ id: string, name: string }[] | null>;
    getFolderByShareToken(shareToken: string) : Promise<Folder>;
}