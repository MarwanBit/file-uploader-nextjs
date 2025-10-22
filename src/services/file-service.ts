import prisma from '@/lib/db-client';
import ConfigSingleton from '@/lib/config';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3-client';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class FileService {
    private static config = ConfigSingleton.getInstance().config;

    static async getFileUrl(fileId: string) : Promise<{ url: string }> {
        try {
            const file = await prisma.file.findUnique({
                where: {
                    id: fileId,
                },
            });

            console.log(file);

            if (!file) {
                throw new Error("File not found");
            }
    
            if (!file.s3_key) {
                throw new Error("File S3 key not found");
            }

            const command = new GetObjectCommand({
                Bucket: this.config.APPLICATION_BUCKET_NAME,
                Key: file?.s3_key as string,
            });

            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 4000});

            const message = {
                message: "successful!",
                url: signedUrl,
            };

            return message;
        } catch (error) {
            console.error("Error creating folder info file:", error);
            throw new Error(`Failed to create folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async deleteFile(fileId: string): Promise<{ message: string }> {
        try {
            const file = await prisma.file.findUnique({
                where: {
                    id: fileId
                },
            });

            await s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.config.APPLICATION_BUCKET_NAME,
                    Key: file?.s3_key as string,
                })
            );

            await prisma.file.delete({
                where: {
                    id: file?.id,
                },
            });

            const message = {
                message: "deletion successful!"
            };
            
            return message;

        } catch (error) {
            console.error("Error deleting file!: ", error);
            throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async shareFile(fileId: string, hours: number) : Promise<{ 
        url: string, 
        expires_at: Date,
        message: string
    }> {
        try {
            const file = await prisma.file.findUnique({
                where: {
                    id: fileId,
                },
            });

            const expiresIn = hours * 60 * 60; // convert from hours to seconds
            const command = new GetObjectCommand({
                Bucket: this.config.APPLICATION_BUCKET_NAME,
                Key: file?.s3_key as string,
            });

            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
            const newExpiry = new Date(
                Math.max(
                    Date.now() + expiresIn*1000, // convert to ms
                    file?.expires_at ? file?.expires_at.getTime() : 0,
                )
            );

            await prisma.file.update({
                where: {
                    id: file?.id,
                },
                data: {
                    expires_at: newExpiry,
                }
            });

            return {
                message: "Successful!",
                url: presignedUrl,
                expires_at: newExpiry
            };
            
        } catch (error) {
            console.error("Error sharing file: ", error);
            throw new Error(`Failed to share file:  ${error instanceof Error ? error.message : 'Unknown error'}`);           
        }
    }
    
    static async getFile(fileId: string) : Promise<File> {
        try {
            const file = await prisma.file.findUnique({
                where: {
                    id: fileId,
                }
            });
            return file;
        } catch (error) {
            console.error("Error getting file: ", error);
            throw new Error(`Failed to get file:  ${error instanceof Error ? error.message : 'Unknown error'}`);  
        }
    }

    static async fileInRootFolder(rootFolderId: string, fileId: string) : Promise<boolean> {
        try {
            const rootFolder = await prisma.folder.findUnique({
                where: {
                    id: rootFolderId,
                }
            });
        
            const currentFile = await prisma.file.findUnique({
                where: {
                    id: fileId,
                }
            });

            if (!currentFile || !rootFolder) return false;

            let currentFolderId = currentFile.parent_folder_id;  
        
            while (currentFolderId) {
                if (currentFolderId === rootFolder.id) {
                    return true;
                }
        
                const parentFolder = await prisma.folder.findUnique({
                    where: {
                        id: currentFolderId,
                    }
                });
        
                if (!parentFolder) break;
        
                currentFolderId = parentFolder.parent_folder_id;
            }
        
            return false;
        } catch (error) {
            console.error("Error determining if file in root folder: ", error);
            throw new Error(`Failed to determine if file in root folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async getFileFromShareToken(root_folder: Folder, file: File) : Promise<{ 
        url: string,
        expires_at: Date,
        }> {
        try {
            if (await FileService.fileInRootFolder(root_folder.id, file.id)) {
                const expiresInSeconds = root_folder.expires_at
                    ? Math.max(1, Math.floor((root_folder.expires_at.getTime() - Date.now()) / 1000))
                    : 3600; // 1 hour default
                const expiresInHours = Math.ceil(expiresInSeconds / 3600);
                const cappedHours = Math.min(expiresInHours, 168);
                const { url: presignedUrl } = await FileService.shareFile(file.id, cappedHours); 
                return {
                    url: presignedUrl,
                    expires_at: root_folder.expires_at as Date,
                };
            }
        } catch (error) {
           console.error("Error getting file from share token: ", error);
           throw new Error(`Failed to get file from share token: ${error instanceof Error ? error.message : 'Unknown error'}`); 
        }
    }
}