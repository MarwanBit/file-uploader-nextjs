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

// REFACTORED

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