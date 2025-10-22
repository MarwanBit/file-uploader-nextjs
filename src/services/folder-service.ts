import { clerkClient, User } from '@clerk/nextjs/server';
import prisma from '@/lib/db-client';
import ConfigSingleton from '@/lib/config';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '@/lib/s3-client';
import { Folder } from '@/types/types';
import { IFolderService } from '@/interfaces/folder-service.interface';

export class FolderService implements IFolderService {
    private static config = ConfigSingleton.getInstance().config;


    static async createRootFolder(user: User, userId: string): Promise<Folder> {
        try {
            const folderName = `${user.firstName}${user.lastName}`;
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

                return await tx.folder.create({
                    data: {
                        folder_name: folderName,
                        is_root: true,
                        owner_clerk_id: user.id,
                        s3_key: `${folderName}/.folder-info.txt`,
                        s3_link: this.buildS3Link(folderName),
                    },
                    include: {
                        subfolders: true,
                        files: true
                    }});
                });
            } catch (transactionError: any) {
               // Handle race condition OUTSIDE the transaction
                if (transactionError.code === 'P2002') {
                    console.log('Race condition: root folder created by another request, fetching...');
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
                await this.createFolderInfoFile(folderName, root_folder, folderName);
            }

            // Update user metadata with root folder ID (only if not already set)
            if (!user.publicMetadata?.root_folder) {
                const client = await clerkClient();
                console.log('Updating user metadata with root folder ID:', root_folder.id);
                await client.users.updateUser(userId, {
                    publicMetadata: {
                        ...user.publicMetadata,
                        root_folder: root_folder.id,
                    }
                });
                console.log('User metadata updated successfully');
            }
            
            return root_folder;
        } catch(error) {
            console.error("Error creating root folder: ", error);
            throw error;
        }
    }

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
            return folder;
        } catch (error) {
            console.error("Error creating root folder: ", error);
        }
    }

    static async createSubfolder(
        parent_folder: Folder, folderName: string, 
        root_folder: Folder, userId: string): Promise<Folder> {
        try {
            const path = `${root_folder?.folder_name}/${folderName}`;

            const new_folder = await prisma.folder.create({
                data: {
                    folder_name: folderName,
                    is_root: false,
                    owner_clerk_id: userId,
                    parent_folder_id: parent_folder.id,
                    s3_link: this.buildS3Link(path),
                    s3_key: `${path}/.folder-info.txt`,
                }
            });

            await this.createFolderInfoFile(path, new_folder, root_folder.folder_name);

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

            return new_folder;

        } catch(error) {
            console.error("Error creating subfolder: ", error);
            throw error;
        }
    }

    private static buildS3Link(path: string) : string {
        return `https://${this.config.APPLICATION_BUCKET_NAME}.s3.${this.config.AWS_REGION}.amazonaws.com/${path}`;
    }

    private static async createFolderInfoFile(
        path: string, folder: Folder, 
        rootFolderName: string): Promise<Folder> {
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

    static async getFolderRecursively(folderId: string) : Promise<unknown> {
        try {
            const folder = await prisma.folder.findUnique({
                where: { id: folderId },
                select: {
                  id: true,
                  folder_name: true,
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
                    const file = await prisma.file.findUnique({
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

    static async shareFolder(folderId: string, hours: number, origin: string): Promise<{ url: string, expires_at: Date }> {
        try {
            const folder = await prisma.folder.findUnique({
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

    static async uploadFileToFolder(
            root_folder: Folder, curr_folder: Folder, 
            file: File, buffer: Buffer, user: User): Promise<File | null> {
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: this.config.APPLICATION_BUCKET_NAME,
                Key: `${root_folder?.folder_name}/${file.name}`,
                Body: buffer,
                ContentType: file.type,
            }));

            const new_file = await prisma.file.create({
                data: {
                    file_name: file.name as string,
                    size: file.size,
                    parent_folder_id: curr_folder?.id,
                    owner_clerk_id: user.id,
                    s3_link: this.buildS3Link(`${root_folder?.folder_name}/${file.name}`),
                    s3_key: `${root_folder?.folder_name}/${file.name}`
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

            return new_file;
        } catch (error) {
            console.error("Error creating folder info file: ", error);
            throw new Error(`Failed to delete folder info file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async getAncestors(folderId: string | null, user: User) : Promise<{ id: string, name: string }[] | null> {
        try {
            if (!folderId) {
                const root_folder = await FolderService.getFolder(user.publicMetadata.root_folder as string);
                const res = [{
                    id: root_folder?.id, 
                    folder_name: root_folder?.folder_name,
                    parent_folder_id: root_folder?.parent_folder_id,
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
                        name: curr_folder.folder_name,
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

    static async getFolderByShareToken(shareToken: string) : Promise<Folder> {
        try {
            const folder = await prisma.folder.findUnique({
                where: {
                    shareToken: shareToken,
                }
            });
            return folder;
        } catch (error) {
            console.error("Error sharing file: ", error);
            throw new Error(`Failed to share file:  ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}