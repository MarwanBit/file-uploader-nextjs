import { apiClient, ApiError } from "@/lib/api-client";
import { File } from "@/types/types";

export class FileApiService {
    private static apiClient = apiClient;

    static async deleteFile(fileId: string): Promise<File | ApiError> {
        const endpoint = `/files/${fileId}`;
        return await this.apiClient.delete(endpoint);
    }

    static async downloadFile(fileId: string | null): Promise<File | ApiError> {
        const endpoint = `/files/${fileId}`;
        return await this.apiClient.get(endpoint);
    }

    static async uploadFile(folderId: string, formData: FormData): Promise<File | ApiError> {
        const endpoint = `/folders/${folderId}/files`;
        return await this.apiClient.postFormData(endpoint, formData);
    }

    static async shareFile(fileId: string | null, hours: number): Promise<File | ApiError> {
        const endpoint = `/files/${fileId}/share`;
        const data = {
            hours: hours,
        };
        return await this.apiClient.post(endpoint, data);
    }

    static async downloadFileFromShareToken(fileId: string, shareToken: number): Promise<File | ApiError> {
        const endpoint = `/shared/file/${fileId}/${shareToken}`;
        return await this.apiClient.get(endpoint);
    }
}
