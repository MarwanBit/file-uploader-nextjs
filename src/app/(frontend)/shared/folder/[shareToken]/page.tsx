'use client'

import { SignedIn, UserButton, SignOutButton } from "@clerk/nextjs";
import SharedDirectoryBreadCrumb from "@/components/features/shared-directory-breadcrumb/shared-directory-breadcrumb";
import DirectoryBreadcrumbSkeleton from "@/components/features/directory-breadcrumb/directory-breadcrumb-skeleton";
import { SharedFileSidebar } from "@/components/features/shared-file-sidebar/shared-file-sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconLogout } from "@tabler/icons-react";
import { useState, Suspense } from "react";
import { useFolder } from "@/hooks/use-folder";
import SharedFolderTable from "@/components/features/shared-folder-table/shared-folder-table";
import FolderTableSkeleton from "@/components/features/folder-table/folder-table-skeleton";
import { File } from "@/types/types";

export default function SharedFolderPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const { currentFolder, isLoading, shareToken } = useFolder();

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
                <Suspense fallback={
                    <div className="flex flex-row items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full"/>
                        <Skeleton className="h-10 w-24"/>
                    </div>
                }>
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
                </Suspense>
            </div>
            
            <Suspense fallback={<DirectoryBreadcrumbSkeleton />}>
                {isLoading ? (
                    <DirectoryBreadcrumbSkeleton />
                ) : (
                    <SharedDirectoryBreadCrumb/>
                )}
            </Suspense>
    
            <Suspense fallback={<FolderTableSkeleton rows={8} />}>
                {isLoading ? (
                    <FolderTableSkeleton rows={8} />
                ) : (
                    <SharedFolderTable
                        files={currentFolder?.files ? currentFolder.files : []}
                        folders={currentFolder?.subfolders ? currentFolder.subfolders : []}
                        handleRowClick={handleRowClick}/>
                )}
            </Suspense>
    
            <SharedFileSidebar
                file={selectedFile}
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                readOnly={true}
                shareToken={shareToken}/>    
        </div>
      );
}