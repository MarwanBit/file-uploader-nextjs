/**
 * @fileoverview Tree component for hierarchical folder navigation.
 * 
 * This component renders an interactive tree structure showing the complete folder
 * hierarchy with nested folders and files. Highlights the currently active folder
 * and provides navigation links.
 * 
 * @module components/features/folder-tree
 */
'use client'

import { File, Folder, Tree } from "@/components/ui/file-tree";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FolderApiService } from "@/api-services/folder-api.service";
import { ApiError } from "@/lib/api-client";

/**
 * Internal interface representing a folder node in the tree.
 */
interface FolderNode {
    id: string;
    folder_name: string;
    files: {id: string; file_name: string }[];
    subfolders: FolderNode[];
    is_root: boolean;
}

/**
 * Tree component for displaying folder hierarchy.
 * 
 * Fetches and displays the complete folder tree structure starting from the root.
 * Supports recursive rendering of nested folders and files. Highlights the currently
 * active folder based on URL params.
 * 
 * @param props - Component props
 * @param props.folderId - The ID of the current folder (null for root)
 * @param props.readOnly - If true, disables navigation links
 * @returns Interactive tree structure of folders and files
 * 
 * @example
 * ```tsx
 * <FolderTree folderId="folder-123" readOnly={false} />
 * ```
 * 
 * @example
 * ```tsx
 * // For root folder
 * <FolderTree folderId={null} readOnly={false} />
 * ```
 * 
 * @remarks
 * - Fetches recursive folder structure on mount
 * - Highlights active folder with blue background
 * - Files are displayed as non-clickable leaf nodes
 * - Folders are collapsible/expandable
 * - Uses FolderApiService.getRootFolderContents
 */
export function FolderTree({ folderId, readOnly }: { 
    folderId: string | null, 
    readOnly : boolean 
}) {
    const [rootFolder, setRootFolder] = useState<FolderNode | null>(null);
    // now we'll use useEffect to fetch the rootFolder
    useEffect(() => {
        const fetchRootFolderRecursive = async () => {
            try {
                const data = await FolderApiService.getRootFolderContents(folderId);
                if (!(data instanceof ApiError)) {
                    setRootFolder(data as FolderNode);
                }
            } catch (error) {
                console.error("Error in processing Folder Tree: ", error);
            }
        };
        fetchRootFolderRecursive();
    }, [folderId]);

    return (
        <Tree data-testid="folder-tree">
            <RenderFolder folder={rootFolder} readOnly={readOnly}/>
        </Tree>
    );
}

function RenderFolder({ folder, readOnly }: { 
    folder: FolderNode | null,
    readOnly: boolean
 }) {
    const params = useParams();
    const currentFolderId = params.folderId?.[0] || null;
    const isCurrentFolder = (folder && folder.id && (folder.id === currentFolderId)) || (!currentFolderId && folder?.is_root);
    return (folder &&
        <Folder 
            value={folder.id} 
            element={
                <Link 
                    href={readOnly ? "#" : `/folders/${folder.id}`} 
                    className="hover:underline"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    {folder.folder_name}
                </Link>
            }
            className={`${
                isCurrentFolder 
                ? 'bg-blue-100 text-blue-800 font-semibold rounded px-1'
                : ''}`}
            data-testid={`folder-tree-folder-${folder?.folder_name}`}
        >
            {/* Render subfolders recursively */}
            {folder.subfolders && folder.subfolders.map((sub) => (
                <RenderFolder key={sub.id} folder={sub} readOnly={readOnly}/>
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