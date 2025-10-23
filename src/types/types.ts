/**
 * @fileoverview Type definitions for core data models.
 * 
 * This module defines TypeScript types for the main data structures used throughout
 * the application, including folders and files. These types mirror the Prisma schema
 * and provide type safety for API responses and client-side data.
 * 
 * @module types/types
 */

/**
 * Represents a folder in the file storage system.
 * 
 * Folders form a hierarchical tree structure where each folder can contain
 * subfolders and files. The root folder is marked with `is_root: true` and
 * serves as the top-level container for all user content.
 * 
 * @typedef {Object} Folder
 * 
 * @property {string} id - Unique identifier for the folder (UUID)
 * @property {string} folder_name - Display name of the folder
 * @property {Date} created_at - Timestamp when the folder was created
 * @property {Date} updated_at - Timestamp when the folder was last modified
 * @property {boolean} is_root - Whether this is the user's root folder
 * @property {string | null} s3_link - Share token for public folder access (null if not shared)
 * @property {boolean} shared - Whether the folder is currently shared
 * @property {Date | null} expires_at - Expiration time for shared folder access (null if no expiration)
 * @property {string} owner_clerk_id - Clerk user ID of the folder owner
 * @property {string | null | undefined} parent_folder_id - ID of the parent folder (null for root folders)
 * @property {Folder[]} subfolders - Array of child folders contained within this folder
 * @property {File[]} [files] - Optional array of files contained within this folder
 * 
 * @example
 * ```typescript
 * // Root folder structure
 * const rootFolder: Folder = {
 *   id: "folder-123",
 *   folder_name: "JohnDoe",
 *   created_at: new Date("2024-01-01"),
 *   updated_at: new Date("2024-01-01"),
 *   is_root: true,
 *   s3_link: null,
 *   shared: false,
 *   expires_at: null,
 *   owner_clerk_id: "user_abc123",
 *   parent_folder_id: null,
 *   subfolders: [],
 *   files: []
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Shared folder with expiration
 * const sharedFolder: Folder = {
 *   id: "folder-456",
 *   folder_name: "Documents",
 *   created_at: new Date("2024-01-01"),
 *   updated_at: new Date("2024-01-15"),
 *   is_root: false,
 *   s3_link: "share-token-abc123",
 *   shared: true,
 *   expires_at: new Date("2024-01-16"), // Expires in 24 hours
 *   owner_clerk_id: "user_abc123",
 *   parent_folder_id: "folder-123",
 *   subfolders: [
 *     // Nested subfolders...
 *   ],
 *   files: [
 *     // Files in this folder...
 *   ]
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Recursive folder tree
 * const folderTree: Folder = {
 *   id: "root-id",
 *   folder_name: "My Files",
 *   is_root: true,
 *   subfolders: [
 *     {
 *       id: "work-id",
 *       folder_name: "Work",
 *       is_root: false,
 *       parent_folder_id: "root-id",
 *       subfolders: [
 *         {
 *           id: "projects-id",
 *           folder_name: "Projects",
 *           is_root: false,
 *           parent_folder_id: "work-id",
 *           subfolders: [],
 *           files: []
 *         }
 *       ],
 *       files: []
 *     }
 *   ],
 *   files: []
 * };
 * ```
 * 
 * @remarks
 * - Root folders have `is_root: true` and `parent_folder_id: null`
 * - The `s3_link` field contains the share token when a folder is shared
 * - Recursive structures are supported for nested folder hierarchies
 * - The `files` property is optional and may not be included in all API responses
 * - Shared folders expire automatically based on the `expires_at` timestamp
 * 
 * @see {@link File} for the file type definition
 * @see {@link FolderService} for folder operations
 */
export type Folder = {
    id: string;
    folder_name: string;
    created_at: Date;
    updated_at: Date;
    is_root: boolean;
    s3_link: string | null;
    shared: boolean;
    expires_at: Date | null;
    owner_clerk_id: string;
    // just added these
    parent_folder_id: string | null | undefined;
    subfolders: Folder[];
    files?: File[];
}

/**
 * Represents a file in the storage system.
 * 
 * Files are stored in AWS S3 and their metadata is managed in the database.
 * Each file belongs to a parent folder and is owned by a specific user.
 * Files can be shared with expiration times for temporary access.
 * 
 * @typedef {Object} File
 * 
 * @property {string} id - Unique identifier for the file (UUID)
 * @property {string} file_name - Display name of the file including extension
 * @property {number} size - File size in bytes
 * @property {Date} created_at - Timestamp when the file was uploaded
 * @property {boolean} shared - Whether the file is currently shared
 * @property {string | null} s3_link - Share link or presigned URL (null if not generated)
 * @property {string | null} s3_key - S3 object key/path for the file in the bucket
 * @property {Date | null} expires_at - Expiration time for shared file access (null if no expiration)
 * @property {string | null} parent_folder_id - ID of the containing folder
 * @property {string} owner_clerk_id - Clerk user ID of the file owner
 * 
 * @example
 * ```typescript
 * // Basic file
 * const file: File = {
 *   id: "file-123",
 *   file_name: "document.pdf",
 *   size: 1024000, // 1 MB in bytes
 *   created_at: new Date("2024-01-15"),
 *   shared: false,
 *   s3_link: null,
 *   s3_key: "user_abc123/JohnDoe/Documents/document.pdf",
 *   expires_at: null,
 *   parent_folder_id: "folder-456",
 *   owner_clerk_id: "user_abc123"
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Shared file with expiration
 * const sharedFile: File = {
 *   id: "file-789",
 *   file_name: "report.xlsx",
 *   size: 2048000, // 2 MB
 *   created_at: new Date("2024-01-10"),
 *   shared: true,
 *   s3_link: "https://s3.amazonaws.com/bucket/file?presigned-params",
 *   s3_key: "user_abc123/JohnDoe/Work/report.xlsx",
 *   expires_at: new Date("2024-01-17"), // Expires in 7 days
 *   parent_folder_id: "folder-work",
 *   owner_clerk_id: "user_abc123"
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Display file in UI
 * function FileListItem({ file }: { file: File }) {
 *   const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
 *   const isExpired = file.expires_at && file.expires_at < new Date();
 *   
 *   return (
 *     <div>
 *       <h3>{file.file_name}</h3>
 *       <p>Size: {sizeInMB} MB</p>
 *       <p>Uploaded: {file.created_at.toLocaleDateString()}</p>
 *       {file.shared && (
 *         <span>
 *           {isExpired ? 'Share expired' : 'Shared'}
 *           {file.expires_at && ` until ${file.expires_at.toLocaleDateString()}`}
 *         </span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Filter files by type
 * const files: File[] = [
 *   { file_name: "doc.pdf", ... },
 *   { file_name: "image.jpg", ... },
 *   { file_name: "data.csv", ... }
 * ];
 * 
 * const pdfFiles = files.filter(f => f.file_name.endsWith('.pdf'));
 * const images = files.filter(f => 
 *   /\.(jpg|jpeg|png|gif)$/i.test(f.file_name)
 * );
 * ```
 * 
 * @remarks
 * - File sizes are stored in bytes; convert to KB/MB/GB for display
 * - The `s3_key` follows the pattern: `{owner}/{rootFolder}/{path}/{filename}`
 * - Presigned URLs in `s3_link` are temporary and expire after a set time
 * - Shared files can be accessed without authentication using the share token
 * - Files belong to exactly one parent folder (never null in practice)
 * 
 * @see {@link Folder} for the folder type definition
 * @see {@link FileService} for file operations
 */
export type File = {
    id: string;
    file_name: string;
    size: number;
    created_at: Date;
    shared: boolean;
    s3_link: string | null;
    s3_key: string | null;
    expires_at: Date | null;
    parent_folder_id: string | null;
    owner_clerk_id: string;
}