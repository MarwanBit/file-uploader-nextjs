'use client'

import { SignedIn, UserButton, SignOutButton } from "@clerk/nextjs";
import SharedDirectoryBreadCrumb from "@/components/features/shared-directory-breadcrumb/shared-directory-breadcrumb";
import { SharedFileSidebar } from "@/components/features/shared-file-sidebar/shared-file-sidebar";
import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";
import { useState } from "react";
import { useFolder } from "@/hooks/use-folder";
import SharedFolderTable from "@/components/features/shared-folder-table/shared-folder-table";
import { File } from "@/types/types";

export default function SharedFolderPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const { currentFolder } = useFolder();

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
            
            <SharedDirectoryBreadCrumb/>
    
            <SharedFolderTable
                files={currentFolder?.files ? currentFolder.files : []}
                folders={currentFolder?.subfolders ? currentFolder.subfolders : []}
                handleRowClick={handleRowClick}/>
    
            <SharedFileSidebar
                file={selectedFile}
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                readOnly={true}/>    
        </div>
      );
}