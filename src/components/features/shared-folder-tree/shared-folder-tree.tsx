'use client'

import { File, Folder, Tree } from "@/components/ui/file-tree";
import { useFolder } from "@/hooks/use-folder";

interface FolderNode {
    id: string;
    folder_name: string;
    files?: {id: string; file_name: string }[];
    subfolders: FolderNode[];
    is_root: boolean;
}

// REFACTORED


export function SharedFolderTree() {
    const { rootFolder } = useFolder();

    return (
        <Tree>
            <RenderFolder folder={rootFolder}/>
        </Tree>
    );
}

function RenderFolder({ folder }: { folder: FolderNode | null }) {
    const { currentFolder, setCurrentFolder, folderMap } = useFolder();

    const isCurrentFolder = (folder && folder.id && (folder.id === currentFolder?.id)) || (!currentFolder?.id && folder?.is_root);
    return (folder &&
        <Folder 
            value={folder.id} 
            element={
                <div
                    className="hover:underline"
                    onClick={(e) => {
                        e.stopPropagation();
                        setCurrentFolder(folderMap[folder?.id]);
                    }}
                >
                    {folder.folder_name}
                </div>
            }
            className={`${
                isCurrentFolder 
                ? 'bg-blue-100 text-blue-800 font-semibold rounded px-1'
                : ''}`}
        >
            {/* Render subfolders recursively */}
            {folder.subfolders && folder.subfolders.map((sub) => (
                <RenderFolder key={sub.id} folder={sub}/>
            ))}
            {/* Render files */}
            {folder.files && folder.files.map((file) => (
                <File key={file.id} value={file.file_name} className="text-xs truncate">
                    {file.file_name}
                </File>
            ))}
        </Folder>
    );
}