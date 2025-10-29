/**
 * @fileoverview Table for displaying shared folder contents.
 * 
 * This component renders a table showing the contents of a shared folder,
 * including both subfolders and files. Unlike the regular FolderTable, this
 * version uses the FolderContext to manage navigation without URL changes.
 * 
 * @module components/features/shared-folder-table
 */
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";

import { type Folder, type File } from "@/types/types";

import { useFolder } from "@/hooks/use-folder";

/**
 * Table component for displaying shared folder contents.
 * 
 * Renders a table with folders listed first, followed by files. Clicking
 * a folder row updates the current folder in FolderContext. Clicking a file
 * row triggers the provided callback (typically opens file sidebar).
 * Navigation happens without URL changes since shared folders use token-based access.
 * 
 * @param props - Component props
 * @param props.files - Array of files in the current folder
 * @param props.handleRowClick - Callback when a file row is clicked
 * @param props.folders - Array of subfolders in the current folder
 * @returns Table displaying shared folder contents
 * 
 * @example
 * ```tsx
 * <SharedFolderTable
 *   files={currentFiles}
 *   handleRowClick={(file) => {
 *     setSelectedFile(file);
 *     setSidebarOpen(true);
 *   }}
 *   folders={subfolders}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Empty shared folder
 * <SharedFolderTable
 *   files={[]}
 *   handleRowClick={handleFileSelect}
 *   folders={[]}
 * />
 * ```
 * 
 * @remarks
 * - Folders are displayed first, then files
 * - Folder rows show "---" for size
 * - File rows show size in KB
 * - Both show creation date
 * - Clicking folder updates currentFolder in FolderContext (no URL change)
 * - Clicking file triggers `handleRowClick` callback
 * - Hover effect on rows for better UX
 * - Displays caption: "Contents of the Current Folder"
 * - Uses `useFolder` hook for accessing FolderContext
 * - Read-only: designed for shared folder views
 * 
 * @see {@link Folder} for folder type definition
 * @see {@link File} for file type definition
 * @see {@link useFolder} for the folder context hook
 */
export default function SharedFolderTable({ files, handleRowClick, folders } : {
    files: File[],
    handleRowClick: (file: File) => void,
    folders: Folder[] | null | undefined,
}) {
    const { setCurrentFolder, folderMap } = useFolder();

    const handleFolderClick = (folderId: string) => {
        setCurrentFolder(folderMap[folderId])
    }

    return (
        <Table className="mt-10">
            <TableCaption>Contents of the Current Folder</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Content Type</TableHead>
                    <TableHead className="w-[100px]">Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Created At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {folders && Object.values(folders).map((folder: Folder, index: number) => (           
                    <TableRow
                        key={index}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {handleFolderClick(folder.id)}}>
                            <TableCell>Folder</TableCell>
                            <TableCell className="font-medium">{folder.folder_name}</TableCell>
                            <TableCell>---</TableCell>
                            <TableCell className="text-right">{(new Date(folder.created_at)).toLocaleDateString()}</TableCell>
                    </TableRow>        
                ))}
                {files && files.map((file: File, index: number) => (
                    <TableRow 
                        key={index}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(file)}>
                        <TableCell>File</TableCell>
                        <TableCell className="font-medium">{file.file_name}</TableCell>
                        <TableCell>{file.size} bytes</TableCell>
                        <TableCell className="text-right">{(new Date(file.created_at)).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}