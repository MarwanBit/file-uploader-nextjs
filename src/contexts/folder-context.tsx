'use client'

import React, { createContext, useState, useEffect } from "react";
import { Folder } from "@/types/types";
import { FolderApiService } from "@/api-services/folder-api.service";
import { ApiError } from "@/lib/api-client";

/**
 * @fileoverview React context for managing folder state across the application.
 * 
 * This module provides a context and provider for managing folder-related state,
 * including root folder, current folder navigation, share tokens, and folder maps.
 * It handles fetching shared folder contents and maintaining folder hierarchy state.
 * 
 * @module contexts/folder-context
 */

/**
 * Props interface for the FolderContext.
 * 
 * Defines the shape of the context value, including state variables and their
 * setter functions for managing folder navigation and sharing.
 * 
 * @interface FolderContextProps
 */
export interface FolderContextProps{
    /** The root folder of the user or shared folder tree */
    rootFolder: Folder | null;
    /** Setter for the root folder */
    setRootFolder: React.Dispatch<React.SetStateAction<Folder | null>>;
    /** The currently viewed folder in the navigation */
    currentFolder: Folder | null;
    /** Setter for the current folder */
    setCurrentFolder: React.Dispatch<React.SetStateAction<Folder | null>>;
    /** Share token for accessing shared folders (if any) */
    shareToken: string | null;
    /** Setter for the share token */
    setShareToken: React.Dispatch<React.SetStateAction<string | null>>;
    /** Map of folder IDs to folder objects for O(1) lookup */
    folderMap: Record<string, Folder>;
    /** Setter for the folder map */
    setFolderMap: React.Dispatch<React.SetStateAction<Record<string, Folder>>>;
}

/**
 * React context for folder state management.
 * 
 * This context provides folder-related state and setters to all components
 * within the FolderProvider tree. Access it using the {@link useFolder} hook.
 * 
 * @type {React.Context<FolderContextProps | null>}
 * 
 * @see {@link useFolder} for the hook to access this context
 * @see {@link FolderProvider} for the context provider component
 */
export const FolderContext = createContext<FolderContextProps | null>(null);

/**
 * Context provider component for folder state management.
 * 
 * This provider manages folder navigation state, including root folder, current folder,
 * share tokens, and folder maps. It automatically fetches shared folder contents when
 * a share token is provided or updated.
 * 
 * @param props - Component props
 * @param props.children - Child components that will have access to the context
 * @param props.initialShareToken - Optional initial share token for shared folder access
 * 
 * @returns JSX element wrapping children with folder context
 * 
 * @example
 * ```typescript
 * import { FolderProvider } from '@/contexts/folder-context';
 * 
 * function App() {
 *   return (
 *     <FolderProvider>
 *       <FileExplorer />
 *     </FolderProvider>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // With initial share token
 * function SharedView({ token }: { token: string }) {
 *   return (
 *     <FolderProvider initialShareToken={token}>
 *       <SharedFileExplorer />
 *     </FolderProvider>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Nested usage with useFolder hook
 * function FolderApp() {
 *   return (
 *     <FolderProvider>
 *       <Navigation />
 *       <FolderView />
 *     </FolderProvider>
 *   );
 * }
 * 
 * function FolderView() {
 *   const { currentFolder, rootFolder } = useFolder();
 *   
 *   return (
 *     <div>
 *       <Breadcrumb root={rootFolder} current={currentFolder} />
 *       <FileList folder={currentFolder} />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * - Automatically fetches shared folder contents when share token changes
 * - Constructs a folder map for efficient folder lookups by ID
 * - Sets both root folder and current folder when loading shared content
 * - Share token can be updated dynamically via setShareToken
 * - All state is initialized to null until data is loaded
 * - Uses FolderApiService for API calls
 * 
 * @see {@link useFolder} for accessing the context
 * @see {@link FolderContextProps} for the context shape
 * @see {@link FolderApiService} for API methods used
 */
export const FolderProvider = ({ children, initialShareToken } : { 
    children : React.ReactNode;
    initialShareToken?: string;
 }) => {
    const [rootFolder, setRootFolder] = useState<Folder | null>(null);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [folderMap, setFolderMap] = useState<Record<string, Folder>>({});

    // initialize share token
    useEffect(() => {
        if (initialShareToken && !shareToken) {
            setShareToken(initialShareToken);
        }
    }, [initialShareToken, shareToken]);

    // now on the share token changing, we want to update the rootFolder and currentFolder
    useEffect(() => {
        const getRootFolderContents = async () => {
            try {
                if (!shareToken) {
                    return;
                }
                const data = await FolderApiService.getSharedRootFolderContents(shareToken);
                if (!(data instanceof ApiError)) {
                    setRootFolder(data);
                    // now we need to construct the folder
                    setFolderMap(await FolderApiService.constructFolderMap(data));
                    console.log(folderMap);
                    setCurrentFolder(data);
                }
            } catch (error) {
                console.error("Error occurred: ", error);
            }
        };
        getRootFolderContents();
    }, [shareToken]);

    return (
        <FolderContext.Provider value={{
            rootFolder, setRootFolder, 
            currentFolder, setCurrentFolder,
            shareToken, setShareToken,
            folderMap, setFolderMap,
        }}>
            { children }
        </FolderContext.Provider>
    )
}