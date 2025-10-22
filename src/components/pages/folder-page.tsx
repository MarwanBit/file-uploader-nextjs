'use client';

import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";
import { useState } from "react";
import { FileSidebar } from "@/components/features/file-sidebar/file-sidebar";
import DirectoryBreadCrumb from "@/components/features/directory-breadcrumb/directory-breadcrumb";
import FolderTable from "@/components/features/folder-table/folder-table";

import { SignOutButton, UserButton, SignedIn } from "@clerk/nextjs";
import { type Folder } from '@/types/types';

import { useEffect } from "react";
import { FolderApiService } from "@/api-services/folder-api.service";

export type File = {
    name: string;
    size: number;
    created_at: Date;
    type: string;
    id?: string;
}

interface FolderPageProps {
    folderId?: string | null;
}

// REFACTORED

export default function FolderPage({ folderId = null }: FolderPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [files, setFiles] = useState<File[] | null>(null);
  const [subFolders, setSubFolders] = useState<Folder[]>();

  useEffect(() => {
    async function fetchFolderContents() {
        try {
            const data = await FolderApiService.getFolderContents(folderId);
            setSubFolders(data.subfolders);
            setFiles(data.files as File[]);
            console.log(data);
        } catch(err) {
            console.error("error message", err);
        }
    }
    if (!subFolders && !files) {
        fetchFolderContents();
    }
  }, [folderId]);

  const handleRowClick = (file: File) => {
    setSelectedFile(file);
    setIsSidebarOpen(true);
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedFile(null);
  }

  return (
    <div className="flex flex-col w-full m-10 items-center h-screen">

        <div className="flex flex-row items-center">
            <h1 className="text-3xl font-bold p-5">
                File Uploader
            </h1>
            <SignedIn>
                <div className="pr-2 self-center">
                    <UserButton/>
                </div>
                <SignOutButton>
                    <Button variant="outline">
                        <IconLogout/>
                        Logout
                    </Button>
                </SignOutButton>
            </SignedIn>
        </div>
        
        <DirectoryBreadCrumb 
            folderId={folderId}/>

        <FolderTable
            files={files}
            folders={subFolders}
            handleRowClick={handleRowClick}/>

        <FileSidebar
            file={selectedFile}
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}/>
    </div>
  );
}