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
import NewFileButton from "@/components/features/new-file-button/new-file-button";
import NewFolderButton from "./features/new-folder-button/new-folder-button";
import ShareFolderButton from "./features/share-folder-button/share-folder-button";
import DeleteFolderButton from "./features/delete-folder-button/delete-folder-button";
import { useAuthFolder } from "@/hooks/use-auth-folder";

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
 * @returns Sidebar UI with folder operations and navigation tree
 * 
 * @example
 * ```tsx
 * <AppSidebar/>
 * ```
 */
export function AppSidebar() {
  const { rootFolderId, folderTreeRefreshKey } = useAuthFolder();
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <NewFolderButton />
                    <NewFileButton />
                    <ShareFolderButton />
                    <DeleteFolderButton />
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarGroupLabel>File Directory</SidebarGroupLabel>
            <SidebarGroupContent>
                <FolderTree folderId={rootFolderId} readOnly={false} refreshKey={folderTreeRefreshKey}/>
            </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}