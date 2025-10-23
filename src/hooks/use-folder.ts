import { FolderContextProps } from "@/contexts/folder-context";
import { FolderContext } from "@/contexts/folder-context";
import { useContext } from "react";

/**
 * @fileoverview Custom React hook for accessing folder context.
 * 
 * This module provides a custom hook that safely accesses the FolderContext.
 * It ensures the hook is used within a FolderProvider and provides type-safe
 * access to folder-related state and setters.
 * 
 * @module hooks/use-folder
 */

/**
 * Custom hook to access folder context values.
 * 
 * This hook provides access to the folder context, including root folder,
 * current folder, share token, and folder map. It must be used within a
 * component that is wrapped by a FolderProvider.
 * 
 * @returns The folder context containing state and setters
 * @throws {Error} If used outside of a FolderProvider
 * 
 * @example
 * ```typescript
 * import { useFolder } from '@/hooks/use-folder';
 * 
 * function FolderView() {
 *   const { currentFolder, setCurrentFolder, rootFolder } = useFolder();
 *   
 *   if (!currentFolder) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>{currentFolder.folder_name}</h1>
 *       <p>Files: {currentFolder.files?.length || 0}</p>
 *       <p>Subfolders: {currentFolder.subfolders?.length || 0}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Navigate to a subfolder
 * function FolderNavigator() {
 *   const { currentFolder, setCurrentFolder, folderMap } = useFolder();
 *   
 *   const navigateToSubfolder = (subfolderId: string) => {
 *     const subfolder = folderMap[subfolderId];
 *     if (subfolder) {
 *       setCurrentFolder(subfolder);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       {currentFolder?.subfolders.map(subfolder => (
 *         <button 
 *           key={subfolder.id}
 *           onClick={() => navigateToSubfolder(subfolder.id)}
 *         >
 *           {subfolder.folder_name}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Handle shared folders
 * function SharedFolderView() {
 *   const { shareToken, rootFolder, setShareToken } = useFolder();
 *   
 *   if (shareToken) {
 *     return (
 *       <div>
 *         <p>Viewing shared folder</p>
 *         <p>Token: {shareToken}</p>
 *         <button onClick={() => setShareToken(null)}>
 *           Exit shared view
 *         </button>
 *       </div>
 *     );
 *   }
 *   
 *   return <div>No shared folder active</div>;
 * }
 * ```
 * 
 * @remarks
 * - Must be used within a component wrapped by {@link FolderProvider}
 * - Throws an error if used outside the provider to fail fast
 * - Provides access to root folder, current folder, share token, and folder map
 * - All state values can be null during initial loading
 * - The folder map provides O(1) lookup for any folder by ID
 * 
 * @see {@link FolderProvider} for the context provider
 * @see {@link FolderContext} for the context definition
 * @see {@link FolderContextProps} for the return type definition
 */
export const useFolder = (): FolderContextProps => {
    const context = useContext(FolderContext);
    if (!context) {
        throw new Error('useFolder must be inside FolderProvider!');
    }
    return context;
}