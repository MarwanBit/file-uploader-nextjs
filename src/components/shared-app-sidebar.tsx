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