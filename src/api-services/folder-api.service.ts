import { apiClient, ApiError } from "@/lib/api-client";
import { Folder } from "@/types/types";

export class FolderApiService {
    private static apiClient = apiClient;

    static async getFolderContents(folderId: string | null): Promise<Folder | ApiError> {
        const endpoint = folderId ? `/folders/${folderId}` : `/folders`;
        return await this.apiClient.get(endpoint);
    }

    static async getSharedRootFolderContents(shareToken: string): Promise<Folder | ApiError> {
        const endpoint = `/shared/folder/${shareToken}?recursive=all`;
        return await this.apiClient.get(endpoint);
    }

    static async getFolderWithoutContents(shareToken: string): Promise<Folder | ApiError> {
        const endpoint = `/shared/folder/${shareToken}`;
        return await this.apiClient.get(endpoint);
    }

    static async getRootFolderContents(folderId: string | null): Promise<Folder | ApiError> {
        const endpoint = !folderId ? `/folders?recursive=all` : `/folders/${folderId}?recursive=all`;
        return this.apiClient.get(endpoint);
    }

    static async deleteFolder(folderId: string): Promise<Folder | ApiError> {
        const endpoint = `/folders/${folderId}`;
        return await this.apiClient.delete(endpoint);
    }

    static async createFolder(folderName: string, folderId: string |  null): Promise<Folder | ApiError> {
        const endpoint = !folderId ? `/folders` : `/folders/${folderId}`;
        const body = { folder_name: folderName };
        return await this.apiClient.post(endpoint, body);
    }

    static async shareFolder(folderId: string | null, hours: number): Promise<Folder | ApiError> {
        const endpoint = `/folders/${folderId}/share`;
        const data = {
            hours: hours,
        };
        return await this.apiClient.post(endpoint, data);
    }

    static async getAncestorsSecurely(root_folder: Folder, current_folder: Folder, folderMap: Record<string, Folder>): Promise<{ id: string, name: string }[]> {
        if (!root_folder || !current_folder || !folderMap) {
            return [];
        }
        const ancestors : { id: string, name: string }[] = [];
        let current = current_folder;
        while (current && current.id !== root_folder.id) {
            ancestors.push({
                id: current.id,
                name: current.folder_name,
            });
            current = folderMap[current?.parent_folder_id];
        }

        if (current) {
            // now let's add the final one and return
            ancestors.push ({
                id: current.id,
                name: current.folder_name
            });
        }

        return ancestors.reverse();
    }

    static async getAncestors(folderId: string): Promise<Folder | ApiError> {
        const endpoint = `/folders/${folderId}/ancestors`;
        return await this.apiClient.get(endpoint);
    }

    static async constructFolderMap(root_folder: Folder): Promise<Record<string, Folder>> {
        const folderMap: Record<string, Folder> = {};

        // now let's write the DFS to explore the tree
        function DFS(folder: Folder) {
            folderMap[folder.id] = folder;
            for (const subFolder of folder.subfolders ?? []) {
                DFS(subFolder);
            }
        };

        DFS(root_folder);
        return folderMap;
    }
}