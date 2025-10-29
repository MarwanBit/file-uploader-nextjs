'use client';

import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";
import { useState, Suspense } from "react";
import { FileSidebar } from "@/components/features/file-sidebar/file-sidebar";
import DirectoryBreadCrumb from "@/components/features/directory-breadcrumb/directory-breadcrumb";
import DirectoryBreadcrumbSkeleton from "@/components/features/directory-breadcrumb/directory-breadcrumb-skeleton";
import FolderTable from "@/components/features/folder-table/folder-table";
import FolderTableSkeleton from "@/components/features/folder-table/folder-table-skeleton";

import { SignOutButton, UserButton, SignedIn } from "@clerk/nextjs";
import { type File } from '@/types/types';
import { Skeleton } from "../ui/skeleton";
import { useAuthFolder } from "@/hooks/use-auth-folder";

/**
 * @fileoverview Main folder view page component.
 * @module components/pages/folder-page
 */


/**
 * Main page component for displaying folder contents.
 * 
 * Shows breadcrumb navigation, folder/file table, and a file sidebar for details.
 * Fetches folder contents on mount and handles file selection for the sidebar.
 * 
 * @param props - Component props
 * @param props.folderId - The folder ID to display (defaults to null for root)
 * 
 * @example
 * ```tsx
 * <FolderPage />
 * ```
 */
export default function FolderPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { files, subFolders, isLoading } = useAuthFolder();

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
                <DirectoryBreadCrumb />
            )}
        </Suspense>

        <Suspense fallback={<FolderTableSkeleton rows={8} />}>
            {isLoading ? (
                <FolderTableSkeleton rows={8} />
            ) : (
                <FolderTable
                    files={files}
                    selectedFile={selectedFile}
                    folders={subFolders}
                    handleRowClick={handleRowClick}/>
            )}
        </Suspense>

        <FileSidebar
            file={selectedFile}
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}
            readOnly={false}/>
    </div>
  );
}