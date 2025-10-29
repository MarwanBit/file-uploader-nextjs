import prisma from '@/lib/db-client';
import ConfigSingleton from '@/lib/config';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3-client';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type File, type Folder } from '@/types/types';

/**
 * Service class for managing file operations including S3 storage and database persistence.
 * 
 * @remarks
 * This service provides a centralized interface for all file-related operations, including:
 * - Generating presigned URLs for secure file access
 * - Deleting files from both S3 and the database
 * - Creating shareable file links with expiration times
 * - Managing file permissions and folder hierarchies
 * 
 * All methods in this service are static and handle their own error management.
 * 
 * @example
 * ```typescript
 * // Get a presigned URL for a file
 * const { url } = await FileService.getFileUrl('file-123');
 * 
 * // Share a file for 24 hours
 * const shareInfo = await FileService.shareFile('file-123', 24);
 * console.log(`File expires at: ${shareInfo.expires_at}`);
 * 
 * // Delete a file
 * await FileService.deleteFile('file-123');
 * ```
 * 
 * @see {@link https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html | AWS S3 Presigned URLs}
 */
export class FileService {
    /**
     * Configuration singleton instance for accessing environment variables and app settings.
     * @private
     */
    private static config = ConfigSingleton.getInstance().config;

    /**
     * Generates a temporary presigned URL for accessing a file stored in S3.
     * 
     * This method retrieves file metadata from the database and creates a presigned URL
     * that allows temporary access to the file without requiring AWS credentials.
     * The URL expires after 4000 seconds (~67 minutes) by default.
     * 
     * @param fileId - The unique identifier of the file in the database
     * 
     * @returns A promise that resolves to an object containing the presigned URL
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The file is not found in the database
     * - The file doesn't have an associated S3 key
     * - There's a failure communicating with S3 or the database
     * 
     * @example
     * ```typescript
     * try {
     *   const result = await FileService.getFileUrl('abc-123-def');
     *   console.log('Download URL:', result.url);
     *   // User can now access the file at this URL for ~67 minutes
     * } catch (error) {
     *   console.error('Failed to get file URL:', error);
     * }
     * ```
     * 
     * @remarks
     * The presigned URL is temporary and will expire. Clients should not cache these URLs
     * for extended periods. The expiration time is currently hardcoded to 4000 seconds but
     * could be made configurable in future versions.
     * 
     * @see {@link deleteFile} for removing files
     * @see {@link shareFile} for creating shareable links with custom expiration times
     */
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

    /**
     * Permanently deletes a file from both S3 storage and the database.
     * 
     * This operation is irreversible. The method first retrieves the file metadata,
     * removes the object from S3, and then deletes the database record.
     * 
     * @param fileId - The unique identifier of the file to delete
     * 
     * @returns A promise that resolves to an object containing a success message
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The file is not found in the database
     * - The S3 deletion fails
     * - The database deletion fails
     * 
     * @example
     * ```typescript
     * // Delete a file
     * try {
     *   const result = await FileService.deleteFile('file-456');
     *   console.log(result.message); // "deletion successful!"
     * } catch (error) {
     *   console.error('Failed to delete file:', error);
     * }
     * ```
     * 
     * @remarks
     * This is a destructive operation. Consider implementing a soft delete mechanism
     * or moving files to a "trash" folder before permanent deletion in production systems.
     * 
     * @see {@link getFile} for retrieving file metadata before deletion
     * 
     * @public
     */
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

    /**
     * Creates a shareable presigned URL for a file with a custom expiration time.
     * 
     * This method generates a temporary URL that can be shared with others to provide
     * time-limited access to a file. The file's expiration time in the database is also
     * updated to match or extend the current expiration.
     * 
     * @param fileId - The unique identifier of the file to share
     * @param hours - The number of hours until the share link expires (converted to seconds internally)
     * 
     * @returns A promise that resolves to an object containing:
     * - `url`: The presigned URL for accessing the file
     * - `expires_at`: The Date when the share link expires
     * - `message`: A success message
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The file is not found in the database
     * - The file doesn't have an S3 key
     * - The presigned URL generation fails
     * - The database update fails
     * 
     * @example
     * ```typescript
     * // Share a file for 48 hours
     * const shareInfo = await FileService.shareFile('file-789', 48);
     * console.log(`Share this link: ${shareInfo.url}`);
     * console.log(`Link expires: ${shareInfo.expires_at.toLocaleString()}`);
     * 
     * // Share for 1 hour
     * const quickShare = await FileService.shareFile('file-789', 1);
     * ```
     * 
     * @remarks
     * The method intelligently handles expiration times by taking the maximum of:
     * 1. The new expiration time (now + hours)
     * 2. The existing expiration time (if any)
     * 
     * This ensures that sharing a file multiple times extends the expiration rather
     * than potentially shortening it.
     * 
     * @see {@link getFileUrl} for generating URLs without updating expiration
     * @see {@link getFileFromShareToken} for accessing shared files via share tokens
     * 
     * @beta
     * This method's expiration extension behavior may change in future versions to support
     * more granular control over share link lifecycles.
     */
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
    
    /**
     * Retrieves file metadata from the database by its unique identifier.
     * 
     * This is a simple getter method that fetches a file record without any
     * additional processing or URL generation.
     * 
     * @param fileId - The unique identifier of the file to retrieve
     * 
     * @returns A promise that resolves to the File object if found, or null if not found
     * 
     * @throws {@link Error}
     * Throws an error if there's a database communication failure
     * 
     * @example
     * ```typescript
     * const file = await FileService.getFile('file-abc-123');
     * if (file) {
     *   console.log('File name:', file.name);
     *   console.log('File size:', file.size);
     *   console.log('Created at:', file.created_at);
     * } else {
     *   console.log('File not found');
     * }
     * ```
     * 
     * @see {@link File} for the complete file type definition
     */
    static async getFile(fileId: string) : Promise<File | null> {
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

    /**
     * Determines whether a file exists within a specific folder hierarchy.
     * 
     * This method traverses the folder tree upward from the file's parent folder
     * to check if the specified root folder is an ancestor. This is useful for
     * permission checks and validating file access within shared folders.
     * 
     * @param rootFolderId - The unique identifier of the potential root/ancestor folder
     * @param fileId - The unique identifier of the file to check
     * 
     * @returns A promise that resolves to:
     * - `true` if the file exists within the folder hierarchy rooted at rootFolderId
     * - `false` if the file is not within that hierarchy, or if either the file or folder doesn't exist
     * 
     * @throws {@link Error}
     * Throws an error if there's a database communication failure during traversal
     * 
     * @example
     * ```typescript
     * // Check if a file belongs to a shared folder
     * const isInFolder = await FileService.fileInRootFolder(
     *   'shared-folder-123',
     *   'file-456'
     * );
     * 
     * if (isInFolder) {
     *   console.log('User has access to this file via the shared folder');
     * } else {
     *   console.log('File is not in the shared folder hierarchy');
     * }
     * ```
     * 
     * @remarks
     * The algorithm uses an iterative approach to traverse the folder tree:
     * 1. Start with the file's immediate parent folder
     * 2. Check if it matches the root folder ID
     * 3. If not, move to the parent's parent folder
     * 4. Repeat until a match is found or the tree root is reached
     * 
     * This method is commonly used in conjunction with share token validation
     * to ensure users can only access files within folders they have permission to view.
     * 
     * @see {@link getFileFromShareToken} which uses this method for permission validation
     * @see {@link Folder} for the folder type definition
     * 
     * @internal
     * The current implementation makes multiple database queries during traversal.
     * Consider optimizing with a recursive CTE or materialized path approach for
     * better performance with deep folder hierarchies.
     */
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

    /**
     * Generates a presigned URL for a file accessed via a share token.
     * 
     * This method validates that the requested file belongs to the shared folder hierarchy
     * and creates a presigned URL with an expiration time matching the folder's share token
     * expiration. The URL expiration is capped at 168 hours (7 days) to comply with AWS
     * S3 presigned URL limitations.
     * 
     * @param root_folder - The shared folder object containing the share token expiration
     * @param file - The file object to generate a URL for
     * 
     * @returns A promise that resolves to:
     * - An object with `url` and `expires_at` if the file is in the folder hierarchy
     * - `null` if the file is not within the shared folder's hierarchy
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The folder hierarchy traversal fails
     * - The presigned URL generation fails
     * - There's a database communication error
     * 
     * @example
     * ```typescript
     * // Assuming we have a shared folder and file from a share token
     * const sharedFolder = await getSharedFolder(shareToken);
     * const requestedFile = await getFile(fileId);
     * 
     * const result = await FileService.getFileFromShareToken(
     *   sharedFolder,
     *   requestedFile
     * );
     * 
     * if (result) {
     *   console.log('Access URL:', result.url);
     *   console.log('Expires at:', result.expires_at);
     *   // Redirect user to the presigned URL
     * } else {
     *   console.log('File not accessible via this share token');
     * }
     * ```
     * 
     * @remarks
     * This method implements several important behaviors:
     * 
     * **Expiration Time Calculation:**
     * - If the folder has an expiration, calculates remaining time in seconds
     * - Defaults to 1 hour if expiration has passed or is not set
     * - Converts to hours (rounded up) and caps at 168 hours (AWS S3 limit)
     * 
     * **Security:**
     * - Validates file belongs to the shared folder hierarchy before generating URL
     * - Respects the folder's share token expiration
     * - Returns null if validation fails (preventing unauthorized access)
     * 
     * **Performance:**
     * - Delegates hierarchy checking to {@link fileInRootFolder}
     * - Delegates URL generation to {@link shareFile}
     * 
     * @see {@link fileInRootFolder} for the hierarchy validation logic
     * @see {@link shareFile} for the presigned URL generation logic
     * @see {@link https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html | AWS S3 Presigned URL Limits}
     */
    static async getFileFromShareToken(root_folder: Folder, file: File) : Promise<{ 
        url: string,
        expires_at: Date,
        } | null> {
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
            return null;
        } catch (error) {
           console.error("Error getting file from share token: ", error);
           throw new Error(`Failed to get file from share token: ${error instanceof Error ? error.message : 'Unknown error'}`); 
        }
    }
}