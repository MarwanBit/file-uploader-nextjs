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

/**
 * Breadcrumb navigation component for folder hierarchy.
 * 
 * Displays a breadcrumb trail from root folder to current folder, with clickable
 * links for navigation. Fetches ancestor data from the API or displays just the
 * root folder when at the root level.
 * 
 * @param props - Component props
 * @param props.folderId - The ID of the current folder (null for root folder)
 * @returns Breadcrumb navigation showing folder path
 * 
 * @example
 * ```tsx
 * // Show breadcrumb for a specific folder
 * <DirectoryBreadCrumb folderId="folder-123" />
 * ```
 * 
 * @example
 * ```tsx
 * // Show breadcrumb for root folder
 * <DirectoryBreadCrumb folderId={null} />
 * ```
 * 
 * @example
 * ```tsx
 * // Usage in a page component
 * function FolderPage({ folderId }) {
 *   return (
 *     <div>
 *       <DirectoryBreadCrumb folderId={folderId} />
 *       <FolderContents folderId={folderId} />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * - Fetches ancestors from API when folderId is provided
 * - Shows root folder name (user's first+last name) when at root
 * - Last breadcrumb item is bolded (current folder)
 * - Each item is a clickable link for navigation
 * - Uses Clerk's useUser hook for user information
 * - Fetches data on component mount and when folderId changes
 * 
 * @see {@link FolderApiService.getAncestors} for fetching ancestor data
 */
export default function DirectoryBreadCrumb({ folderId } : { folderId: string | null }) {
    const [ancestors, setAncestors] = useState<{ id: string, name: string }[] | null>(null);
    const { user } = useUser();
    useEffect(() => {
        const fetchAncestors = async () => {
            try {
                if (folderId) {
                    const data = await FolderApiService.getAncestors(folderId);
                    console.log(data);
                    if (!(data instanceof ApiError) && 'ancestors' in data) {
                        setAncestors(data.ancestors);
                    }
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