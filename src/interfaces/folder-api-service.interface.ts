import { ApiError } from "@/lib/api-client";
import { Folder } from "@/types/types";

export interface IFolderApiService {
    getFolderContents(folderId: string | null): Promise<Folder | ApiError>;
    getSharedRootFolderContents(shareToken: string): Promise<Folder | ApiError>;
    getFolderWithoutContents(shareToken: string): Promise<Folder | ApiError>;
    getRootFolderContents(folderId: string | null): Promise<Folder | ApiError>;
    deleteFolder(folderId: string): Promise<Folder | ApiError>;
    createFolder(folderName: string, folderId: string | null): Promise<Folder | ApiError>;
    shareFolder(folderId: string | null, hours: number): Promise<Folder | ApiError>;
    getAncestorsSecurely(root_folder: Folder, current_folder: Folder, folderMap: Record<string, Folder>):  Promise<{ id: string, name: string }[]>;
    getAncestors(folderId: string): Promise<Folder | ApiError>;
    constructFolderMap(root_folder: Folder): Promise<Record<string, Folder>>;
}