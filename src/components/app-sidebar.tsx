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

// REFACTORED


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
          setfId(data.id);
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
                <FolderTree folderId={fId}/>
            </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}