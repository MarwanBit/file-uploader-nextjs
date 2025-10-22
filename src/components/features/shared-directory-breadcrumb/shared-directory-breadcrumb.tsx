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

// REFACTORED

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