import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";

type File = {
    name: string;
    size: number;
    created_at: Date;
    type: string;
    id?: string;
}

import { type Folder } from "@/types/types";

import { useFolder } from "@/hooks/use-folder";

// REFACTORED


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
                        <TableCell>{file.size}kb</TableCell>
                        <TableCell className="text-right">{(new Date(file.created_at)).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}