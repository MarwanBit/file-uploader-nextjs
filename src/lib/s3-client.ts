import { S3Client } from "@aws-sdk/client-s3";
import ConfigSingleton from "./config";

/**
 * @fileoverview AWS S3 client singleton for file storage operations.
 * 
 * This module provides a configured singleton instance of the AWS S3 Client
 * for all file storage operations. Using a singleton ensures consistent
 * configuration and connection reuse throughout the application.
 * 
 * @module lib/s3-client
 */

const config = ConfigSingleton.getInstance().config;

/**
 * Singleton instance of AWS S3 Client for file storage operations.
 * 
 * This client is pre-configured with AWS credentials and region from environment
 * variables. It provides methods for uploading, downloading, deleting, and managing
 * files in AWS S3 storage.
 * 
 * @constant {S3Client} s3Client
 * 
 * @example
 * ```typescript
 * import s3Client from '@/lib/s3-client';
 * import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
 * 
 * // Upload a file
 * const uploadCommand = new PutObjectCommand({
 *   Bucket: 'my-bucket',
 *   Key: 'folder/file.pdf',
 *   Body: fileBuffer,
 *   ContentType: 'application/pdf'
 * });
 * await s3Client.send(uploadCommand);
 * 
 * // Get a file
 * const getCommand = new GetObjectCommand({
 *   Bucket: 'my-bucket',
 *   Key: 'folder/file.pdf'
 * });
 * const response = await s3Client.send(getCommand);
 * 
 * // Delete a file
 * const deleteCommand = new DeleteObjectCommand({
 *   Bucket: 'my-bucket',
 *   Key: 'folder/file.pdf'
 * });
 * await s3Client.send(deleteCommand);
 * ```
 * 
 * @example
 * ```typescript
 * // Generate presigned URL
 * import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
 * import { GetObjectCommand } from '@aws-sdk/client-s3';
 * 
 * const command = new GetObjectCommand({
 *   Bucket: 'my-bucket',
 *   Key: 'folder/file.pdf'
 * });
 * 
 * const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
 * console.log('Download URL:', url);
 * ```
 * 
 * @remarks
 * - Configured from environment variables via {@link ConfigSingleton}
 * - Region, access key, and secret key are required
 * - Singleton pattern ensures consistent configuration
 * - Compatible with all AWS SDK v3 S3 commands
 * - Automatically manages connection pooling and retries
 * 
 * @see {@link ConfigSingleton} for configuration management
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/ | AWS SDK S3 Client Documentation}
 */
const s3Client: S3Client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
});

export default s3Client;