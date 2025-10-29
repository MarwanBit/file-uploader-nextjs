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


import { SharedFolderTree } from "./features/shared-folder-tree/shared-folder-tree";
import SharedNewFileButton from "./features/shared-new-file-button/shared-new-file-button";
import SharedNewFolderButton from "./features/shared-new-folder-button/shared-new-folder-button";
import SharedShareFolderButton from "./features/shared-share-folder-button/shared-share-folder-button";
import SharedDeleteFolderButton from "./features/shared-delete-folder-button/shared-delete-folder-button";

/**
 * @fileoverview Sidebar component for shared folder viewing.
 * @module components/shared-app-sidebar
 */

/**
 * Sidebar component for viewing shared folders (read-only or editable).
 * 
 * Similar to AppSidebar but designed for shared folder access. Displays
 * folder operations and a shared folder tree. Operations can be disabled
 * based on read-only access.
 * 
 * @param props - Component props
 * 
 * @example
 * ```tsx
 * <SharedAppSidebar readOnly={true} />
 * ```
 */
export function SharedAppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SharedNewFolderButton />
                    <SharedNewFileButton />
                    <SharedShareFolderButton />
                    <SharedDeleteFolderButton />
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarGroupLabel>File Directory</SidebarGroupLabel>
            <SidebarGroupContent>
                <SharedFolderTree/>
            </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}