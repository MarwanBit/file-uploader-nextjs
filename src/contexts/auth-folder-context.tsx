'use client'

import React, { createContext, useState, useEffect, useCallback } from "react";
import { Folder } from "@/types/types";
import { FolderApiService } from "@/api-services/folder-api.service";
import { ApiError } from "@/lib/api-client";
import { File } from "@/types/types";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

/**
 * @fileoverview React context for managing folder state in the authenticated view.
 * 
 * This module provides a context and provider for managing folder-related state,
 * including root folder, current folder navigation, share tokens, and folder maps.
 * It handles fetching shared folder contents and maintaining folder hierarchy state.
 * 
 * @module contexts/auth-folder-context
 */

/**
 * Props interface for the AuthFolderContext.
 * 
 * Defines the shape of the context value, including state variables and their
 * setter functions for managing folder navigation and sharing.
 * 
 * @interface AuthFolderContextProps
 */
export interface AuthFolderContextProps {
    // For authenticated views
    /** The list of children files of the current folder in the authenticated view */
    files: File[] | null;
    /** Setter for the files state object */
    setFiles: React.Dispatch<React.SetStateAction<File[] | null>>;
    /** Child folders/ subfolders of the current folder in the authenticated view */
    subFolders: Folder[] | null;
    /** Setter for the subFolders state object */
    setSubFolders: React.Dispatch<React.SetStateAction<Folder[] | null>>;
    /** the currentFolderId for the authenticated view */
    currentFolderId: string | null;
    /** Setter for the currentFolderId  */
    setCurrentFolderId: React.Dispatch<React.SetStateAction<string | null>>;
    /** The root folder Id of the current authenticated user */
    rootFolderId: string | null;
    /** Setter for the rootFolderId state object */
    setRootFolderId: React.Dispatch<React.SetStateAction<string | null>>;
    /** refresh function for refetching the folder state after changes (new file, new folder, etc.) */
    fetchFolderContents: () => Promise<void>;
    /** refresh function for refetching the folder tree after changes */
    refetchFolderTree: () => void;
    /** Key that increments when folder tree needs to be refreshed */
    folderTreeRefreshKey: number;
    /** Loading state for page */
    isLoading: boolean;
    /** Setter for  */
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * React context for folder state management.
 * 
 * This context provides folder-related state and setters to all components
 * within the AuthFolderProvider tree. Access it using the {@link useFolder} hook.
 * 
 * @type {React.Context<AuthFolderContextProps | null>}
 * 
 * @see {@link useAuthFolder} for the hook to access this context
 * @see {@link AuthFolderProvider} for the context provider component
 */
export const AuthFolderContext = createContext<AuthFolderContextProps | null>(null);


/**
 * Context provider component for folder state management.
 * 
 * This provider manages folder navigation state 
 * It automatically fetches folder contents when
 * the folderId is provided or updated.
 * 
 * @param props - Component props
 * @param props.children - Child components that will have access to the context
 * @param props.initialFolderId - initialFolderId for fetching the folderContents
 * 
 * @returns JSX element wrapping children with folder context
 * 
 * @example
 * ```typescript
 * import { AuthFolderProvider } from '@/contexts/auth-folder-context';
 * 
 * function App() {
 *   return (
 *     <AuthFolderProvider initialFolderId={folderId}>
 *       <FileExplorer />
 *     </AuthFolderProvider>
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
 * @see {@link useAuthFolder} for accessing the context
 * @see {@link AuthFolderContextProps} for the context shape
 * @see {@link FolderApiService} for API methods used
 */
export const AuthFolderProvider = ({ children }: {
    children: React.ReactNode;
}) => {
    const params = useParams();
    const folderId = params.folderId ? (params.folderId as string[])[0] : null;
    const { isSignedIn } = useAuth();

    // authenticated view
    const [files, setFiles] = useState<File[] | null>(null);
    const [subFolders, setSubFolders] = useState<Folder[] | null>(null);
    const [rootFolderId, setRootFolderId] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(folderId);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [folderTreeRefreshKey, setFolderTreeRefreshKey] = useState<number>(0);
    
    // update the currentFolderId based on changes in the route
    useEffect(() => {
        setCurrentFolderId(folderId || rootFolderId);
    }, [folderId, rootFolderId]);

    // Fetch user's root folder ID on mount (once)
    useEffect(() => {
        if (!isSignedIn) return;
        
        const fetchRootFolderId = async () => {
            try {
                const response = await FolderApiService.getRootFolderId();
                if (!response || response instanceof ApiError) return;
                const { rootFolderId } = response;
                if (rootFolderId) {
                    setRootFolderId(rootFolderId);
                }
            } catch (err) {
                console.error("Error fetching root folder:", err);
            }
        };
        fetchRootFolderId();
    }, [isSignedIn]);

    // on changing of the folderId we refetch the folder contents
    const fetchFolderContents = useCallback(async () => {
        if (!isSignedIn) return;
        
        // Wait for rootFolderId to be set if we don't have a currentFolderId yet
        if (!currentFolderId && !rootFolderId) {
            return;
        }
        
        const targetFolderId = currentFolderId || rootFolderId;
        if (!targetFolderId) {
            setIsLoading(false);
            return;
        }
        
        try {
            setIsLoading(true);
            const data = await FolderApiService.getFolderContents(targetFolderId);
            if (!(data instanceof ApiError)) {
                setSubFolders(data.subfolders);
                setFiles(data.files as File[]);
            }
        } catch (err) {
            console.error("error messsage", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentFolderId, rootFolderId, isSignedIn]);

    // refetch on the change of the fetchFolderContents reference
    useEffect(() => {
        fetchFolderContents();
    }, [fetchFolderContents]);

    // Function to trigger folder tree refresh
    const refetchFolderTree = useCallback(() => {
        setFolderTreeRefreshKey(prev => prev + 1);
    }, []);

    return (
        <AuthFolderContext.Provider value={{
            files,
            setFiles,
            subFolders,
            setSubFolders,
            currentFolderId,
            setCurrentFolderId,
            rootFolderId,
            setRootFolderId,
            fetchFolderContents,
            refetchFolderTree,
            folderTreeRefreshKey,
            isLoading,
            setIsLoading
        }}>
            { children }
        </AuthFolderContext.Provider>
    )
}
