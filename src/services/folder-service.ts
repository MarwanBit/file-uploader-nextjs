import { clerkClient, User } from '@clerk/nextjs/server';
import prisma from '@/lib/db-client';
import ConfigSingleton from '@/lib/config';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3-client';
import { Folder, type File as CustomFile } from '@/types/types';

/**
 * Service class for managing folder operations including S3 storage and database persistence
 * 
 * @remarks
 * This service provides a centralized interface for all folder-related operations, including:
 * - create a "root Folder" for the user, where all subsequent folders are placed
 * - Deleting folders recursively from the database
 * - managing folder share 
 * - Managing folder permission
 * 
 * All methods in this service are static and handle their own error management
 * 
 * @example
 * ```typescript
 * // Create the rootFolder for a user
 * const { userId } = await auth();
 * const client = await clerkClient();
 * let user = await client.users.getUser(userId);
 * const root_folder = await FolderService.createRootFolder(user, userId);
 * ```
 */
export class FolderService {
    /**
     * Configuration singleton instance for accessing environment variables and app settings
     *
     * @private
     * @static
     * @memberof FolderService
     */
    private static config = ConfigSingleton.getInstance().config;

    /**
     * Generate the rootFolder for a user where all file and folder uploads are contained in.
     * Each user has a unique rootFolder whose name is the name of the folder.
     * 
     * @param user - The user object returned by Clerk's useUser() hooek
     * @param userId  - The userId returned by clerks auth() hook
     * @returns  A promise that resolves to a folder object, the folder object for the rootFolder.
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - A race condition occurs where multiple requests to create the same root folder occur.
     * - Database transcation fails
     * - There's a failure communicating with Clerk, S3, or the DB
     * 
     * @example
     * ```typescript
     * // Create the rootFolder for a user
     * const { userId } = await auth();
     * const client = await clerkClient();
     * let user = await client.users.getUser(userId);
     * const root_folder = await FolderService.createRootFolder(user, userId);
     * ```
     * 
     * @remarks
     * For some reason, even when testing with only one client there seems to be race conditions
     * which is why it is necessary to deal with them, hence the transactions and error handling.
     */
    static async createRootFolder(user: User, userId: string): Promise<Folder> {
        try {
            const displayName = `${user.firstName}${user.lastName}`;
            let root_folder;
            try {
                // Use transaction to make check and create atomic
                root_folder = await prisma.$transaction(async (tx) => {
                    // Check if root folder exists
                    const existingFolder = await tx.folder.findFirst({
                        where: {
                            owner_clerk_id: userId,
                            is_root: true,
                        },
                        include: {
                            subfolders: true,
                            files: true
                        }
                    });

                if (existingFolder) {
                    return existingFolder;
                }

                // Create folder with unique ID as folder_name and display_name for UI
                const newFolder = await tx.folder.create({
                    data: {
                        folder_name: `root_${userId}`, // Use unique identifier
                        display_name: displayName,    // Store user-friendly name
                        is_root: true,
                        owner_clerk_id: user.id,
                        s3_key: `root_user_${userId}/.folder-info.txt`, // Use userId for S3 paths
                        s3_link: this.buildS3Link(`root_user_${userId}`),
                    },
                    include: {
                        subfolders: true,
                        files: true
                    }
                });

                return newFolder;
                });
            } catch (transactionError: unknown) {
               // Handle race condition OUTSIDE the transaction
                if (transactionError && typeof transactionError === 'object' && 'code' in transactionError && transactionError.code === 'P2002') {
                    // Race condition: root folder created by another request, fetching...
                    root_folder = await prisma.folder.findFirst({
                        where: {
                            owner_clerk_id: userId,
                            is_root: true,
                        },
                        include: {
                            subfolders: true,
                            files: true
                        }
                    });
                    if (!root_folder) {
                        throw new Error('Root folder should exist but was not found');
                    }
                } else {
                    throw transactionError;
                } 
            }

            // External operations outside transaction
            // Create folder info file in S3 (only for new folders)
            if (!root_folder.subfolders || root_folder.subfolders.length === 0) {
                await this.createFolderInfoFile(`root_user_${userId}`, root_folder as unknown as Folder, userId);
            }

            // Update user metadata with root folder ID (only if not already set)
            if (!user.publicMetadata?.root_folder) {
                const client = await clerkClient();
                // Updating user metadata with root folder ID
                await client.users.updateUser(userId, {
                    publicMetadata: {
                        ...user.publicMetadata,
                        root_folder: root_folder.id,
                    }
                });
                // User metadata updated successfully
            }
            
            return root_folder as unknown as Folder;
        } catch(error) {
            console.error("Error creating root folder: ", error);
            throw error;
        }
    }

    /**
     * Retrieves a folder's complete information including its files and subfolders.
     * 
     * This method fetches a folder by its unique identifier and includes all related
     * entities (files and subfolders) in a single query for efficiency.
     * 
     * @param folderId - The unique identifier of the folder to retrieve
     * 
     * @returns A promise that resolves to the Folder object with populated files and subfolders
     * 
     * @throws {@link Error}
     * Throws an error if there's a database communication failure
     * 
     * @example
     * ```typescript
     * const folder = await FolderService.getFolder('folder-123');
     * console.log('Folder name:', folder.folder_name);
     * console.log('Number of files:', folder.files.length);
     * console.log('Number of subfolders:', folder.subfolders.length);
     * ```
     * 
     * @remarks
     * This method uses Prisma's `include` feature to eagerly load related entities,
     * avoiding N+1 query problems. The returned folder will always include `files`
     * and `subfolders` arrays, even if they're empty.
     * 
     * @see {@link getFolderRecursively} for retrieving the entire folder tree
     * @see {@link Folder} for the complete folder type definition
     */
    static async getFolder(folderId: string): Promise<Folder> {
        try {
            const folder = await prisma.folder.findUnique({
                where: {
                    id: folderId,
                },
                include: {
                    files: true,
                    subfolders: true,
                }
            });
            return folder as unknown as Folder;
        } catch (error) {
            console.error("Error creating root folder: ", error);
            throw error;
        }
    }

    /**
     * Creates a new subfolder within an existing parent folder.
     * 
     * This method creates a new folder in the database, generates a marker file in S3
     * to represent the folder structure, and updates the parent folder's relationships.
     * The folder path is constructed relative to the root folder.
     * 
     * @param parent_folder - The folder that will contain this new subfolder
     * @param folderName - The name for the new subfolder
     * @param root_folder - The user's root folder (used for path construction)
     * @param userId - The Clerk user ID of the folder owner
     * 
     * @returns A promise that resolves to the newly created Folder object
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The database insertion fails (e.g., duplicate folder name)
     * - The S3 folder info file creation fails
     * - The parent folder update fails
     * 
     * @example
     * ```typescript
     * const { userId } = await auth();
     * const parentFolder = await FolderService.getFolder('parent-id');
     * const rootFolder = await FolderService.getFolder(user.publicMetadata.root_folder);
     * 
     * const newFolder = await FolderService.createSubfolder(
     *   parentFolder,
     *   'My Documents',
     *   rootFolder,
     *   userId
     * );
     * 
     * console.log('Created folder:', newFolder.folder_name);
     * console.log('S3 path:', newFolder.s3_key);
     * ```
     * 
     * @remarks
     * This method performs several operations:
     * 1. Creates the folder record in the database
     * 2. Generates an S3 path: `{rootFolderName}/{folderName}/.folder-info.txt`
     * 3. Creates a marker file in S3 with folder metadata
     * 4. Updates the parent folder to include the new subfolder in its relationships
     * 
     * The `.folder-info.txt` file serves as a marker in S3 since S3 doesn't have
     * native folder support. It also stores useful metadata about the folder.
     * 
     * @see {@link createRootFolder} for creating the user's root folder
     * @see {@link createFolderInfoFile} for the S3 marker file creation logic
     */
    static async createSubfolder(
        parent_folder: Folder, folderName: string, 
        root_folder: Folder, userId: string): Promise<Folder> {
        try {
            const path = `root_user_${userId}/${folderName}`; // Use userId instead of folder_name

            const new_folder = await prisma.folder.create({
                data: {
                    folder_name: folderName,
                    display_name: folderName, // For subfolders, display_name = folder_name
                    is_root: false,
                    owner_clerk_id: userId,
                    parent_folder_id: parent_folder.id,
                    s3_link: this.buildS3Link(path),
                    s3_key: `${path}/.folder-info.txt`,
                }
            });

            await this.createFolderInfoFile(path, new_folder as unknown as Folder, userId);

            await prisma.folder.update({
                where: {
                    id: parent_folder?.id,
                },
                data: {
                    subfolders: {
                        connect: { id: new_folder.id },
                    },
                },
            });

            return new_folder as unknown as Folder;

        } catch(error) {
            console.error("Error creating subfolder: ", error);
            throw error;
        }
    }

    /**
     * Constructs a direct HTTPS URL for accessing S3 objects.
     * 
     * This helper method generates a public S3 URL based on the configured bucket name,
     * AWS region, and the object's path. Note that the URL being public doesn't mean
     * the object is publicly accessible - access still depends on S3 bucket policies.
     * 
     * @param path - The S3 object key/path (e.g., "username/folder/file.txt")
     * 
     * @returns The complete HTTPS URL to the S3 object
     * 
     * @example
     * ```typescript
     * const url = FolderService.buildS3Link('john-doe/documents');
     * // Returns: "https://my-bucket.s3.us-east-1.amazonaws.com/john-doe/documents"
     * ```
     * 
     * @remarks
     * This method is used internally for generating S3 links stored in the database.
     * The URLs are stored for reference but actual file access typically uses presigned URLs
     * for security.
     * 
     * @private
     * @internal
     */
    private static buildS3Link(path: string) : string {
        return `https://${this.config.APPLICATION_BUCKET_NAME}.s3.${this.config.AWS_REGION}.amazonaws.com/${path}`;
    }

    /**
     * Creates a metadata marker file in S3 to represent a folder.
     * 
     * Since S3 doesn't have native folder support, this method creates a special
     * `.folder-info.txt` file that serves as both a folder marker and a metadata store.
     * The file contains human-readable information and S3 metadata tags.
     * 
     * @param path - The S3 path where the folder marker should be created
     * @param folder - The folder object containing metadata to store
     * @param rootFolderName - The name of the user's root folder
     * 
     * @returns A promise that resolves to the original folder object
     * 
     * @throws {@link Error}
     * Throws an error if the S3 upload fails
     * 
     * @example
     * ```typescript
     * // Internal usage during folder creation
     * await FolderService.createFolderInfoFile(
     *   'john-doe/documents',
     *   folderObject,
     *   'john-doe'
     * );
     * // Creates: john-doe/documents/.folder-info.txt in S3
     * ```
     * 
     * @remarks
     * The created file contains:
     * - **Body**: Human-readable text with folder path, ID, and creation timestamp
     * - **Metadata**: Machine-readable S3 metadata tags including:
     *   - username
     *   - folder-id
     *   - folder-name
     *   - created-at
     *   - folder-type (root or subfolder)
     * 
     * This metadata can be useful for S3 lifecycle policies, logging, and debugging.
     * 
     * @private
     * @internal
     * @see {@link createSubfolder} which calls this method
     * @see {@link createRootFolder} which calls this method
     */
    private static async createFolderInfoFile(
        path: string, folder: Folder, 
        _rootFolderName: string): Promise<Folder> {
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: this.config.APPLICATION_BUCKET_NAME,
                Key: `${path}/.folder-info.txt`,
                Body: `#Folder: ${path}\n# Folder ID ${folder.id}\n Created ${new Date().toISOString()}`,
                ContentType: 'text/plain',
                Metadata: {
                    'username': folder.folder_name,
                    'folder-id': folder.id,
                    'folder-name': folder.folder_name,
                    'created-at': new Date().toISOString(),
                    'folder-type': folder.is_root ? 'root': 'subfolder'
                }
            }));
            return folder;
        } catch (error) {
            console.error("Error creating folder info file:", error);
            throw new Error(`Failed to create folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Recursively retrieves a complete folder hierarchy starting from a given folder.
     * 
     * This method fetches a folder and all of its descendants (subfolders and their
     * subfolders, etc.) in a nested structure. It's particularly useful for rendering
     * folder trees or navigating the entire folder structure.
     * 
     * @param folderId - The unique identifier of the folder to start from
     * 
     * @returns A promise that resolves to:
     * - A nested object containing the folder with all subfolders recursively populated
     * - `null` if the folder doesn't exist
     * 
     * @throws {@link Error}
     * Throws an error if there's a database communication failure
     * 
     * @example
     * ```typescript
     * const folderTree = await FolderService.getFolderRecursively('root-folder-id');
     * 
     * // Structure returned:
     * // {
     * //   id: 'root-folder-id',
     * //   folder_name: 'My Root',
     * //   files: [...],
     * //   subfolders: [
     * //     {
     * //       id: 'sub1',
     * //       folder_name: 'Documents',
     * //       files: [...],
     * //       subfolders: [...]  // Recursively nested
     * //     }
     * //   ]
     * // }
     * ```
     * 
     * @remarks
     * **Performance Considerations:**
     * - This method makes N+1 database queries where N is the number of subfolders
     * - For large folder hierarchies, this can be slow and expensive
     * - Consider using pagination or limiting depth for production use
     * - Future optimization could use recursive CTEs or graph queries
     * 
     * **Data Structure:**
     * - Each folder includes: id, folder_name, is_root, created_at, updated_at, parent_folder_id
     * - Files are included with: id, file_name, created_at
     * - Subfolders are fully recursive (the entire tree is loaded)
     * 
     * @see {@link getFolder} for fetching a single folder without recursion
     * @see {@link deleteFolderRecursively} for the recursive deletion counterpart
     * 
     * @beta
     * The return type is currently `unknown` but should be typed as a recursive Folder interface
     * in a future version.
     */
    static async getFolderRecursively(folderId: string) : Promise<unknown> {
        try {
            const folder = await prisma.folder.findUnique({
                where: { id: folderId },
                select: {
                  id: true,
                  folder_name: true,
                  display_name: true,
                  is_root: true,
                  created_at: true,
                  updated_at: true,
                  parent_folder_id: true,
                  files: {
                    select: {
                      id: true,
                      file_name: true,
                      created_at: true,
                    },
                  },
                  subfolders: {
                    select: {
                      id: true,
                      folder_name: true,
                      display_name: true,
                      created_at: true,
                    },
                  },
                },
              }); 
        
            if (!folder) return null;
        
            const subfolders = await Promise.all(
                folder.subfolders.map(async (sub) => await FolderService.getFolderRecursively(sub.id))
            );
        
            return {
                ...folder,
                subfolders: subfolders,
            };
        } catch (error) {
            console.error("Error creating folder info file:", error);
            throw new Error(`Failed to create folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Recursively deletes a folder, all its subfolders, and all contained files.
     * 
     * This is a destructive operation that:
     * 1. Deletes all files in the current folder from both S3 and the database
     * 2. Recursively deletes all subfolders and their contents
     * 3. Deletes the folder's marker file from S3
     * 4. Deletes the folder record from the database
     * 
     * @param folderId - The unique identifier of the folder to delete
     * 
     * @returns A promise that resolves when the deletion is complete
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The folder is not found
     * - Any S3 deletion fails
     * - Any database deletion fails
     * 
     * @example
     * ```typescript
     * try {
     *   await FolderService.deleteFolderRecursively('folder-to-delete');
     *   console.log('Folder and all contents deleted successfully');
     * } catch (error) {
     *   console.error('Failed to delete folder:', error);
     * }
     * ```
     * 
     * @remarks
     * **Deletion Order:**
     * 1. Files in the current folder (S3 then database)
     * 2. All subfolders (recursive)
     * 3. The folder's `.folder-info.txt` marker in S3
     * 4. The folder record itself
     * 
     * **Error Handling:**
     * - Individual file S3 deletion errors are logged but don't stop the process
     * - Individual subfolder deletion errors are logged but don't stop the process
     * - This ensures maximum cleanup even if some operations fail
     * - However, the final folder deletion will fail if any child records remain
     * 
     * **Performance:**
     * - This operation can be slow for large folder hierarchies
     * - Consider implementing batch deletion for production use
     * - Each file and folder requires separate S3 and database operations
     * 
     * **Safety:**
     * - This operation is **irreversible** - there is no undo
     * - Consider implementing soft delete or a "trash" folder for production
     * - Consider adding authorization checks before calling this method
     * 
     * @see {@link getFolderRecursively} for retrieving folder structure before deletion
     * @see {@link https://docs.aws.amazon.com/AmazonS3/latest/userguide/delete-objects.html | AWS S3 Delete Objects}
     * 
     * @public
     */
    static async deleteFolderRecursively(folderId: string) : Promise<void> {
        try {
            const curr_folder = await prisma.folder.findUnique({
                where : {
                    id: folderId,
                },
                include: {
                    files: true,
                    subfolders: true,
                },
            });
            
            // delete all the files
            if (curr_folder?.files) {
                for (const leaf of curr_folder?.files) {
                    await prisma.file.findUnique({
                        where: {
                            id: leaf?.id
                        }});
                    
                    try {
                        // now we need to delete the file
                        await s3Client.send(
                            new DeleteObjectCommand({
                                Bucket: ConfigSingleton.getInstance().config.APPLICATION_BUCKET_NAME,
                                Key: leaf?.s3_key as string,
                            }));
                        // now we delete the file 
                        await prisma.file.delete({
                            where: {
                                id: leaf?.id,
                            },
                        });
                    } catch(s3Error) {
                        console.error(`Error deleting file from S3: ${leaf.file_name}`, s3Error);
                    }
                }
            }
        
            // delete all the folders recursively
            if (curr_folder?.subfolders) {
                for (const childFolder of curr_folder?.subfolders) {
                    try {
                        await FolderService.deleteFolderRecursively(childFolder.id);
                    } catch(error) {
                        console.error(error);
                    }
                }
            }
        
            // delete the .info-text
            if (curr_folder?.s3_link) {
                await s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: ConfigSingleton.getInstance().config.APPLICATION_BUCKET_NAME,
                        Key: curr_folder.s3_key as string,
                    })
                );
            }
            
            // delete the folder in prisma
            await prisma.folder.delete({
                where: {
                    id: curr_folder?.id,
                }
            });
        } catch(error) {
            console.error("Error creating folder info file: ", error);
            throw new Error(`Failed to delete folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Creates a shareable link for a folder with a time-limited access token.
     * 
     * This method generates a unique share token, sets an expiration time, and returns
     * a complete URL that can be shared with others to provide temporary access to the
     * folder and all its contents (including subfolders and files).
     * 
     * @param folderId - The unique identifier of the folder to share
     * @param hours - The number of hours until the share link expires
     * @param origin - The application's origin URL (e.g., "https://example.com")
     * 
     * @returns A promise that resolves to an object containing:
     * - `url`: The complete shareable URL with the token
     * - `expires_at`: The Date when the share link will expire
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The folder is not found
     * - The database update fails
     * 
     * @example
     * ```typescript
     * // Share a folder for 48 hours
     * const shareInfo = await FolderService.shareFolder(
     *   'folder-123',
     *   48,
     *   'https://myapp.com'
     * );
     * 
     * console.log('Share this link:', shareInfo.url);
     * // Output: "https://myapp.com/shared/folder/abc-def-ghi-123"
     * console.log('Expires at:', shareInfo.expires_at);
     * // Output: 2024-10-25T12:00:00.000Z
     * 
     * // Share for 7 days (168 hours)
     * const weekShare = await FolderService.shareFolder('folder-456', 168, origin);
     * ```
     * 
     * @remarks
     * **Security Features:**
     * - Generates a cryptographically secure random UUID as the share token
     * - Token is stored in the database and validated on access
     * - Links automatically expire after the specified time
     * - The token is unguessable (UUID v4 = 122 bits of randomness)
     * 
     * **Behavior:**
     * - Sets the folder's `shared` flag to `true`
     * - Generates a new `shareToken` (UUID)
     * - Calculates `expires_at` as current time + hours
     * - Returns a full URL: `{origin}/shared/folder/{shareToken}`
     * 
     * **Access Control:**
     * - Anyone with the share link can access the folder until expiration
     * - No authentication required for accessing shared folders
     * - All files within the folder hierarchy are accessible via the share token
     * - See {@link FileService.getFileFromShareToken} for how files are accessed
     * 
     * **Multiple Shares:**
     * - Sharing a folder again overwrites the previous share token
     * - Consider implementing multiple concurrent shares if needed
     * 
     * @see {@link getFolderByShareToken} for retrieving folders by their share token
     * @see {@link FileService.getFileFromShareToken} for file access via share tokens
     * 
     * @public
     */
    static async shareFolder(folderId: string, hours: number, origin: string): Promise<{ url: string, expires_at: Date }> {
        try {
            await prisma.folder.findUnique({
                where : {
                    id: folderId,
                },
            });

            const newExpiry = new Date(Date.now() + hours * 60 * 60 * 1000);
            const shareToken = crypto.randomUUID();
            
            await prisma.folder.update({
                where: {
                    id: folderId,
                },
                data: {
                    shared: true,
                    shareToken: shareToken,
                    expires_at: newExpiry,
                }
            });
            const shareURL = `${origin}/shared/folder/${shareToken}`;
            return { url: shareURL, expires_at: newExpiry };
        } catch (error) {
            console.error("Error creating folder info file: ", error);
            throw new Error(`Failed to delete folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Uploads a file to S3 and creates a corresponding database record within a folder.
     * 
     * This method handles the complete file upload process: storing the file in S3,
     * creating a database record with metadata, and linking it to the parent folder.
     * The file is stored at the root folder level in S3 but tracked within the
     * current folder in the database hierarchy.
     * 
     * @param root_folder - The user's root folder (used for S3 path construction)
     * @param curr_folder - The folder where the file will be logically stored
     * @param file - The browser File object containing metadata
     * @param buffer - The file's binary content as a Buffer
     * @param user - The Clerk user object (owner of the file)
     * 
     * @returns A promise that resolves to:
     * - The newly created File object with database metadata
     * - `null` if the upload fails (though typically throws an error instead)
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The S3 upload fails
     * - The database file creation fails
     * - The folder update to link the file fails
     * 
     * @example
     * ```typescript
     * const formData = await request.formData();
     * const file = formData.get('file') as File;
     * const arrayBuffer = await file.arrayBuffer();
     * const buffer = Buffer.from(arrayBuffer);
     * 
     * const uploadedFile = await FolderService.uploadFileToFolder(
     *   rootFolder,
     *   currentFolder,
     *   file,
     *   buffer,
     *   user
     * );
     * 
     * console.log('Uploaded:', uploadedFile?.file_name);
     * console.log('S3 location:', uploadedFile?.s3_key);
     * console.log('Size:', uploadedFile?.size, 'bytes');
     * ```
     * 
     * @remarks
     * **S3 Storage:**
     * - Files are stored at: `{rootFolderName}/{fileName}`
     * - The content type from the browser File object is preserved
     * - File overwrites are possible if the same name exists (no automatic versioning)
     * 
     * **Database Record:**
     * - Stores: file_name, size, parent_folder_id, owner_clerk_id, s3_link, s3_key
     * - Links to the current folder via `parent_folder_id`
     * - Links to the user via `owner_clerk_id`
     * - Timestamps are automatically added by Prisma
     * 
     * **Folder Relationship:**
     * - The file is added to the folder's `files` relationship
     * - This enables easy querying of all files in a folder
     * 
     * **Limitations:**
     * - No duplicate name checking (last upload wins)
     * - No virus scanning or content validation
     * - No file size limit enforcement (should be done before calling)
     * - All files go to root folder path regardless of subfolder depth
     * 
     * @see {@link getFolder} to retrieve folders and their files
     * @see {@link FileService.deleteFile} to delete uploaded files
     * 
     * @public
     */
    static async uploadFileToFolder(
            root_folder: Folder, curr_folder: Folder, 
            file: File, buffer: Buffer, user: User): Promise<CustomFile | null> {
        try {
            const filePath = `root_user_${user.id}/${file.name}`; // Use userId for S3 paths
            await s3Client.send(new PutObjectCommand({
                Bucket: this.config.APPLICATION_BUCKET_NAME,
                Key: filePath,
                Body: buffer,
                ContentType: file.type,
            }));

            const new_file = await prisma.file.create({
                data: {
                    file_name: file.name as string,
                    size: file.size,
                    parent_folder_id: curr_folder?.id,
                    owner_clerk_id: user.id,
                    s3_link: this.buildS3Link(filePath),
                    s3_key: filePath
                }
            });

            await prisma.folder.update({
                where: {
                    id: curr_folder?.id,
                },
                data: {
                    files: {
                        connect: { id: new_file.id }
                    }
                }
            });

            return new_file as unknown as CustomFile;
        } catch (error) {
            console.error("Error creating folder info file: ", error);
            throw new Error(`Failed to delete folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Retrieves the breadcrumb trail of folders from the root to a specified folder.
     * 
     * This method traverses the folder hierarchy upward from a given folder to build
     * an array of ancestor folders. It's commonly used for generating breadcrumb
     * navigation showing the current folder's path.
     * 
     * @param folderId - The folder ID to start from, or null to return just the root folder
     * @param user - The Clerk user object containing the root folder ID in publicMetadata
     * 
     * @returns A promise that resolves to:
     * - An array of objects with `id` and `name` properties, ordered from root to current
     * - `null` if the specified folder doesn't exist
     * 
     * @throws {@link Error}
     * Throws an error if there's a database communication failure
     * 
     * @example
     * ```typescript
     * // Get breadcrumbs for a nested folder
     * const ancestors = await FolderService.getAncestors('folder-deep-nested', user);
     * 
     * // Result: [
     * //   { id: 'root-id', name: 'JohnDoe' },
     * //   { id: 'documents-id', name: 'Documents' },
     * //   { id: 'work-id', name: 'Work' },
     * //   { id: 'folder-deep-nested', name: 'Projects' }
     * // ]
     * 
     * // Render breadcrumbs
     * ancestors?.forEach((ancestor, i) => {
     *   console.log(`${ancestor.name}${i < ancestors.length - 1 ? ' > ' : ''}`);
     * });
     * // Output: "JohnDoe > Documents > Work > Projects"
     * 
     * // Get just the root folder
     * const rootOnly = await FolderService.getAncestors(null, user);
     * // Returns: [{ id: 'root-id', name: 'JohnDoe' }]
     * ```
     * 
     * @remarks
     * **Algorithm:**
     * 1. If `folderId` is null, returns just the root folder
     * 2. Otherwise, starts from the specified folder
     * 3. Traverses up the tree via `parent_folder_id`
     * 4. Collects each folder's id and name
     * 5. Reverses the array to show root → current order
     * 
     * **Performance:**
     * - Makes N database queries where N is the depth of the folder
     * - For deeply nested folders, this can be slow
     * - Consider caching or optimizing with a recursive CTE
     * 
     * **Root Folder Access:**
     * - The root folder ID is retrieved from `user.publicMetadata.root_folder`
     * - This assumes the user's metadata has been properly set up
     * 
     * **Use Cases:**
     * - Breadcrumb navigation in UI
     * - Showing the current folder path
     * - Validating folder access permissions
     * 
     * @see {@link createRootFolder} which sets up the user's root folder
     * @see {@link getFolder} for retrieving full folder details
     * 
     * @public
     */
    static async getAncestors(folderId: string | null, user: User) : Promise<{ id: string, name: string }[] | null> {
        try {
            if (!folderId) {
                const root_folder = await FolderService.getFolder(user.publicMetadata.root_folder as string);
                const res = [{
                    id: root_folder?.id, 
                    name: root_folder?.display_name || root_folder?.folder_name, // Use display_name for UI
                }];
                return res;
            } else {
                let curr_folder = await FolderService.getFolder(folderId);
                if (!curr_folder) {
                    return null;
                }
                const ancestors: { id: string, name: string }[] = [];

                while (curr_folder) {
                    ancestors.push({
                        id: curr_folder.id,
                        name: curr_folder.display_name || curr_folder.folder_name,
                    });

                    if (!curr_folder?.parent_folder_id) break;

                    curr_folder = await FolderService.getFolder(curr_folder.parent_folder_id);
                }

                return ancestors.reverse();
            }
        } catch (error) {
            console.error("Error creating folder info file: ", error);
            throw new Error(`Failed to delete folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Retrieves a folder using its unique share token.
     * 
     * This method is used to look up shared folders when users access them via
     * share links. It validates the share token and returns the folder if found.
     * Note: This method does NOT validate expiration - that should be done by the caller.
     * 
     * @param shareToken - The unique share token (UUID) generated when the folder was shared
     * 
     * @returns A promise that resolves to the Folder object if found
     * 
     * @throws {@link Error}
     * Throws an error if:
     * - The database query fails
     * - The folder is not found (returns null in current implementation, but this is inconsistent)
     * 
     * @example
     * ```typescript
     * // Access a shared folder
     * const token = 'abc-def-123-456';
     * 
     * try {
     *   const sharedFolder = await FolderService.getFolderByShareToken(token);
     *   
     *   // Check if the share has expired (must be done manually)
     *   if (sharedFolder.expires_at && sharedFolder.expires_at < new Date()) {
     *     console.log('Share link has expired');
     *     return;
     *   }
     *   
     *   // Check if sharing is still enabled
     *   if (!sharedFolder.shared) {
     *     console.log('Folder is no longer shared');
     *     return;
     *   }
     *   
     *   console.log('Access granted to:', sharedFolder.folder_name);
     * } catch (error) {
     *   console.error('Invalid share token:', error);
     * }
     * ```
     * 
     * @remarks
     * **Important: Manual Validation Required**
     * 
     * This method only retrieves the folder - it does NOT:
     * - Check if the share has expired (`expires_at`)
     * - Verify the `shared` flag is still true
     * - Validate any permissions
     * 
     * Callers MUST implement these checks to ensure secure access.
     * 
     * **Typical Usage Flow:**
     * 1. User clicks share link with token in URL
     * 2. Frontend extracts token from URL
     * 3. Backend calls this method to get the folder
     * 4. Backend validates `expires_at` and `shared` flag
     * 5. If valid, grant access to folder contents
     * 6. Use {@link FileService.getFileFromShareToken} for file access
     * 
     * **Security Considerations:**
     * - Share tokens are cryptographically random UUIDs (secure)
     * - Tokens don't expire automatically - must be checked manually
     * - Revoking a share requires setting `shared = false` or changing the token
     * 
     * @see {@link shareFolder} which generates the share token
     * @see {@link FileService.getFileFromShareToken} for accessing files via share tokens
     * 
     * @public
     */
    static async getFolderByShareToken(shareToken: string) : Promise<Folder> {
        try {
            const folder = await prisma.folder.findUnique({
                where: {
                    shareToken: shareToken,
                }
            });
            return folder as unknown as Folder;
        } catch (error) {
            console.error("Error sharing file: ", error);
            throw new Error(`Failed to share file:  ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}