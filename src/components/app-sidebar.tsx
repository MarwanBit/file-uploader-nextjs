'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { FolderTree } from '@/components/features/folder-tree/folder-tree';
import { useState, useEffect } from "react";
import NewFileButton from "@/components/features/new-file-button/new-file-button";
import NewFolderButton from "./features/new-folder-button/new-folder-button";
import ShareFolderButton from "./features/share-folder-button/share-folder-button";
import DeleteFolderButton from "./features/delete-folder-button/delete-folder-button";
import { FolderApiService } from "@/api-services/folder-api.service";
import { ApiError } from "@/lib/api-client";

/**
 * @fileoverview Main application sidebar component for folder navigation and operations.
 * @module components/app-sidebar
 */

/**
 * Main sidebar component for the authenticated user's file explorer.
 * 
 * Displays folder operations (new folder, new file, share, delete) and a
 * hierarchical folder tree for navigation. Supports both direct folder access
 * and share token-based access.
 * 
 * @param props - Component props
 * @param props.folderId - The ID of the current folder being viewed (null for root)
 * @param props.shareToken - Optional share token for accessing shared folders
 * @returns Sidebar UI with folder operations and navigation tree
 * 
 * @example
 * ```tsx
 * <AppSidebar folderId="folder-123" shareToken={null} />
 * ```
 */
export function AppSidebar({ folderId, shareToken }: { 
  folderId : string | null,
  shareToken : string | null 
}) {
  const [fId, setfId] = useState<string | null>(folderId);

  useEffect(() => {
    const getFolderController = async () => {
      if (fId || !shareToken) {
        return;
      } else {
        try {
          const data = await FolderApiService.getFolderWithoutContents(shareToken);
          if (!(data instanceof ApiError)) {
            setfId(data.id);
          }
        } catch (error) {
          console.error("Error occured: ", error);
        }
      }
    }
    getFolderController();
  }, [fId, shareToken]);

  useEffect(() => {
    console.log("fId updated:", fId);
  }, [fId]);


  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <NewFolderButton readOnly={false} folderId={fId}/>
                    <NewFileButton readOnly={false}/>
                    <ShareFolderButton readOnly={false}/>
                    <DeleteFolderButton readOnly={false}/>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarGroupLabel>File Directory</SidebarGroupLabel>
            <SidebarGroupContent>
                <FolderTree folderId={fId} readOnly={false}/>
            </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}