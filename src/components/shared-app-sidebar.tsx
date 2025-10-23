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
import NewFileButton from "./features/new-file-button/new-file-button";
import NewFolderButton from "./features/new-folder-button/new-folder-button";
import ShareFolderButton from "./features/share-folder-button/share-folder-button";
import DeleteFolderButton from "./features/delete-folder-button/delete-folder-button";

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
 * @param props.readOnly - Whether the shared folder is read-only (disables operations)
 * @returns Sidebar UI for shared folder navigation
 * 
 * @example
 * ```tsx
 * <SharedAppSidebar readOnly={true} />
 * ```
 */
export function SharedAppSidebar({ readOnly } : { readOnly: boolean }) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <NewFolderButton readOnly={readOnly}/>
                    <NewFileButton readOnly={readOnly}/>
                    <ShareFolderButton readOnly={readOnly}/>
                    <DeleteFolderButton readOnly={readOnly}/>
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