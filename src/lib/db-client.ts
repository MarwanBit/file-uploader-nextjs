import { PrismaClient } from "@/../prisma/generated/prisma";

/**
 * @fileoverview Prisma database client singleton.
 * 
 * This module provides a singleton instance of the Prisma Client for database
 * operations. Using a singleton ensures that only one database connection pool
 * is created and reused throughout the application.
 * 
 * @module lib/db-client
 */

/**
 * Singleton instance of Prisma Client for database operations.
 * 
 * This client provides a type-safe interface for database queries and mutations
 * using Prisma ORM. It manages the connection pool and provides methods for
 * interacting with all database models (Folder, File, etc.).
 * 
 * @constant {PrismaClient} prisma
 * 
 * @example
 * ```typescript
 * import prisma from '@/lib/db-client';
 * 
 * // Query folders
 * const folders = await prisma.folder.findMany({
 *   where: { owner: userId },
 *   include: { files: true, subfolders: true }
 * });
 * 
 * // Create a file
 * const newFile = await prisma.file.create({
 *   data: {
 *     file_name: 'document.pdf',
 *     s3_key: 'path/to/document.pdf',
 *     owner: userId,
 *     folder_id: folderId
 *   }
 * });
 * 
 * // Update a folder
 * await prisma.folder.update({
 *   where: { id: folderId },
 *   data: { expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) }
 * });
 * 
 * // Delete with transaction
 * await prisma.$transaction(async (tx) => {
 *   await tx.file.deleteMany({ where: { folder_id: folderId } });
 *   await tx.folder.delete({ where: { id: folderId } });
 * });
 * ```
 * 
 * @remarks
 * - Uses generated Prisma client from `prisma/generated/prisma`
 * - Connection details are configured in `prisma/schema.prisma`
 * - Singleton pattern prevents multiple connection pools
 * - Supports transactions, relations, and type-safe queries
 * - Automatically handles connection pooling and cleanup
 * 
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client | Prisma Client Documentation}
 */
const prisma: PrismaClient = new PrismaClient();

export default prisma;