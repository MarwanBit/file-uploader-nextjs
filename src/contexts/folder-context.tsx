'use client'

import React, { createContext, useState, useEffect } from "react";
import { Folder } from "@/types/types";
import { FolderApiService } from "@/api-services/folder-api.service";


export interface FolderContextProps{
    rootFolder: object | null;
    setRootFolder: React.Dispatch<React.SetStateAction<object | null>>;
    currentFolder: object | null;
    setCurrentFolder: React.Dispatch<React.SetStateAction<object | null>>;
    shareToken: string | null;
    setShareToken: React.Dispatch<React.SetStateAction<string | null>>;
    folderMap: Record<string, Folder>;
    setFolderMap: React.Dispatch<React.SetStateAction<Record<string, Folder>>>;
}

export const FolderContext = createContext<FolderContextProps | null>(null);

export const FolderProvider = ({ children, initialShareToken } : { 
    children : React.ReactNode;
    initialShareToken?: string;
 }) => {
    const [rootFolder, setRootFolder] = useState<object | null>(null);
    const [currentFolder, setCurrentFolder] = useState<object | null>(null);
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
                setRootFolder(data);
                // now we need to construct the folder
                setFolderMap(await FolderApiService.constructFolderMap(data));
                console.log(folderMap);
                setCurrentFolder(data);
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