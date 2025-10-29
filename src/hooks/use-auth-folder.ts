import { AuthFolderContextProps } from "@/contexts/auth-folder-context";
import { AuthFolderContext } from "@/contexts/auth-folder-context";
import { useContext } from "react";

/**
 * @fileoverview Custom React hook for accessing folder context.
 * 
 * This module provides a custom hook that safely accesses the AuthFolderContext.
 * It ensures the hook is used within a AuthFolderProvider and provides type-safe
 * access to folder-related state and setters.
 * 
 * @module hooks/use-auth-folder
 */

/**
 * Custom hook to access folder context values.
 * 
 * This hook provides access to the folder context. It must be used within a
 * component that is wrapped by a AuthFolderProvider.
 * 
 * @returns The folder context containing state and setters
 * @throws {Error} If used outside of a AuthFolderProvider
 * 
 * @example
 * ```typescript
 * import { useFolder } from '@/hooks/use-auth-folder';
 * 
 * function FolderView() {
 *   const { files, setFiles, subFolders } = useAuthFolder();
 *   
 *   
 *   return (
 *     <div>
 *       <h1>{files[0].file_name}</h1>
 *       <p>Files: {files}</p>
 *       <p>Subfolders: {subFolders}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * - Must be used within a component wrapped by {@link AuthFolderProvider}
 * - Throws an error if used outside the provider to fail fast
 * - Provides access to root folder, current folder, share token, and folder map
 * - All state values can be null during initial loading
 * - The folder map provides O(1) lookup for any folder by ID
 * 
 * @see {@link AuthFolderProvider} for the context provider
 * @see {@link AuthFolderContext} for the context definition
 * @see {@link AuthFolderContextProps} for the return type definition
 */
export const useAuthFolder = (): AuthFolderContextProps => {
    const context = useContext(AuthFolderContext);
    if (!context) {
        throw new Error('useFolder must be inside FolderProvider!');
    }
    return context;
}