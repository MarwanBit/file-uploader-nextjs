/**
 * @fileoverview Breadcrumb navigation for shared folder views.
 * 
 * This component displays a breadcrumb trail for shared folders, allowing
 * navigation within the shared folder hierarchy. Unlike the regular breadcrumb,
 * this version uses the FolderContext to manage navigation without URL changes
 * and computes ancestors securely from the local folder map.
 * 
 * @module components/features/shared-directory-breadcrumb
 */
import { FolderApiService } from "@/api-services/folder-api.service";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useFolder } from "@/hooks/use-folder";
import { useState, useEffect } from 'react';

/**
 * Breadcrumb navigation component for shared folder views.
 * 
 * Displays a breadcrumb trail from the shared root folder to the current folder.
 * Uses the FolderContext to manage state and navigation. Clicking breadcrumb
 * items updates the current folder without changing the URL (since shared folders
 * use a single URL with token-based access).
 * 
 * @returns Breadcrumb navigation for shared folders
 * 
 * @example
 * ```tsx
 * // In a shared folder page
 * <SharedDirectoryBreadCrumb />
 * ```
 * 
 * @example
 * ```tsx
 * // Usage with other shared components
 * <div>
 *   <SharedDirectoryBreadCrumb />
 *   <SharedFolderTable folders={folders} files={files} />
 * </div>
 * ```
 * 
 * @remarks
 * - Uses `useFolder` hook for accessing FolderContext
 * - Computes ancestors securely from local folder map (no API calls)
 * - Updates ancestors when rootFolder, currentFolder, or folderMap changes
 * - Last breadcrumb item is bolded (current folder)
 * - Clicking breadcrumb items calls `setCurrentFolder` from context
 * - Uses `#` href with preventDefault to avoid URL changes
 * - Returns empty breadcrumb if no ancestors available
 * - Secure navigation ensures users can only access folders in the shared tree
 * 
 * @see {@link useFolder} for the folder context hook
 * @see {@link FolderApiService.getAncestorsSecurely} for secure ancestor computation
 */
export default function SharedDirectoryBreadCrumb() {
    const { rootFolder, currentFolder, setCurrentFolder, folderMap } = useFolder();
    const [ancestors, setAncestors] = useState<{ id: string, name: string}[]>([]);

    // update ancestors when dependencies change
    useEffect(() => {
        const updateAncestors = async() => {
            if (rootFolder && currentFolder && folderMap && Object.keys(folderMap).length > 0) {
                const newAncestors = await FolderApiService.getAncestorsSecurely(rootFolder, currentFolder, folderMap);
                setAncestors(newAncestors);
            } else {
                setAncestors([]);
            }    
        };
        updateAncestors();
    }, [rootFolder, currentFolder, folderMap]);

    // now I want to set ancestors
    const handleBreadcrumbClick = (folderId: string) => {
        const folder = folderMap[folderId];
        if (folder) {
            setCurrentFolder(folder);
        }
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {ancestors && ancestors.map((folder, index) => (
                    <>                    
                        <BreadcrumbItem>
                            <BreadcrumbLink 
                                href={'#'}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleBreadcrumbClick(folder.id);
                                }}
                            >
                                {(index === ancestors.length - 1)
                                ? <b>{folder.name}</b>
                                : folder.name}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {index !== ancestors.length - 1 && (
                            <BreadcrumbSeparator/>
                        )}                   
                    </>

                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}