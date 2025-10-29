/**
 * @fileoverview Breadcrumb navigation component showing folder hierarchy.
 * 
 * This component displays a breadcrumb trail showing the path from the root folder
 * to the current folder. It fetches the ancestor chain from the API and renders
 * clickable links for navigation. The current folder is bolded.
 * 
 * @module components/features/directory-breadcrumb
 */
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
import { ApiError } from '@/lib/api-client';
import React from "react";
import { useAuthFolder } from '@/hooks/use-auth-folder';

/**
 * Breadcrumb navigation component for folder hierarchy.
 * 
 * Displays a breadcrumb trail from root folder to current folder, with clickable
 * links for navigation. Fetches ancestor data from the API or displays just the
 * root folder when at the root level.
 * 
 * @param props - Component props
 * 
 * @example
 * ```tsx
 * // Show breadcrumb for a specific folder
 * <DirectoryBreadCrumb  />
 * ```
 * 
 * @remarks
 * - Shows root folder name (user's first+last name) when at root
 * - Last breadcrumb item is bolded (current folder)
 * - Each item is a clickable link for navigation
 * - Uses Clerk's useUser hook for user information
 * - Fetches data on component mount and when folderId changes
 * 
 * @see {@link FolderApiService.getAncestors} for fetching ancestor data
 */
export default function DirectoryBreadCrumb() {
    const [ancestors, setAncestors] = useState<{ id: string, name: string }[] | null>(null);
    const { user } = useUser();
    const { currentFolderId } = useAuthFolder();
    useEffect(() => {
        const fetchAncestors = async () => {
            try {
                if (currentFolderId) {
                    const data = await FolderApiService.getAncestors(currentFolderId);
                    console.log(data);
                    if (!(data instanceof ApiError) && 'ancestors' in data) {
                        setAncestors(data.ancestors);
                    }
                } else {
                    // For root folder, we'll get the display_name from the API
                    // This ensures consistency with the database
                    const rootFolderId = user?.publicMetadata.root_folder as string;
                    if (rootFolderId) {
                        const rootFolderData = await FolderApiService.getFolder(rootFolderId);
                        if (!(rootFolderData instanceof ApiError)) {
                            setAncestors([{
                                id: rootFolderId,
                                name: rootFolderData.display_name || `${user?.firstName}${user?.lastName}`
                            }]);
                        }
                    }
                }
                
            } catch (error) {
                console.error("Error in processing Directory Bread Crumb: ", error);
            }
        };
        fetchAncestors();
    }, [currentFolderId, user]);

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