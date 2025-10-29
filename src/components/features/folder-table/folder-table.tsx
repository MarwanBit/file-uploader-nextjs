/**
 * @fileoverview Table component displaying folders and files.
 * 
 * This component renders a table showing the contents of the current folder,
 * including both subfolders and files. Clicking folders navigates to them,
 * while clicking files opens the file sidebar.
 * 
 * @module components/features/folder-table
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
import { useRouter } from "next/navigation";

/**
 * Table component for displaying folder contents.
 * 
 * Renders a table with folders listed first, followed by files. Clicking
 * a folder row navigates to that folder. Clicking a file row triggers the
 * provided callback (typically opens file sidebar).
 * 
 * @param props - Component props
 * @param props.files - Array of files in the current folder
 * @param props.selectedFile - The currently selected file (unused in display)
 * @param props.handleRowClick - Callback when a file row is clicked
 * @param props.folders - Array of subfolders in the current folder
 * @returns Table displaying folder contents
 * 
 * @example
 * ```tsx
 * <FolderTable
 *   files={currentFiles}
 *   selectedFile={selectedFile}
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
 * // Empty folder
 * <FolderTable
 *   files={[]}
 *   selectedFile={null}
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
 * - Clicking folder navigates to `/folders/[folderId]`
 * - Clicking file triggers `handleRowClick` callback
 * - Hover effect on rows for better UX
 * - Displays caption: "Contents of the Current Folder"
 * 
 * @see {@link Folder} for folder type definition
 * @see {@link File} for file type definition
 */
export default function FolderTable({ files, selectedFile, handleRowClick, folders } : {
    files: File[] | null,
    selectedFile: File | null,
    handleRowClick: (file: File) => void
    folders: Folder[] | null | undefined;
}) {
    const router = useRouter();
    const handleFolderClick = (folderId: string) => {
        router.push(`/folders/${folderId}`)
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
                        <TableCell>{file.size}kb</TableCell>
                        <TableCell className="text-right">{(new Date(file.created_at)).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}