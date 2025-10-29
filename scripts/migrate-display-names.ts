#!/usr/bin/env tsx

/**
 * Migration script to add display_name to existing folders
 * 
 * This script updates existing root folders to have display_name set to
 * the user's firstName + lastName, and updates subfolders to have
 * display_name = folder_name.
 */

import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

async function migrateDisplayNames() {
    console.log('Starting display_name migration...');
    
    try {
        // Get all root folders
        const rootFolders = await prisma.folder.findMany({
            where: { is_root: true },
            select: { id: true, folder_name: true, owner_clerk_id: true }
        });

        console.log(`Found ${rootFolders.length} root folders to migrate`);

        for (const folder of rootFolders) {
            try {
                // Get user info from Clerk
                const client = await clerkClient();
                const user = await client.users.getUser(folder.owner_clerk_id);
                const displayName = `${user.firstName}${user.lastName}`;

                // Update root folder with display_name
                await prisma.folder.update({
                    where: { id: folder.id },
                    data: { 
                        display_name: displayName,
                        folder_name: `root_${folder.owner_clerk_id}` // Update to use unique ID
                    }
                });

                console.log(`Updated root folder ${folder.id} with display_name: ${displayName}`);
            } catch (error) {
                console.error(`Error updating root folder ${folder.id}:`, error);
            }
        }

        // Get all subfolders and set display_name = folder_name
        const subFolders = await prisma.folder.findMany({
            where: { is_root: false },
            select: { id: true, folder_name: true }
        });

        console.log(`Found ${subFolders.length} subfolders to migrate`);

        for (const folder of subFolders) {
            try {
                await prisma.folder.update({
                    where: { id: folder.id },
                    data: { display_name: folder.folder_name }
                });

                console.log(`Updated subfolder ${folder.id} with display_name: ${folder.folder_name}`);
            } catch (error) {
                console.error(`Error updating subfolder ${folder.id}:`, error);
            }
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateDisplayNames()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

export { migrateDisplayNames };
