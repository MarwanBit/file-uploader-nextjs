import { FolderContextProps } from "@/contexts/folder-context";
import { FolderContext } from "@/contexts/folder-context";
import { useContext } from "react";

export const useFolder = (): FolderContextProps => {
    const context = useContext(FolderContext);
    if (!context) {
        throw new Error('useFolder must be inside FolderProvider!');
    }
    return context;
}