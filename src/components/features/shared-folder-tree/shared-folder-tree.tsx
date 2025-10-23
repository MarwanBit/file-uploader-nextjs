/**
 * @fileoverview Tree navigation for shared folders.
 * 
 * This component displays a hierarchical tree view of the shared folder structure,
 * allowing users to navigate through folders and view files. Uses the FolderContext
 * to manage navigation without URL changes.
 * 
 * @module components/features/shared-folder-tree
 */
'use client'

import { File, Folder, Tree } from "@/components/ui/file-tree";
import { useFolder } from "@/hooks/use-folder";

/**
 * Represents a folder node in the tree hierarchy.
 * 
 * @internal
 */
interface FolderNode {
    /** Unique folder identifier */
    id: string;
    /** Display name of the folder */
    folder_name: string;
    /** Array of files in the folder */
    files?: {id: string; file_name: string }[];
    /** Array of subfolders (recursive structure) */
    subfolders: FolderNode[];
    /** Whether this is the root folder */
    is_root: boolean;
}

/**
 * Tree component for displaying shared folder hierarchy.
 * 
 * Fetches and displays the complete folder tree structure from the FolderContext.
 * Supports recursive rendering of nested folders and files. Highlights the currently
 * active folder based on FolderContext state.
 * 
 * @returns Interactive tree structure of folders and files
 * 
 * @example
 * ```tsx
 * <SharedFolderTree />
 * ```
 * 
 * @example
 * ```tsx
 * // In a shared folder sidebar
 * <SharedAppSidebar>
 *   <SharedFolderTree />
 * </SharedAppSidebar>
 * ```
 * 
 * @remarks
 * - Uses rootFolder from FolderContext (useFolder hook)
 * - Highlights active folder with blue background
 * - Files are displayed as non-clickable leaf nodes
 * - Folders are collapsible/expandable
 * - Clicking folder updates currentFolder in FolderContext
 * - No URL changes (navigation managed by context)
 * - Read-only: designed for shared folder views
 * 
 * @see {@link useFolder} for the folder context hook
 * @see {@link FolderTree} for the regular (non-shared) version
 */
export function SharedFolderTree() {
    const { rootFolder } = useFolder();

    return (
        <Tree>
            <RenderFolder folder={rootFolder}/>
        </Tree>
    );
}

/**
 * Helper component to recursively render a folder and its contents.
 * 
 * @param props - Component props
 * @param props.folder - The folder node to render
 * @returns Rendered folder with subfolders and files
 * 
 * @internal
 */
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