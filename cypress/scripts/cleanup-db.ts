import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import ConfigSingleton from '../../src/lib/config';
import { execSync } from 'child_process';

const config = ConfigSingleton.getInstance().config;

// Create S3 client
const s3Client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
});

async function cleanupS3() {
    try {
        console.log('🧹 Cleaning up S3 bucket...');
        console.log('Bucket name:', config.APPLICATION_BUCKET_NAME);
        console.log('AWS Region:', config.AWS_REGION);
        
        // List all objects in the bucket
        const listCommand = new ListObjectsV2Command({
            Bucket: config.APPLICATION_BUCKET_NAME,
        });
        
        const listResponse = await s3Client.send(listCommand);
        console.log('S3 list response:', JSON.stringify(listResponse, null, 2));
        
        if (listResponse.Contents && listResponse.Contents.length > 0) {
            console.log(`Found ${listResponse.Contents.length} objects to delete`);
            console.log('Objects to delete:', listResponse.Contents.map(obj => obj.Key));
            
            // Delete all objects
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: config.APPLICATION_BUCKET_NAME,
                Delete: {
                    Objects: listResponse.Contents.map(obj => ({ Key: obj.Key! })),
                },
            });
            
            const deleteResponse = await s3Client.send(deleteCommand);
            console.log('Delete response:', JSON.stringify(deleteResponse, null, 2));
            
            // Verify deletion was successful
            if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
                console.error('❌ Some objects failed to delete:', deleteResponse.Errors);
                throw new Error(`Failed to delete ${deleteResponse.Errors.length} objects`);
            }
            
            console.log(`✅ Deleted ${listResponse.Contents.length} objects from S3`);
        } else {
            console.log('✅ S3 bucket is already empty');
        }
    } catch (error) {
        console.error('❌ S3 cleanup error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

async function cleanupDatabase() {
    let prisma;
    try {
        console.log('🧹 Cleaning up database...');

        // Generate Prisma client before importing it
        console.log('📦 Generating Prisma client...');
        execSync('npx prisma generate', { 
            stdio: 'inherit',
            cwd: process.cwd()
        });
        console.log('✅ Prisma client generated');

        // Now dynamically import Prisma
        const { PrismaClient } = await import('../../prisma/generated/prisma');
        prisma = new PrismaClient();
   
        // Delete in the correct order (files first, then folders)
        const deletedFiles = await prisma.file.deleteMany();
        console.log(`✅ Deleted ${deletedFiles.count} files from database`);
        
        const deletedFolders = await prisma.folder.deleteMany();
        console.log(`✅ Deleted ${deletedFolders.count} folders from database`);
        
        // Verify the tables are empty
        const remainingFiles = await prisma.file.count();
        const remainingFolders = await prisma.folder.count();
        
        console.log(`Remaining files: ${remainingFiles}`);
        console.log(`Remaining folders: ${remainingFolders}`);
        
        if (remainingFiles > 0 || remainingFolders > 0) {
            throw new Error(`Database cleanup incomplete: ${remainingFiles} files, ${remainingFolders} folders remaining`);
        }
        
        console.log('✅ Database cleanup completed');
    } catch (error) {
        console.error('❌ Database cleanup error:', error);
        throw error;
    } finally {
      if (prisma) {
        await prisma.$disconnect();
      }
    }
}

async function cleanup() {
    try {
        console.log('🧹 Starting cleanup...');
        
        // Clean up S3 first
        await cleanupS3();
        
        // Then clean up database
        await cleanupDatabase();
        
        console.log('✅ All cleanup completed successfully');
    } catch (error) {
        console.error('❌ Cleanup error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        process.exit(1); // Exit with error code
    }
}

cleanup();