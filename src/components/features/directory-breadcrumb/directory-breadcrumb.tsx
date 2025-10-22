import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { FolderApiService } from '@/api-services/folder-api.service';
import React from "react";

// REFACTORED


export default function DirectoryBreadCrumb({ folderId } : { folderId: string | null }) {
    const [ancestors, setAncestors] = useState<object[] | null>(null);
    const { user } = useUser();
    useEffect(() => {
        const fetchAncestors = async () => {
            try {
                if (folderId) {
                    const data = await FolderApiService.getAncestors(folderId);
                    console.log(data);
                    setAncestors(data.ancestors);
                } else {
                    const rootFolderName = user?.firstName + "" + user?.lastName;                
                    setAncestors([{
                        id: user?.publicMetadata.root_folder as string,
                        name: rootFolderName
                    }]);
                }
                
            } catch (error) {
                console.error("Error in processing Directory Bread Crumb: ", error);
            }
        };
        fetchAncestors();
    }, [folderId, user]);

    return (
        <Breadcrumb data-testid="breadcrumb">
            <BreadcrumbList>
                {ancestors && ancestors.map((folder, index) => (
                    <React.Fragment key={folder.id || `breadcrumb-${index}`}>                    
                        <BreadcrumbItem>
                            <BreadcrumbLink 
                                href={`/folders/${folder.id}`}
                            >
                                {(index === ancestors.length - 1)
                                ? <b>{folder.name}</b>
                                : folder.name}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {index !== ancestors.length - 1 && (
                            <BreadcrumbSeparator data-testid="breadcrumb-separator"/>
                        )}                   
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}